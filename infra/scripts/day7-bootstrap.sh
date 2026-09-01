#!/usr/bin/env bash
# Day 7 orchestrator — Node, PM2 app processes, nginx → EJS on :80
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if [[ ! -f .env ]]; then
  echo "Missing Backend/.env on the server. Copy .env.example and fill production values."
  exit 1
fi

echo "==> 1/4 Node + PM2"
bash infra/scripts/05-install-node-pm2.sh

echo "==> 2/4 npm ci (Backend)"
npm ci --omit=dev

echo "==> 3/4 Migrations"
npm run migrate

echo "==> 4/4 PM2 start + nginx"
pm2 delete web api 2>/dev/null || true
pm2 start infra/pm2/ecosystem.config.js
pm2 save
# Survive reboot — print instructions if first time
pm2 startup systemd -u "$USER" --hp "$HOME" || true

bash infra/scripts/06-enable-web-nginx.sh

echo
echo "Day 7 bootstrap done. Verify:"
echo "  pm2 status"
echo "  curl -s http://127.0.0.1:3000/health"
echo "  curl -s http://127.0.0.1:4000/health"
echo "  curl -sI http://127.0.0.1/ | head"
echo "  Browser: http://YOUR_EC2_PUBLIC_IP  → EJS home"
echo
echo "Sahil admin SPA (optional same day): see monorepo deploy/day-7.md"
echo "  — uses deploy/nginx/admin.conf; conflicts with ip-web default_server."
echo "  Prefer Day 8 app.<domain> for admin, or temporarily swap nginx sites."

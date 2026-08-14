#!/usr/bin/env bash
# Day 7 — enable nginx site that serves EJS on the public IP (port 80).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="$ROOT/infra/nginx/ip-web.conf"
DEST_AVAIL="/etc/nginx/sites-available/ticketbox-web"
DEST_ENABLED="/etc/nginx/sites-enabled/ticketbox-web"

if [[ ! -f "$SRC" ]]; then
  echo "Missing $SRC"
  exit 1
fi

sudo apt update
sudo apt install -y nginx
sudo systemctl enable --now nginx

sudo cp "$SRC" "$DEST_AVAIL"
sudo rm -f /etc/nginx/sites-enabled/default
# Avoid fighting Sahil's admin default_server on the same IP
if [[ -e /etc/nginx/sites-enabled/ticketbox-admin ]]; then
  echo "Disabling ticketbox-admin so EJS owns :80 (Ram Day 7 checkpoint)."
  sudo rm -f /etc/nginx/sites-enabled/ticketbox-admin
fi
sudo ln -sf "$DEST_AVAIL" "$DEST_ENABLED"

sudo nginx -t
sudo systemctl reload nginx

echo "OK — EJS should be at http://YOUR_EC2_PUBLIC_IP/"
echo "Confirm PM2 web is running: pm2 status"

#!/usr/bin/env bash
# Day 6 orchestrator — run on a fresh Ubuntu 24.04 EC2 after first SSH login
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${ROOT_DIR}"

echo "==> 1/3 Swap"
bash infra/scripts/01-swap.sh

echo "==> 2/3 PostgreSQL"
if [[ -z "${DB_PASSWORD:-}" ]]; then
  echo "export DB_PASSWORD first, then re-run this script (or run 02-postgres.sh alone)."
  exit 1
fi
bash infra/scripts/02-postgres.sh

echo "==> 3/3 Base packages useful for Day 7"
sudo apt install -y git curl ufw fail2ban

# UFW: allow SSH + HTTP/HTTPS only (do NOT open 3000/4000)
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo ufw status

echo
echo "Day 6 bootstrap complete. Checkpoint:"
echo "  free -m"
echo "  sudo systemctl status postgresql"
echo "  sudo ufw status"
echo
echo "Next (manual):"
echo "  1) Add Sahil SSH user: infra/scripts/04-add-ssh-user.sh"
echo "  2) Harden SSH only AFTER both can log in: infra/scripts/03-harden-ssh.sh"
echo "  3) Day 7: Node + PM2 + nginx"

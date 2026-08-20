#!/usr/bin/env bash
# Day 8 — enable nginx sites for apex / api. / app. on your domain
# Usage:
#   export DOMAIN=example.xyz
#   bash infra/scripts/07-enable-domain-nginx.sh
set -euo pipefail

DOMAIN="${DOMAIN:-}"
if [[ -z "${DOMAIN}" ]]; then
  echo "Set DOMAIN first, e.g.:"
  echo "  export DOMAIN=example.xyz"
  echo "  bash infra/scripts/07-enable-domain-nginx.sh"
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NGINX_DIR="$ROOT/infra/nginx"
AVAIL="/etc/nginx/sites-available"
ENABLED="/etc/nginx/sites-enabled"

render() {
  local src="$1"
  local dest="$2"
  sed "s/__DOMAIN__/${DOMAIN}/g" "$src" | sudo tee "$dest" >/dev/null
}

echo "Rendering nginx configs for DOMAIN=${DOMAIN}"
render "$NGINX_DIR/web.conf"   "$AVAIL/ticketbox-web"
render "$NGINX_DIR/api.conf"   "$AVAIL/ticketbox-api"
render "$NGINX_DIR/admin.conf" "$AVAIL/ticketbox-admin"

# Drop Day 7 IP-only / default site so Host-based vhosts win
sudo rm -f "$ENABLED/default"
sudo rm -f "$ENABLED/ticketbox-web"   # may have been ip-web symlink name
# Re-link hostname sites (web.conf overwrites ticketbox-web avail file above)
sudo ln -sf "$AVAIL/ticketbox-web"   "$ENABLED/ticketbox-web"
sudo ln -sf "$AVAIL/ticketbox-api"   "$ENABLED/ticketbox-api"
sudo ln -sf "$AVAIL/ticketbox-admin" "$ENABLED/ticketbox-admin"

# If an old ip-only file was stored under a different name:
sudo rm -f "$ENABLED/ticketbox-ip" "$AVAIL/ticketbox-ip" 2>/dev/null || true

if [[ ! -f /var/www/admin/index.html ]]; then
  echo "WARNING: /var/www/admin/index.html missing — app.${DOMAIN} will 404 until Sahil uploads dist/"
fi

sudo nginx -t
sudo systemctl reload nginx

echo
echo "Enabled:"
echo "  http://${DOMAIN}          → EJS :3000"
echo "  http://www.${DOMAIN}      → EJS :3000"
echo "  http://api.${DOMAIN}      → API :4000"
echo "  http://app.${DOMAIN}      → /var/www/admin"
echo
echo "Next: update Backend/.env origins, rebuild admin with VITE_API_URL=http://api.${DOMAIN}"
echo "      then pm2 restart all"

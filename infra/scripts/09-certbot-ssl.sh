#!/usr/bin/env bash
# Day 9 — install certbot and issue Let's Encrypt certs for all 3 hostnames
# Prereqs: Day 8 DNS A records resolve to this box; nginx sites already enabled on :80
#
# Usage:
#   export DOMAIN=yourdomain.com
#   export CERTBOT_EMAIL=you@example.com
#   bash infra/scripts/09-certbot-ssl.sh
set -euo pipefail

DOMAIN="${DOMAIN:-}"
CERTBOT_EMAIL="${CERTBOT_EMAIL:-}"

if [[ -z "${DOMAIN}" || -z "${CERTBOT_EMAIL}" ]]; then
  echo "Usage:"
  echo "  export DOMAIN=yourdomain.com"
  echo "  export CERTBOT_EMAIL=you@example.com"
  echo "  bash infra/scripts/09-certbot-ssl.sh"
  exit 1
fi

echo "Checking DNS before requesting certs..."
for host in "${DOMAIN}" "www.${DOMAIN}" "api.${DOMAIN}" "app.${DOMAIN}"; do
  echo -n "  ${host} → "
  dig +short "${host}" A | head -n 1 || true
done

sudo apt update
sudo apt install -y certbot python3-certbot-nginx

# certbot edits nginx for HTTPS + redirect
sudo certbot --nginx \
  -d "${DOMAIN}" \
  -d "www.${DOMAIN}" \
  -d "api.${DOMAIN}" \
  -d "app.${DOMAIN}" \
  --email "${CERTBOT_EMAIL}" \
  --agree-tos \
  --no-eff-email \
  --redirect \
  --non-interactive

echo
echo "Certbot done. Verify renewal timer:"
sudo systemctl list-timers | grep -i certbot || true
sudo certbot renew --dry-run

echo
echo "Browser checks:"
echo "  https://${DOMAIN}"
echo "  https://api.${DOMAIN}/health"
echo "  https://app.${DOMAIN}"
echo
echo "Update .env to https:// then: pm2 restart all"
echo "  bash infra/scripts/10-print-https-env.sh"

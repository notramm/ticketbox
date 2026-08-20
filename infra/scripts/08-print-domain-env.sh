#!/usr/bin/env bash
# Day 8 helper — print the .env values to set after DNS works
set -euo pipefail

DOMAIN="${DOMAIN:-}"
if [[ -z "${DOMAIN}" ]]; then
  echo "Usage: export DOMAIN=example.xyz && bash infra/scripts/08-print-domain-env.sh"
  exit 1
fi

cat <<EOF
# Paste into Backend/.env on the server, then: pm2 restart all

WEB_ORIGIN=http://${DOMAIN}
ADMIN_ORIGIN=http://app.${DOMAIN}
API_PUBLIC_URL=http://api.${DOMAIN}
CORS_ORIGINS=http://www.${DOMAIN}

# Sahil — rebuild admin SPA:
#   VITE_API_URL=http://api.${DOMAIN}
#   npm run build  →  upload dist/ to /var/www/admin
#
# Day 9 will switch these to https://
EOF

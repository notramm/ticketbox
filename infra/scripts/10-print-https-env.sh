#!/usr/bin/env bash
# Day 9 — print HTTPS .env / Vite / Razorpay webhook values
set -euo pipefail

DOMAIN="${DOMAIN:-}"
if [[ -z "${DOMAIN}" ]]; then
  echo "Usage: export DOMAIN=example.xyz && bash infra/scripts/10-print-https-env.sh"
  exit 1
fi

cat <<EOF
# --- Backend/.env (production) ---
WEB_ORIGIN=https://${DOMAIN}
ADMIN_ORIGIN=https://app.${DOMAIN}
API_PUBLIC_URL=https://api.${DOMAIN}
CORS_ORIGINS=https://www.${DOMAIN}

# Then:
#   pm2 restart all && pm2 save

# --- Sahil admin rebuild ---
# VITE_API_URL=https://api.${DOMAIN}
# npm run build  →  upload dist/ to /var/www/admin

# --- Razorpay Dashboard → Webhooks ---
# URL: https://api.${DOMAIN}/webhooks/razorpay
# Events: payment.captured, payment.failed
# (Disable/remove old cloudflared URL)
# Confirm RAZORPAY_WEBHOOK_SECRET matches the webhook's secret

# --- Smoke ---
# curl -s https://api.${DOMAIN}/health
# Full test payment on https://${DOMAIN} with card 4111 1111 1111 1111
EOF

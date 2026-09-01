# Day 9 — HTTPS (certbot) + live payments

**PRD checkpoint:** SSL on all 3 hostnames; Razorpay webhook on live `api.`; S3 upload works; **full test payment completes on HTTPS**.

---

## Prereqs (Day 8 done)

- [ ] Elastic IP associated
- [ ] `dig` shows Elastic IP for apex / www / api / app
- [ ] `http://` sites work via nginx hostnames
- [ ] Security group: **80 + 443** open (22 to your IP)
- [ ] Port **4000** closed publicly

---

## Non-coding checklist

### 1. Issue certificates
On EC2:

```bash
cd ~/ticketbox/Backend
export DOMAIN=yourdomain.com
export CERTBOT_EMAIL=you@example.com
bash infra/scripts/09-certbot-ssl.sh
```

Certbot installs itself, obtains certs, and rewrites nginx for HTTPS + HTTP→HTTPS redirect. Renewal runs via systemd timer (`certbot renew --dry-run` is in the script).

### 2. Switch app config to HTTPS
```bash
bash infra/scripts/10-print-https-env.sh
# Paste https:// values into Backend/.env
pm2 restart all
pm2 save
```

### 3. Rebuild admin (Sahil)
```bash
# VITE_API_URL=https://api.yourdomain.com
npm run build
# Upload dist/ → /var/www/admin
```

### 4. Razorpay webhook (live API)
1. Razorpay Dashboard → Settings → Webhooks
2. Add/update URL: `https://api.yourdomain.com/webhooks/razorpay`
3. Events: `payment.captured`, `payment.failed`
4. Copy secret → `RAZORPAY_WEBHOOK_SECRET` in `.env` if new
5. **Remove** old cloudflared / ngrok webhook
6. `pm2 restart api`

### 5. S3 live check
- `GET https://api.yourdomain.com/admin/upload-url?filename=banner.jpg` with admin JWT
- Browser PUT to presigned URL succeeds
- IAM still scoped to `s3:PutObject` on `banners/*` only

### 6. Full payment test
1. Open `https://yourdomain.com` (phone or laptop)
2. Book event → Razorpay test card `4111 1111 1111 1111`
3. Confirm ticket page loads from DB
4. Optional: close tab mid-pay → webhook still marks booking `paid`
5. Admin panel shows the booking

---

## Verify

```bash
curl -sI https://yourdomain.com | head
curl -s https://api.yourdomain.com/health
curl -sI https://app.yourdomain.com | head
sudo certbot renew --dry-run
```

No mixed-content warnings in the browser (all `https://`).

---

## Common failures

| Symptom | Fix |
|---|---|
| certbot: connection refused / timeout | SG missing 80, or DNS not pointing here yet |
| certbot: unauthorized | Wrong A record / NS not delegated |
| Webhook signature invalid | Still using cloudflared secret, or body parsed as JSON |
| CORS on admin | `ADMIN_ORIGIN=https://app.…` + rebuild SPA |
| Mixed content | Old `http://` baked into Vite `VITE_API_URL` — rebuild |

---

## Stop here

**Day 10:** Lambda auto-stop, pg_dump cron, budget proof, RUNBOOK polish, architecture diagram, cost report, teardown checklist.

---

## Files

| Path | Role |
|---|---|
| `infra/scripts/09-certbot-ssl.sh` | Install certbot + issue certs |
| `infra/scripts/10-print-https-env.sh` | HTTPS `.env` / webhook / Vite values |
| `docs/DAY9_EC2.md` | This checklist |

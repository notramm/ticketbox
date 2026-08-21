# TicketBox RUNBOOK

Operational notes for Week 2 (Days 6–10).

Architecture: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Teardown: [`TEARDOWN.md`](./TEARDOWN.md)

---

## Day 6 — EC2 is up, app not deployed yet

### SSH in

```bash
ssh -i ticketbox-key.pem ubuntu@<EC2_PUBLIC_IP>
# or
ssh -i sahil-key sahil@<EC2_PUBLIC_IP>
```

### Check swap

```bash
free -m
swapon --show
```

If missing: `bash infra/scripts/01-swap.sh`

### Check Postgres

```bash
sudo systemctl status postgresql
PGPASSWORD='...' psql -h 127.0.0.1 -U appuser -d ticketbox -c 'select now();'
```

### Firewall

```bash
sudo ufw status
# Expected: 22, 80, 443 only. Never expose 3000/4000 publicly.
```

### Locked out of SSH?

1. AWS Console → EC2 → Instance → Connect (EC2 Instance Connect / Session Manager if enabled)
2. Or stop instance → detach / fix `authorized_keys` via rescue (last resort)
3. Restore `sshd_config` backup under `/etc/ssh/sshd_config.bak.ticketbox.*`

---

## Day 7 — PM2 + nginx on IP

```bash
pm2 status
pm2 logs
pm2 restart all
sudo nginx -t && sudo systemctl reload nginx
curl -sI http://127.0.0.1/ | head
```

Survive reboot: `pm2 startup` then `pm2 save`.

---

## Day 8 — Domain + Elastic IP

```bash
# DNS must show Elastic IP
dig yourdomain.com +short
dig api.yourdomain.com +short
dig app.yourdomain.com +short

export DOMAIN=yourdomain.com
bash infra/scripts/07-enable-domain-nginx.sh
pm2 restart all
```

If site works on IP but not domain: NS not delegated, or A record still on old dynamic IP (allocate Elastic IP).

---

## Day 9 — HTTPS

```bash
export DOMAIN=yourdomain.com
export CERTBOT_EMAIL=you@example.com
bash infra/scripts/09-certbot-ssl.sh

# Renewal
sudo certbot renew --dry-run
sudo systemctl list-timers | grep certbot

# After .env https:// update
pm2 restart all
```

Webhook URL must be `https://api.<domain>/webhooks/razorpay` (not cloudflared).

Sahil admin rebuild: `VITE_API_URL=https://api.<domain>` → upload `dist/` to `/var/www/admin`.

Full guides: `docs/DAY9_EC2.md`, monorepo `deploy/day-9.md`.

---

## Day 10 — Auto-stop, backups, money

### Site down around scheduled stop?

1. Check EventBridge / Lambda invoke history (expected stop)
2. Confirm Elastic IP still associated
3. Manually start instance (console or Lambda test `{"action":"start"}`)
4. SSH → `pm2 status` → `sudo systemctl status nginx`
5. `curl -sI https://yourdomain.com`

Lambda code: `infra/lambda/ec2-schedule/`.

### DB backup

```bash
cd ~/ticketbox/Backend
set -a && source .env && set +a
export BACKUP_S3_URI=s3://YOUR_BACKUP_BUCKET/ticketbox/db/
bash infra/scripts/11-pg-dump-backup.sh
```

### DB restore

```bash
bash infra/scripts/12-restore-from-dump.sh /var/backups/ticketbox/ticketbox-YYYY-MM-DD.dump
```

### Everyday ops

| Task | Command |
|---|---|
| Restart app | `pm2 restart all` |
| App logs | `pm2 logs` |
| Nginx errors | `sudo tail -f /var/log/nginx/error.log` |
| Cert renew dry-run | `sudo certbot renew --dry-run` |
| Health | `curl -s https://api.<domain>/health` |

Cost / budget / teardown: [`COST_REPORT.md`](./COST_REPORT.md), [`BUDGET_PROOF.md`](./BUDGET_PROOF.md), [`TEARDOWN.md`](./TEARDOWN.md), [`DAY10_EC2.md`](./DAY10_EC2.md).
Deploy process note: [`FTP_VS_RSYNC.md`](./FTP_VS_RSYNC.md).

# TicketBox RUNBOOK

Operational notes. Expand through Week 2.

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

---

## Later (stubs)

- Restart app: `pm2 restart all`
- Logs: `pm2 logs` / `sudo tail -f /var/log/nginx/error.log`
- DB restore from S3 dump (Day 10)
- Site down at 11PM: check auto-stop Lambda, Elastic IP, `pm2 status`, nginx
- HTTPS: certbot (Day 9)

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

## Later (stubs)

- Restart app: `pm2 restart all` (Day 7)
- Logs: `pm2 logs` / `sudo journalctl -u nginx`
- DB restore from S3 dump (Day 10)
- Site down at 11PM: check auto-stop Lambda, Elastic IP, `pm2 status`, nginx

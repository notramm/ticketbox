# Day 8 — Domain + Route 53 + Elastic IP

**PRD checkpoint:** all 3 hostnames resolve; browser opens the site by **domain name** (HTTP is fine — HTTPS is Day 9).

| Hostname | Serves |
|---|---|
| `yourdomain.com` / `www.` | EJS public site (PM2 `web` :3000) |
| `api.yourdomain.com` | JSON API (PM2 `api` :4000) |
| `app.yourdomain.com` | React admin SPA (`/var/www/admin`) |

---

## Non-coding (AWS + registrar) — do this first

### 1. Buy a domain
Cheap `.xyz` / `.in` is fine (₹100–300). Keep the receipt for the cost report.

### 2. Elastic IP (do this before trusting DNS)
1. EC2 → Elastic IPs → **Allocate** (ap-south-1)
2. **Associate** with your TicketBox instance
3. Note the Elastic IP — this must be what DNS points at  
   (without it, auto-stop/start tomorrow kills DNS)

### 3. Route 53 hosted zone
1. Route 53 → Hosted zones → **Create** → enter your domain
2. Copy the **4 NS records** AWS shows
3. At your registrar → change nameservers to those 4 NS values
4. Wait for delegation (often 10–30+ minutes)

### 4. A records (all → Elastic IP)
In the hosted zone, create:

| Record | Type | Value |
|---|---|---|
| `yourdomain.com` | A | Elastic IP |
| `www.yourdomain.com` | A | Elastic IP |
| `api.yourdomain.com` | A | Elastic IP |
| `app.yourdomain.com` | A | Elastic IP |

### 5. Verify from your laptop
```bash
dig yourdomain.com +short
dig api.yourdomain.com +short
dig app.yourdomain.com +short
# All should print the Elastic IP
```

Windows: `nslookup yourdomain.com`

---

## On the EC2 box (coding helpers)

```bash
cd ~/ticketbox/Backend   # your path

export DOMAIN=yourdomain.com   # no https://, no trailing slash
bash infra/scripts/07-enable-domain-nginx.sh

# See .env values to paste:
bash infra/scripts/08-print-domain-env.sh
```

Edit `Backend/.env`:

```bash
WEB_ORIGIN=http://yourdomain.com
ADMIN_ORIGIN=http://app.yourdomain.com
API_PUBLIC_URL=http://api.yourdomain.com
CORS_ORIGINS=http://www.yourdomain.com
```

```bash
pm2 restart all
pm2 save
```

### Sahil (admin SPA)
Rebuild with:
```bash
VITE_API_URL=http://api.yourdomain.com
```
Upload `dist/` contents to `/var/www/admin`.

### Close temporary API port (if opened on Day 7)
Security group: **remove inbound 4000**. Only 22 / 80 / 443.

---

## Verify checkpoint

```bash
curl -sI -H "Host: yourdomain.com" http://127.0.0.1/ | head
curl -s -H "Host: api.yourdomain.com" http://127.0.0.1/health
curl -sI -H "Host: app.yourdomain.com" http://127.0.0.1/ | head
```

Browser:
- `http://yourdomain.com` → EJS
- `http://api.yourdomain.com/health` → JSON ok
- `http://app.yourdomain.com` → admin login

---

## Stop here

**Day 9:** certbot HTTPS for all 3 hostnames + point Razorpay webhook to `https://api.…/webhooks/razorpay`.

---

## Files

| Path | Role |
|---|---|
| `infra/nginx/{web,api,admin}.conf` | Templates with `__DOMAIN__` |
| `infra/scripts/07-enable-domain-nginx.sh` | Render + enable all 3 sites |
| `infra/scripts/08-print-domain-env.sh` | Print `.env` / Vite values |

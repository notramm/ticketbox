# Day 7 — Node + PM2 + nginx (Ram)

**PRD checkpoint:** open `http://YOUR_EC2_PUBLIC_IP` → **EJS public home** (not the React admin).

Sahil’s admin-on-`:80` guide lives in the monorepo at `deploy/day-7.md`. That site uses `default_server` too — **only one** can own port 80 on the raw IP. For Ram’s checkpoint, enable `ip-web.conf`. Put admin on `app.<domain>` on Day 8 (or temporarily swap nginx sites when Sahil demos).

---

## On the server

```bash
cd ~/ticketbox/Backend   # or wherever the Backend repo lives

# Production .env — set at least:
#   NODE_ENV=production
#   DATABASE_URL=...
#   JWT_SECRET=...
#   WEB_ORIGIN=http://YOUR_EC2_PUBLIC_IP
#   API_PUBLIC_URL=http://YOUR_EC2_PUBLIC_IP:4000   # until Day 8 proxy
#   ADMIN_ORIGIN=http://YOUR_EC2_PUBLIC_IP           # if admin SPA also on IP
#   Razorpay + AWS keys as needed

bash infra/scripts/day7-bootstrap.sh
```

Manual pieces:

```bash
bash infra/scripts/05-install-node-pm2.sh
npm ci --omit=dev
npm run migrate
pm2 start infra/pm2/ecosystem.config.js
pm2 save
pm2 startup    # run the printed sudo command, then pm2 save again
bash infra/scripts/06-enable-web-nginx.sh
```

---

## Verify

```bash
pm2 status
curl -s http://127.0.0.1:3000/health
curl -s http://127.0.0.1:4000/health
curl -sI http://127.0.0.1/ | head
```

Laptop browser: `http://YOUR_EC2_PUBLIC_IP` → TicketBox EJS events list.

---

## Security group (Day 7)

| Port | Source | Why |
|---|---|---|
| 22 | Your IP | SSH |
| 80 | `0.0.0.0/0` | nginx → EJS |
| 443 | `0.0.0.0/0` | ready for Day 9 |

**Do not open 3000.** Prefer not opening 4000 either (PRD). If Sahil needs the admin SPA calling the API by IP before Day 8 DNS, temporarily open **4000** (see monorepo `deploy/day-7.md`) and close it after `api.` exists.

---

## Files

| Path | Role |
|---|---|
| `infra/pm2/ecosystem.config.js` | `web` :3000 + `api` :4000 |
| `infra/nginx/ip-web.conf` | IP `:80` → EJS |
| `infra/nginx/{web,api,admin}.conf` | Day 8+ hostname stubs |
| `infra/scripts/05-install-node-pm2.sh` | Node 20 + PM2 |
| `infra/scripts/06-enable-web-nginx.sh` | Enable EJS site |
| `infra/scripts/day7-bootstrap.sh` | Full Day 7 run |

---

## Stop here

No Route 53, no certbot yet (Days 8–9).

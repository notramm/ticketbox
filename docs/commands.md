# commands.md — personal command log

Written as I go. Day 1 onward.

## Day 1

```bash
# Project init
npm init -y
npm install express knex pg pino pino-pretty dotenv bcrypt joi
npm install -D nodemon

# Postgres (Windows) — create app DB + user (run as superuser)
# Adjust password to match .env DATABASE_URL
psql -U postgres -h localhost
CREATE USER appuser WITH PASSWORD 'yourpassword';
CREATE DATABASE ticketbox OWNER appuser;
\q

# Migrations + seeds
npm run migrate
npm run seed

# Start processes
npm run start:api
npm run start:web
```

## Day 2

```bash
npm install jsonwebtoken
npm run start:api

# Smoke tests (PowerShell)
Invoke-RestMethod http://localhost:4000/health
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/auth/login -ContentType 'application/json' -Body '{"email":"admin@ticketbox.local","password":"Admin@12345"}'
$login.token
Invoke-RestMethod -Uri http://localhost:4000/auth/me -Headers @{ Authorization = "Bearer $($login.token)" }
# Expect 401 without token:
try { Invoke-WebRequest -Uri http://localhost:4000/admin/events } catch { $_.Exception.Response.StatusCode }
```

## Day 3

```bash
npm install ejs express-ejs-layouts
npm run start:web

# Browser
# http://localhost:3000          → published events from DB
# http://localhost:3000/events/intro-to-nodejs
```

## Day 4

```bash
npm install razorpay cors

# Put Razorpay TEST keys in .env (never live keys), then restart API.
# If password has @, URL-encode it in DATABASE_URL (e.g. @ -> %40).
# API_PUBLIC_URL=http://localhost:4000
# WEB_ORIGIN=http://localhost:3000

npm run start:api
npm run start:web
# or: npm run dev:api / npm run dev:web (watches .env too)


# Browser flow:
# Event page → Continue to checkout → Pay with Razorpay
# Test card: 4111 1111 1111 1111, any future expiry, any CVV
```

## Day 5

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# 1) cloudflared tunnel (webhook reaches localhost)
cloudflared tunnel --url http://localhost:4000
# Copy https://xxxx.trycloudflare.com

# 2) Razorpay Dashboard → Settings → Webhooks → Add
# URL: https://xxxx.trycloudflare.com/webhooks/razorpay
# Events: payment.captured, payment.failed
# Copy webhook secret → RAZORPAY_WEBHOOK_SECRET in .env → restart API

# 3) AWS (for upload-url only on Day 5)
# - Create S3 bucket in ap-south-1 (e.g. ticketbox-banners)
# - Block public access OFF for banners OR use CloudFront later
# - IAM user with s3:PutObject on arn:aws:s3:::ticketbox-banners/banners/*
# - Put AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / S3_BUCKET_NAME in .env
# - Optional: S3_PUBLIC_BASE_URL=https://ticketbox-banners.s3.ap-south-1.amazonaws.com

# Demo proof: start payment, close browser tab mid-flow → booking still becomes paid via webhook
```

## Day 6 (EC2 — mostly AWS Console + SSH)

```bash
# Local
chmod 400 ticketbox-key.pem
ssh -i ticketbox-key.pem ubuntu@<EC2_PUBLIC_IP>

# On server (after cloning/copying repo)
export DB_PASSWORD='strong-password'
bash infra/scripts/day6-bootstrap.sh

# Verify
free -m
sudo systemctl status postgresql
sudo ufw status

# Add Sahil user, then harden SSH last
# bash infra/scripts/04-add-ssh-user.sh
# bash infra/scripts/03-harden-ssh.sh
```

Full checklist: `docs/DAY6_EC2.md`

## Day 7 (Node + PM2 + nginx → EJS on :80)

```bash
# On EC2, in Backend/
bash infra/scripts/day7-bootstrap.sh

pm2 status
curl -sI http://127.0.0.1/ | head
# Browser: http://YOUR_EC2_PUBLIC_IP → EJS home

# Survive reboot
pm2 startup
pm2 save
```

Full checklist: `docs/DAY7_EC2.md`  
Sahil admin SPA on IP (optional/conflict): monorepo `deploy/day-7.md`

## Day 8 (Domain + Route 53 + Elastic IP)

```bash
# After DNS A records point at Elastic IP:
export DOMAIN=yourdomain.com
bash infra/scripts/07-enable-domain-nginx.sh
bash infra/scripts/08-print-domain-env.sh
# Update .env origins → pm2 restart all
# dig yourdomain.com +short
```

Full checklist: `docs/DAY8_EC2.md`  
Sahil side: monorepo `deploy/day-8.md`, `deploy/dns-checklist.md`

## Day 9 (HTTPS + live webhook + payment)

```bash
export DOMAIN=yourdomain.com
export CERTBOT_EMAIL=you@example.com
bash infra/scripts/09-certbot-ssl.sh
bash infra/scripts/10-print-https-env.sh
# Update .env to https:// → pm2 restart all
# Razorpay webhook → https://api.DOMAIN/webhooks/razorpay
# Rebuild admin: VITE_API_URL=https://api.DOMAIN
```

Full checklist: `docs/DAY9_EC2.md`

## Day 10 (auto-stop, backups, wrap-up docs)

```bash
# On EC2 — one backup now
set -a && source .env && set +a
export BACKUP_S3_URI=s3://YOUR_BACKUP_BUCKET/ticketbox/db/
bash infra/scripts/11-pg-dump-backup.sh

# Lambda: zip + upload Backend/infra/lambda/ec2-schedule/handler.py
# EventBridge: stop + start with {"action":"stop"|"start"}
# Fill COST_REPORT.md / BUDGET_PROOF.md with screenshots (do not commit secrets)
```

Full checklist: `docs/DAY10_EC2.md`  
Also: `docs/FTP_VS_RSYNC.md`, `docs/ARCHITECTURE.md`, `docs/TEARDOWN.md`
Sahil side: monorepo `deploy/day-9.md`, `deploy/https-checklist.md`

## Day 10 (auto-stop, backups, wrap-up)

```bash
# Lambda: see infra/lambda/ec2-schedule/README.md

# DB dump (on EC2)
cd ~/ticketbox/Backend
set -a && source .env && set +a
export BACKUP_S3_URI=s3://YOUR_BACKUP_BUCKET/ticketbox/db/
bash infra/scripts/11-pg-dump-backup.sh

# Optional restore drill
# bash infra/scripts/12-restore-from-dump.sh /var/backups/ticketbox/ticketbox-YYYY-MM-DD.dump
```

Docs: `docs/DAY10_EC2.md`, `ARCHITECTURE.md`, `COST_REPORT.md`, `BUDGET_PROOF.md`, `TEARDOWN.md`  
Sahil: monorepo `deploy/day-10.md`, `deploy/wrapup-checklist.md`

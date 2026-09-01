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

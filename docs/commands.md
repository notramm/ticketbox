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

require('dotenv').config();

const express = require('express');
const path = require('path');
const logger = require('./config/logger');
const db = require('./config/db');

const app = express();
const port = Number(process.env.WEB_PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', async (_req, res) => {
  try {
    await db.raw('select 1 as ok');
    res.json({ status: 'ok', db: 'ok', uptime: process.uptime() });
  } catch (err) {
    logger.error({ err }, 'web health check failed');
    res.status(503).json({ status: 'error', db: 'error', uptime: process.uptime() });
  }
});

// Day 1 stub — real EJS pages land on Day 3
app.get('/', async (_req, res) => {
  try {
    const events = await db('events')
      .where({ status: 'published' })
      .whereNull('deleted_at')
      .orderBy('starts_at', 'asc');

    res.type('html').send(`<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><title>TicketBox</title></head>
<body>
  <h1>TicketBox</h1>
  <p>Day 1 scaffold — ${events.length} published event(s) in DB.</p>
  <ul>
    ${events
      .map(
        (e) =>
          `<li><strong>${e.title}</strong> — ₹${(e.price_paise / 100).toFixed(0)} · ${e.total_seats - e.seats_sold} seats left</li>`
      )
      .join('')}
  </ul>
</body>
</html>`);
  } catch (err) {
    logger.error({ err }, 'home page failed');
    res.status(500).send('Database error');
  }
});

app.listen(port, () => {
  logger.info({ port, service: 'web' }, 'TicketBox web listening');
});

require('dotenv').config();

const express = require('express');
const logger = require('./config/logger');
const db = require('./config/db');

const app = express();
const port = Number(process.env.API_PORT) || 4000;

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await db.raw('select 1 as ok');
    res.json({
      status: 'ok',
      db: 'ok',
      uptime: process.uptime(),
    });
  } catch (err) {
    logger.error({ err }, 'health check failed');
    res.status(503).json({
      status: 'error',
      db: 'error',
      uptime: process.uptime(),
    });
  }
});

app.listen(port, () => {
  logger.info({ port, service: 'api' }, 'TicketBox API listening');
});

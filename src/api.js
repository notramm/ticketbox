require('./config/env');

const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const healthRoutes = require('./routes/api/health');
const authRoutes = require('./routes/api/auth');
const eventsRoutes = require('./routes/api/events');
const paymentsRoutes = require('./routes/api/payments');

const app = express();
const port = Number(process.env.API_PORT) || 4000;

const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';

app.use(
  cors({
    origin: webOrigin,
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.use(healthRoutes);
app.use('/auth', authRoutes);
app.use(eventsRoutes);
app.use(paymentsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  logger.info({ port, service: 'api' }, 'TicketBox API listening');
});

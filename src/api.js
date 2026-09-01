require('./config/env');

const express = require('express');
const cors = require('cors');
const logger = require('./config/logger');
const { notFoundHandler, errorHandler, asyncHandler } = require('./middleware/errorHandler');
const { rawJsonBody } = require('./middleware/rawBody');
const webhooksController = require('./controllers/webhooks.controller');

const healthRoutes = require('./routes/api/health');
const authRoutes = require('./routes/api/auth');
const eventsRoutes = require('./routes/api/events');
const paymentsRoutes = require('./routes/api/payments');
const webhooksAdminRoutes = require('./routes/api/webhooks');
const uploadsRoutes = require('./routes/api/uploads');

const app = express();
const port = Number(process.env.API_PORT) || 4000;

const webOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
const adminOrigin = process.env.ADMIN_ORIGIN || 'http://localhost:5173';
const extraOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [
  ...new Set([webOrigin, adminOrigin, 'http://127.0.0.1:5173', ...extraOrigins]),
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser tools (no Origin) and configured frontends
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// CRITICAL: webhook must see raw body bytes for HMAC — before express.json()
app.post(
  '/webhooks/razorpay',
  rawJsonBody,
  asyncHandler(webhooksController.razorpay)
);

app.use(express.json());

app.use(healthRoutes);
app.use('/auth', authRoutes);
app.use(eventsRoutes);
app.use(paymentsRoutes);
app.use(webhooksAdminRoutes);
app.use(uploadsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  logger.info({ port, service: 'api' }, 'TicketBox API listening');
});

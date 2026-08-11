require('./config/env');

const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const logger = require('./config/logger');
const db = require('./config/db');
const { formatPrice, formatDate, seatsLeft } = require('./utils/format');
const { bannerUrl } = require('./utils/bannerUrl');
const { errorHandler } = require('./middleware/errorHandler');

const homeRoutes = require('./routes/web/home');
const eventRoutes = require('./routes/web/event');
const bookingRoutes = require('./routes/web/booking');
const checkoutRoutes = require('./routes/web/checkout');
const mediaRoutes = require('./routes/web/media');

const app = express();
const port = Number(process.env.WEB_PORT) || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layout');
app.use(expressLayouts);

app.locals.formatPrice = formatPrice;
app.locals.formatDate = formatDate;
app.locals.seatsLeft = seatsLeft;
app.locals.bannerUrl = bannerUrl;
// Kept for older templates; prefer bannerUrl() which proxies private buckets
app.locals.s3PublicBaseUrl = process.env.S3_PUBLIC_BASE_URL || '';

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(mediaRoutes);

app.get('/health', async (_req, res) => {
  try {
    await db.raw('select 1 as ok');
    res.json({ status: 'ok', db: 'ok', uptime: process.uptime() });
  } catch (err) {
    logger.error({ err }, 'web health check failed');
    res.status(503).json({ status: 'error', db: 'error', uptime: process.uptime() });
  }
});

app.use(homeRoutes);
app.use(eventRoutes);
app.use(bookingRoutes);
app.use(checkoutRoutes);

function renderErrorPage(res, status, heading, message) {
  res.status(status).send(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${heading} · TicketBox</title>
  <link rel="stylesheet" href="/css/main.css">
</head>
<body class="page page--error">
  <main class="site-main">
    <h1>${heading}</h1>
    <p>${message}</p>
    <p><a href="/">Back to events</a></p>
  </main>
</body>
</html>`);
}

app.use((req, res, next) => {
  if (req.accepts('html')) {
    return renderErrorPage(res, 404, 'Page not found', 'That page does not exist.');
  }
  return res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  logger.error({ err }, 'web request failed');

  if (req.accepts('html')) {
    const heading = status === 404 ? 'Event not found' : 'Something went wrong';
    const message =
      status === 404
        ? 'That event is missing or not published.'
        : 'Please try again in a moment.';
    return renderErrorPage(res, status, heading, message);
  }

  return errorHandler(err, req, res, next);
});

app.listen(port, () => {
  logger.info({ port, service: 'web' }, 'TicketBox web listening');
});

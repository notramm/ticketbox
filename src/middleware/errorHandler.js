const logger = require('../config/logger');

function notFoundHandler(_req, res) {
  res.status(404).json({ error: 'Not found' });
}

function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (status >= 500) {
    logger.error({ err }, 'unhandled error');
  } else {
    logger.warn({ err: { message, status, details: err.details } }, 'request error');
  }

  const body = { error: message };
  if (err.details) body.details = err.details;
  res.status(status).json(body);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = {
  notFoundHandler,
  errorHandler,
  asyncHandler,
  HttpError,
};

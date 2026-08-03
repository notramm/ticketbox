const jwt = require('jsonwebtoken');
const { HttpError } = require('./errorHandler');

/**
 * Verify Bearer JWT and attach req.user = { id, email, role }.
 */
function authenticate(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new HttpError(401, 'Missing or invalid Authorization header'));
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return next(new HttpError(401, 'Missing or invalid Authorization header'));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: Number(payload.sub),
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (_err) {
    return next(new HttpError(401, 'Invalid or expired token'));
  }
}

module.exports = { authenticate };

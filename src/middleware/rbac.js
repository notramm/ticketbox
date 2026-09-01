const { HttpError } = require('./errorHandler');

/**
 * requireRole('admin') — must run after authenticate.
 */
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new HttpError(401, 'Unauthorized'));
    }
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, 'Forbidden'));
    }
    return next();
  };
}

module.exports = { requireRole };

const { HttpError } = require('./errorHandler');

/**
 * Joi schema wrapper.
 * - body  → replaces req.body
 * - query → sets req.validatedQuery (Express 5 req.query is not safely reassignable)
 * - params → sets req.validatedParams
 */
function validate(schema, options = {}) {
  const source = options.source || 'body';

  return (req, _res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      const details = error.details.map((d) => d.message);
      return next(new HttpError(400, 'Validation failed', details));
    }

    if (source === 'query') {
      req.validatedQuery = value;
    } else if (source === 'params') {
      req.validatedParams = value;
    } else {
      req.body = value;
    }

    return next();
  };
}

module.exports = { validate };

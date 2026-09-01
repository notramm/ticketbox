const Joi = require('joi');

const checkoutSchema = Joi.object({
  event_id: Joi.number().integer().positive().required(),
  customer_name: Joi.string().trim().min(2).max(255).required(),
  email: Joi.string().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().min(8).max(32).required(),
  qty: Joi.number().integer().min(1).max(20).required(),
});

const paymentVerifySchema = Joi.object({
  order_id: Joi.string().required(),
  payment_id: Joi.string().required(),
  signature: Joi.string().required(),
});

const adminBookingsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  status: Joi.string().valid('created', 'paid', 'failed', 'expired'),
  q: Joi.string().trim().max(255).allow(''),
});

module.exports = {
  checkoutSchema,
  paymentVerifySchema,
  adminBookingsQuerySchema,
};

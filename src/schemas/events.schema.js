const Joi = require('joi');

const createEventSchema = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(255).required(),
  title: Joi.string().trim().min(3).max(255).required(),
  description: Joi.string().allow('', null),
  banner_key: Joi.string().max(512).allow(null, ''),
  price_paise: Joi.number().integer().min(0).required(),
  total_seats: Joi.number().integer().min(1).required(),
  starts_at: Joi.date().iso().required(),
  status: Joi.string().valid('draft', 'published').default('draft'),
});

const updateEventSchema = Joi.object({
  slug: Joi.string().trim().lowercase().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(255),
  title: Joi.string().trim().min(3).max(255),
  description: Joi.string().allow('', null),
  banner_key: Joi.string().max(512).allow(null, ''),
  price_paise: Joi.number().integer().min(0),
  total_seats: Joi.number().integer().min(1),
  starts_at: Joi.date().iso(),
})
  .min(1)
  .messages({
    'object.min': 'At least one field is required to update',
  });

const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

module.exports = {
  createEventSchema,
  updateEventSchema,
  paginationSchema,
};

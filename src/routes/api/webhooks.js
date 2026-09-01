const express = require('express');
const webhooksController = require('../../controllers/webhooks.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { validate } = require('../../middleware/validate');
const { paginationSchema } = require('../../schemas/events.schema');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

router.get(
  '/admin/webhooks',
  authenticate,
  requireRole('admin'),
  validate(paginationSchema, { source: 'query' }),
  asyncHandler(webhooksController.list)
);

router.get(
  '/admin/dashboard',
  authenticate,
  requireRole('admin'),
  asyncHandler(webhooksController.dashboard)
);

module.exports = router;

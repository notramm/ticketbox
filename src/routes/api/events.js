const express = require('express');
const eventsController = require('../../controllers/events.controller');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const {
  createEventSchema,
  updateEventSchema,
  paginationSchema,
} = require('../../schemas/events.schema');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

// Public
router.get(
  '/events',
  validate(paginationSchema, { source: 'query' }),
  asyncHandler(eventsController.listPublished)
);
router.get('/events/:slug', asyncHandler(eventsController.getBySlug));

// Admin
router.get(
  '/admin/events',
  authenticate,
  requireRole('admin'),
  validate(paginationSchema, { source: 'query' }),
  asyncHandler(eventsController.listAdmin)
);
router.post(
  '/admin/events',
  authenticate,
  requireRole('admin'),
  validate(createEventSchema),
  asyncHandler(eventsController.create)
);
router.patch(
  '/admin/events/:id',
  authenticate,
  requireRole('admin'),
  validate(updateEventSchema),
  asyncHandler(eventsController.update)
);
router.patch(
  '/admin/events/:id/publish',
  authenticate,
  requireRole('admin'),
  asyncHandler(eventsController.publish)
);
router.patch(
  '/admin/events/:id/unpublish',
  authenticate,
  requireRole('admin'),
  asyncHandler(eventsController.unpublish)
);

module.exports = router;

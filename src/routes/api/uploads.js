const express = require('express');
const uploadsController = require('../../controllers/uploads.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

router.get(
  '/admin/upload-url',
  authenticate,
  requireRole('admin'),
  asyncHandler(uploadsController.getUploadUrl)
);

module.exports = router;

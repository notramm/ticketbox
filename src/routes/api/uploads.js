const express = require('express');
const multer = require('multer');
const uploadsController = require('../../controllers/uploads.controller');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image uploads are allowed (.jpg .jpeg .png .webp .gif)'));
  },
});

router.get(
  '/admin/upload-url',
  authenticate,
  requireRole('admin'),
  asyncHandler(uploadsController.getUploadUrl)
);

// Proxied upload — browser never talks to S3 (no bucket CORS needed)
router.post(
  '/admin/upload',
  authenticate,
  requireRole('admin'),
  (req, res, next) => {
    upload.single('banner')(req, res, (err) => {
      if (err) {
        err.status = 400;
        return next(err);
      }
      return next();
    });
  },
  asyncHandler(uploadsController.uploadBanner)
);

module.exports = router;

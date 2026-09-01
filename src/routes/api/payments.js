const express = require('express');
const paymentsController = require('../../controllers/payments.controller');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/rbac');
const {
  checkoutSchema,
  paymentVerifySchema,
  adminBookingsQuerySchema,
} = require('../../schemas/bookings.schema');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

router.post(
  '/checkout',
  validate(checkoutSchema),
  asyncHandler(paymentsController.checkout)
);

router.post(
  '/payment/verify',
  validate(paymentVerifySchema),
  asyncHandler(paymentsController.verify)
);

router.get(
  '/bookings/:ticket_code',
  asyncHandler(paymentsController.getByTicketCode)
);

router.get(
  '/admin/bookings',
  authenticate,
  requireRole('admin'),
  validate(adminBookingsQuerySchema, { source: 'query' }),
  asyncHandler(paymentsController.listAdmin)
);

module.exports = router;

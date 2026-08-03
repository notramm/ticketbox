const express = require('express');
const authController = require('../../controllers/auth.controller');
const { validate } = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const { loginSchema } = require('../../schemas/auth.schema');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

router.post('/login', validate(loginSchema), asyncHandler(authController.login));
router.get('/me', authenticate, asyncHandler(authController.me));

module.exports = router;

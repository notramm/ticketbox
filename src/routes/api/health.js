const express = require('express');
const db = require('../../config/db');
const logger = require('../../config/logger');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

router.get(
  '/health',
  asyncHandler(async (_req, res) => {
    try {
      await db.raw('select 1 as ok');
      res.json({
        status: 'ok',
        db: 'ok',
        uptime: process.uptime(),
      });
    } catch (err) {
      logger.error({ err }, 'health check failed');
      res.status(503).json({
        status: 'error',
        db: 'error',
        uptime: process.uptime(),
      });
    }
  })
);

module.exports = router;

const express = require('express');
const db = require('../../config/db');
const { asyncHandler } = require('../../middleware/errorHandler');

const router = express.Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const events = await db('events')
      .where({ status: 'published' })
      .whereNull('deleted_at')
      .orderBy('starts_at', 'asc');

    res.render('home', {
      title: 'Upcoming events',
      bodyClass: 'page--home',
      events,
    });
  })
);

module.exports = router;

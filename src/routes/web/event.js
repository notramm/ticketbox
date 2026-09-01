const express = require('express');
const db = require('../../config/db');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');

const router = express.Router();

router.get(
  '/events/:slug',
  asyncHandler(async (req, res) => {
    const event = await db('events')
      .where({
        slug: req.params.slug,
        status: 'published',
      })
      .whereNull('deleted_at')
      .first();

    if (!event) {
      throw new HttpError(404, 'Event not found');
    }

    res.render('event', {
      title: event.title,
      bodyClass: 'page--event',
      event,
    });
  })
);

module.exports = router;

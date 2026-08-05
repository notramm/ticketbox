const express = require('express');
const db = require('../../config/db');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');

const router = express.Router();

router.get(
  '/checkout',
  asyncHandler(async (req, res) => {
    const eventId = Number(req.query.event_id);
    const qty = Number(req.query.qty || 1);

    if (!eventId || Number.isNaN(eventId)) {
      throw new HttpError(400, 'Missing event_id');
    }

    const event = await db('events')
      .where({ id: eventId, status: 'published' })
      .whereNull('deleted_at')
      .first();

    if (!event) {
      throw new HttpError(404, 'Event not found');
    }

    const seatsLeft = event.total_seats - event.seats_sold;
    if (qty < 1 || qty > seatsLeft) {
      throw new HttpError(400, 'Invalid quantity for available seats');
    }

    res.render('checkout', {
      title: 'Checkout',
      bodyClass: 'page--checkout',
      event,
      qty,
      customer_name: req.query.customer_name || '',
      email: req.query.email || '',
      phone: req.query.phone || '',
      amount_paise: event.price_paise * qty,
      apiBaseUrl: process.env.API_PUBLIC_URL || 'http://localhost:4000',
      scripts: '<script src="https://checkout.razorpay.com/v1/checkout.js"></script><script src="/js/checkout.js" defer></script>',
    });
  })
);

module.exports = router;

const express = require('express');
const db = require('../../config/db');
const { asyncHandler, HttpError } = require('../../middleware/errorHandler');

const router = express.Router();

router.get('/bookings/lookup', (req, res) => {
  res.render('booking-lookup', {
    title: 'My booking',
    bodyClass: 'page--booking-lookup',
    message: null,
    booking: null,
  });
});

router.post(
  '/bookings/lookup',
  asyncHandler(async (req, res) => {
    const ticketCode = String(req.body.ticket_code || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();

    if (!ticketCode || !email) {
      return res.status(400).render('booking-lookup', {
        title: 'My booking',
        bodyClass: 'page--booking-lookup',
        message: 'Ticket code and email are required.',
        booking: null,
      });
    }

    const booking = await db('bookings as b')
      .join('events as e', 'e.id', 'b.event_id')
      .select(
        'b.ticket_code',
        'b.customer_name',
        'b.email',
        'b.qty',
        'b.amount_paise',
        'b.status',
        'e.title',
        'e.slug',
        'e.starts_at'
      )
      .whereRaw('LOWER(b.email) = ?', [email])
      .andWhere({ 'b.ticket_code': ticketCode })
      .first();

    if (!booking) {
      return res.status(404).render('booking-lookup', {
        title: 'My booking',
        bodyClass: 'page--booking-lookup',
        message: 'No booking found for that ticket code and email.',
        booking: null,
      });
    }

    return res.render('booking-lookup', {
      title: 'My booking',
      bodyClass: 'page--booking-lookup',
      message: null,
      booking,
    });
  })
);

router.get(
  '/bookings/:ticket_code',
  asyncHandler(async (req, res) => {
    const booking = await db('bookings as b')
      .join('events as e', 'e.id', 'b.event_id')
      .select(
        'b.ticket_code',
        'b.customer_name',
        'b.email',
        'b.phone',
        'b.qty',
        'b.amount_paise',
        'b.status',
        'e.title',
        'e.slug',
        'e.starts_at'
      )
      .where({ 'b.ticket_code': req.params.ticket_code })
      .first();

    if (!booking) {
      throw new HttpError(404, 'Booking not found');
    }

    res.render('confirmation', {
      title: 'Booking confirmed',
      bodyClass: 'page--confirmation',
      booking,
    });
  })
);

module.exports = router;

const express = require('express');

const router = express.Router();

router.get('/bookings/lookup', (req, res) => {
  const { ticket_code: ticketCode, email } = req.query;
  let message;

  if (ticketCode || email) {
    message = 'Booking lookup will be wired on Day 4–5 when payments issue ticket codes.';
  }

  res.render('booking-lookup', {
    title: 'My booking',
    bodyClass: 'page--booking-lookup',
    message,
  });
});

module.exports = router;

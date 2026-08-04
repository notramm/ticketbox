const express = require('express');

const router = express.Router();

// Day 3 stub — Day 4 wires Razorpay order creation
router.get('/checkout', (req, res) => {
  res.render('checkout', {
    title: 'Checkout',
    bodyClass: 'page--checkout',
    slug: req.query.slug || null,
  });
});

module.exports = router;

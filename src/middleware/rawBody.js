const express = require('express');

/**
 * Use only on the Razorpay webhook route — never globally.
 * Mount this route BEFORE app.use(express.json()).
 */
const rawJsonBody = express.raw({ type: 'application/json' });

module.exports = { rawJsonBody };

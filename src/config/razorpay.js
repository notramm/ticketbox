const Razorpay = require('razorpay');
const { HttpError } = require('../middleware/errorHandler');

let client;

function getRazorpay() {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret || key_id.endsWith('...') || key_id === 'rzp_test_...') {
    throw new HttpError(
      503,
      'Razorpay test keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env, then restart the API'
    );
  }

  if (key_id.startsWith('rzp_live_')) {
    throw new HttpError(500, 'Live Razorpay keys are forbidden in this project');
  }

  // Recreate client if env changed after nodemon/restart
  if (!client || client.key_id !== key_id) {
    client = new Razorpay({ key_id, key_secret });
    client.key_id = key_id;
  }

  return client;
}

function getKeyId() {
  return process.env.RAZORPAY_KEY_ID;
}

module.exports = { getRazorpay, getKeyId };

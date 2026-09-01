const webhooksService = require('../services/webhooks.service');

async function razorpay(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const eventIdHeader = req.headers['x-razorpay-event-id'];
  const result = await webhooksService.handleRazorpayWebhook({
    rawBody: req.body,
    signature,
    eventIdHeader,
  });
  res.status(200).json(result);
}

async function list(req, res) {
  const page = Number(req.validatedQuery?.page || req.query.page || 1);
  const limit = Number(req.validatedQuery?.limit || req.query.limit || 20);
  const result = await webhooksService.listWebhookEvents({ page, limit });
  res.json(result);
}

async function dashboard(req, res) {
  const stats = await webhooksService.getDashboard();
  res.json(stats);
}

module.exports = { razorpay, list, dashboard };

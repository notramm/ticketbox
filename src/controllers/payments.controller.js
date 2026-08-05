const paymentsService = require('../services/payments.service');

async function checkout(req, res) {
  const result = await paymentsService.checkout(req.body);
  res.status(201).json(result);
}

async function verify(req, res) {
  const result = await paymentsService.verifyPayment(req.body);
  res.json(result);
}

async function getByTicketCode(req, res) {
  const booking = await paymentsService.getBookingByTicketCode(req.params.ticket_code);
  res.json(booking);
}

async function listAdmin(req, res) {
  const result = await paymentsService.listAdminBookings(req.validatedQuery || req.query);
  res.json(result);
}

module.exports = {
  checkout,
  verify,
  getByTicketCode,
  listAdmin,
};

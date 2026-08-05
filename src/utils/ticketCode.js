const crypto = require('crypto');

/**
 * Ticket codes are issued on payment success (verify optimistic / webhook truth).
 * Format: TB-XXXXXXXX (uppercase hex)
 */
function generateTicketCode() {
  return `TB-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

module.exports = { generateTicketCode };

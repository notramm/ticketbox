/**
 * Display helpers for EJS templates.
 * Money is always stored as paise; never float in DB.
 */

function formatPrice(paise) {
  const rupees = Number(paise) / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(rupees);
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function seatsLeft(event) {
  return event.total_seats - event.seats_sold;
}

module.exports = { formatPrice, formatDate, seatsLeft };

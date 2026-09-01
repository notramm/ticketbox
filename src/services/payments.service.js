const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../config/logger');
const { getRazorpay, getKeyId } = require('../config/razorpay');
const { HttpError } = require('../middleware/errorHandler');
const { generateTicketCode } = require('../utils/ticketCode');

/**
 * Create booking + Razorpay order inside a seat-lock transaction.
 * Seats are reserved here (FOR UPDATE + seats_sold++) per PRD §7.3.
 */
async function checkout({ event_id, customer_name, email, phone, qty }) {
  const razorpay = getRazorpay();

  const result = await db.transaction(async (trx) => {
    const event = await trx('events')
      .where({ id: event_id })
      .whereNull('deleted_at')
      .forUpdate()
      .first();

    if (!event) {
      throw new HttpError(404, 'Event not found');
    }

    if (event.status !== 'published') {
      throw new HttpError(400, 'Event is not available for booking');
    }

    const seatsLeft = event.total_seats - event.seats_sold;
    if (qty > seatsLeft) {
      throw new HttpError(400, `Only ${seatsLeft} seat(s) left`);
    }

    const amount_paise = event.price_paise * qty;

    const [booking] = await trx('bookings')
      .insert({
        event_id: event.id,
        customer_name,
        email,
        phone,
        qty,
        amount_paise,
        status: 'created',
        ticket_code: null,
      })
      .returning('*');

    await trx('events').where({ id: event.id }).update({
      seats_sold: event.seats_sold + qty,
      updated_at: trx.fn.now(),
    });

    return { booking, event };
  });

  let order;
  try {
    order = await razorpay.orders.create({
      amount: result.booking.amount_paise,
      currency: 'INR',
      receipt: `bk_${result.booking.id}`,
      notes: {
        booking_id: String(result.booking.id),
        event_id: String(result.event.id),
      },
    });
  } catch (err) {
    logger.error({ err }, 'Razorpay order create failed');
    // Release reserved seats if gateway call fails
    await db.transaction(async (trx) => {
      await trx('bookings').where({ id: result.booking.id }).update({ status: 'failed' });
      const event = await trx('events').where({ id: result.event.id }).forUpdate().first();
      if (event) {
        await trx('events')
          .where({ id: event.id })
          .update({
            seats_sold: Math.max(0, event.seats_sold - result.booking.qty),
            updated_at: trx.fn.now(),
          });
      }
    });
    throw new HttpError(502, 'Could not create payment order');
  }

  await db('payments').insert({
    booking_id: result.booking.id,
    gateway_order_id: order.id,
    amount_paise: result.booking.amount_paise,
    status: order.status || 'created',
    raw: order,
  });

  return {
    order_id: order.id,
    booking_id: result.booking.id,
    key_id: getKeyId(),
    amount_paise: result.booking.amount_paise,
    currency: 'INR',
  };
}

/**
 * Browser callback HMAC verify — optimistic UI only.
 * Day 5 webhook remains the authoritative source of truth.
 */
async function verifyPayment({ order_id, payment_id, signature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new HttpError(503, 'Razorpay is not configured');
  }

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${order_id}|${payment_id}`)
    .digest('hex');

  if (expected !== signature) {
    throw new HttpError(400, 'Invalid payment signature');
  }

  const payment = await db('payments').where({ gateway_order_id: order_id }).first();
  if (!payment) {
    throw new HttpError(404, 'Payment order not found');
  }

  const booking = await db('bookings').where({ id: payment.booking_id }).first();
  if (!booking) {
    throw new HttpError(404, 'Booking not found');
  }

  // Already finalized (e.g. webhook won the race)
  if (booking.status === 'paid' && booking.ticket_code) {
    return { ticket_code: booking.ticket_code, booking_id: booking.id };
  }

  const ticket_code = booking.ticket_code || generateTicketCode();

  await db.transaction(async (trx) => {
    await trx('bookings').where({ id: booking.id }).update({
      status: 'paid',
      ticket_code,
    });

    await trx('payments').where({ id: payment.id }).update({
      gateway_payment_id: payment_id,
      status: 'captured',
      method: payment.method,
      raw: {
        ...(payment.raw || {}),
        verify: { order_id, payment_id, signature, at: new Date().toISOString() },
      },
    });
  });

  return { ticket_code, booking_id: booking.id };
}

async function getBookingByTicketCode(ticket_code) {
  const booking = await db('bookings as b')
    .join('events as e', 'e.id', 'b.event_id')
    .select(
      'b.id as booking_id',
      'b.ticket_code',
      'b.customer_name',
      'b.email',
      'b.phone',
      'b.qty',
      'b.amount_paise',
      'b.status',
      'b.created_at',
      'e.id as event_id',
      'e.slug',
      'e.title',
      'e.starts_at',
      'e.price_paise'
    )
    .where({ 'b.ticket_code': ticket_code })
    .first();

  if (!booking) {
    throw new HttpError(404, 'Booking not found');
  }

  return booking;
}

async function listAdminBookings({ page, limit, status, q }) {
  const offset = (page - 1) * limit;
  let base = db('bookings as b')
    .join('events as e', 'e.id', 'b.event_id')
    .select(
      'b.id',
      'b.ticket_code',
      'b.customer_name',
      'b.email',
      'b.phone',
      'b.qty',
      'b.amount_paise',
      'b.status',
      'b.created_at',
      'e.title as event_title',
      'e.slug as event_slug'
    );

  if (status) base = base.where('b.status', status);
  if (q) {
    const like = `%${q}%`;
    base = base.andWhere((builder) => {
      builder
        .whereILike('b.email', like)
        .orWhereILike('b.customer_name', like)
        .orWhereILike('b.ticket_code', like);
    });
  }

  const countQuery = base.clone().clearSelect().count({ count: '*' });
  const [{ count }] = await countQuery;
  const data = await base.clone().orderBy('b.created_at', 'desc').limit(limit).offset(offset);

  return {
    data,
    pagination: {
      page,
      limit,
      total: Number(count),
      total_pages: Math.ceil(Number(count) / limit) || 0,
    },
  };
}

module.exports = {
  checkout,
  verifyPayment,
  getBookingByTicketCode,
  listAdminBookings,
};

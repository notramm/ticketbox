const crypto = require('crypto');
const db = require('../config/db');
const logger = require('../config/logger');
const { HttpError } = require('../middleware/errorHandler');
const { generateTicketCode } = require('../utils/ticketCode');

function verifyWebhookSignature(rawBody, signature) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new HttpError(
      503,
      'RAZORPAY_WEBHOOK_SECRET is not configured. Add it from Razorpay Dashboard > Webhooks'
    );
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return expected === signature;
}

/**
 * Authoritative payment handler.
 * Seats are already reserved at checkout (Day 4 FOR UPDATE) — do NOT increment again.
 */
async function applyPaymentCaptured(payload) {
  const paymentEntity = payload?.payload?.payment?.entity;
  if (!paymentEntity) {
    throw new Error('payment.captured payload missing payment.entity');
  }

  const orderId = paymentEntity.order_id;
  const paymentId = paymentEntity.id;
  const method = paymentEntity.method || null;

  const payment = await db('payments').where({ gateway_order_id: orderId }).first();
  if (!payment) {
    throw new Error(`No local payment for order ${orderId}`);
  }

  const booking = await db('bookings').where({ id: payment.booking_id }).first();
  if (!booking) {
    throw new Error(`No booking for payment ${payment.id}`);
  }

  // Idempotent success path
  if (booking.status === 'paid' && booking.ticket_code) {
    await db('payments').where({ id: payment.id }).update({
      gateway_payment_id: paymentId,
      status: 'captured',
      method,
      raw: {
        ...(payment.raw || {}),
        webhook_payment: paymentEntity,
      },
    });
    return { booking_id: booking.id, ticket_code: booking.ticket_code, already_paid: true };
  }

  const ticket_code = booking.ticket_code || generateTicketCode();

  await db.transaction(async (trx) => {
    await trx('bookings').where({ id: booking.id }).update({
      status: 'paid',
      ticket_code,
    });

    await trx('payments').where({ id: payment.id }).update({
      gateway_payment_id: paymentId,
      status: 'captured',
      method,
      raw: {
        ...(payment.raw || {}),
        webhook_payment: paymentEntity,
      },
    });
  });

  return { booking_id: booking.id, ticket_code, already_paid: false };
}

async function applyPaymentFailed(payload) {
  const paymentEntity = payload?.payload?.payment?.entity;
  if (!paymentEntity) return;

  const orderId = paymentEntity.order_id;
  const payment = await db('payments').where({ gateway_order_id: orderId }).first();
  if (!payment) return;

  const booking = await db('bookings').where({ id: payment.booking_id }).first();
  if (!booking || booking.status === 'paid') return;

  await db.transaction(async (trx) => {
    await trx('bookings').where({ id: booking.id }).update({ status: 'failed' });
    await trx('payments').where({ id: payment.id }).update({
      gateway_payment_id: paymentEntity.id,
      status: 'failed',
      method: paymentEntity.method || null,
      raw: {
        ...(payment.raw || {}),
        webhook_payment: paymentEntity,
      },
    });

    // Release seats reserved at checkout
    const event = await trx('events').where({ id: booking.event_id }).forUpdate().first();
    if (event) {
      await trx('events')
        .where({ id: event.id })
        .update({
          seats_sold: Math.max(0, event.seats_sold - booking.qty),
          updated_at: trx.fn.now(),
        });
    }
  });
}

async function handleRazorpayWebhook({ rawBody, signature, eventIdHeader }) {
  if (!Buffer.isBuffer(rawBody)) {
    throw new HttpError(500, 'Webhook body must be a raw Buffer — check express.raw() mounting order');
  }

  const signatureValid = verifyWebhookSignature(rawBody, signature || '');

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (_err) {
    throw new HttpError(400, 'Invalid JSON body');
  }

  // Prefer Razorpay's event id header for idempotency
  const gatewayEventId =
    eventIdHeader ||
    payload.event_id ||
    payload.id ||
    `${payload.event}:${payload.payload?.payment?.entity?.id}:${payload.created_at}`;
  const eventType = payload.event;

  if (!gatewayEventId || !eventType) {
    throw new HttpError(400, 'Missing event id or event type');
  }

  if (!signatureValid) {
    await db('webhook_events')
      .insert({
        gateway_event_id: `${gatewayEventId}:invalid:${Date.now()}`,
        event_type: eventType,
        signature_valid: false,
        payload,
        processed_at: db.fn.now(),
        error: 'Invalid signature',
      })
      .catch(() => {});
    throw new HttpError(400, 'Invalid signature');
  }

  // Idempotency: UNIQUE(gateway_event_id)
  try {
    await db('webhook_events').insert({
      gateway_event_id: String(gatewayEventId),
      event_type: eventType,
      signature_valid: true,
      payload,
      processed_at: null,
      error: null,
    });
  } catch (err) {
    if (err.code === '23505') {
      logger.info({ gatewayEventId }, 'duplicate webhook — returning 200');
      return { ok: true, duplicate: true };
    }
    throw err;
  }

  let processError = null;
  try {
    if (eventType === 'payment.captured') {
      await applyPaymentCaptured(payload);
    } else if (eventType === 'payment.failed') {
      await applyPaymentFailed(payload);
    }
  } catch (err) {
    processError = err.message || String(err);
    logger.error({ err, eventType, gatewayEventId }, 'webhook processing failed');
  }

  await db('webhook_events')
    .where({ gateway_event_id: String(gatewayEventId) })
    .update({
      processed_at: db.fn.now(),
      error: processError,
    });

  // Always 200 after accepting a valid signed event (avoid Razorpay retry storms)
  return { ok: true, duplicate: false, error: processError };
}

async function listWebhookEvents({ page = 1, limit = 20 } = {}) {
  const offset = (page - 1) * limit;
  const base = db('webhook_events');
  const [{ count }] = await base.clone().count({ count: '*' });
  const data = await base
    .clone()
    .orderBy('id', 'desc')
    .limit(limit)
    .offset(offset);

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

async function getDashboard() {
  const [{ revenue }] = await db('bookings')
    .where({ status: 'paid' })
    .sum({ revenue: 'amount_paise' });

  const [{ tickets_sold }] = await db('bookings')
    .where({ status: 'paid' })
    .sum({ tickets_sold: 'qty' });

  const [{ failed_payments }] = await db('payments')
    .where({ status: 'failed' })
    .count({ failed_payments: '*' });

  const [{ event_count }] = await db('events')
    .whereNull('deleted_at')
    .count({ event_count: '*' });

  const [{ paid_bookings }] = await db('bookings')
    .where({ status: 'paid' })
    .count({ paid_bookings: '*' });

  return {
    total_revenue_paise: Number(revenue) || 0,
    tickets_sold: Number(tickets_sold) || 0,
    failed_payments: Number(failed_payments) || 0,
    event_count: Number(event_count) || 0,
    paid_bookings: Number(paid_bookings) || 0,
  };
}

module.exports = {
  handleRazorpayWebhook,
  listWebhookEvents,
  getDashboard,
};

const db = require('../config/db');
const { HttpError } = require('../middleware/errorHandler');

function withSeatsLeft(event) {
  if (!event) return event;
  return {
    ...event,
    seats_left: event.total_seats - event.seats_sold,
  };
}

async function writeAudit({ actorId, action, entityId, meta }) {
  await db('audit_logs').insert({
    actor_id: actorId,
    action,
    entity: 'event',
    entity_id: String(entityId),
    meta: meta ?? null,
  });
}

async function listPublished({ page, limit }) {
  const offset = (page - 1) * limit;

  const base = db('events').where({ status: 'published' }).whereNull('deleted_at');

  const [{ count }] = await base.clone().count({ count: '*' });
  const rows = await base
    .clone()
    .orderBy('starts_at', 'asc')
    .limit(limit)
    .offset(offset);

  return {
    data: rows.map(withSeatsLeft),
    pagination: {
      page,
      limit,
      total: Number(count),
      total_pages: Math.ceil(Number(count) / limit) || 0,
    },
  };
}

async function getBySlug(slug) {
  const event = await db('events')
    .where({ slug, status: 'published' })
    .whereNull('deleted_at')
    .first();

  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  return withSeatsLeft(event);
}

async function listAdmin({ page, limit }) {
  const offset = (page - 1) * limit;
  const base = db('events').whereNull('deleted_at');

  const [{ count }] = await base.clone().count({ count: '*' });
  const rows = await base
    .clone()
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset);

  return {
    data: rows.map(withSeatsLeft),
    pagination: {
      page,
      limit,
      total: Number(count),
      total_pages: Math.ceil(Number(count) / limit) || 0,
    },
  };
}

async function createEvent(payload, actorId) {
  const existing = await db('events').where({ slug: payload.slug }).first();
  if (existing) {
    throw new HttpError(409, 'Event slug already exists');
  }

  const [event] = await db('events')
    .insert({
      slug: payload.slug,
      title: payload.title,
      description: payload.description ?? null,
      banner_key: payload.banner_key || null,
      price_paise: payload.price_paise,
      total_seats: payload.total_seats,
      seats_sold: 0,
      starts_at: payload.starts_at,
      status: payload.status || 'draft',
    })
    .returning('*');

  await writeAudit({
    actorId,
    action: 'event.create',
    entityId: event.id,
    meta: { slug: event.slug },
  });

  return withSeatsLeft(event);
}

async function updateEvent(id, payload, actorId) {
  const event = await db('events').where({ id }).whereNull('deleted_at').first();
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  if (payload.slug && payload.slug !== event.slug) {
    const clash = await db('events').where({ slug: payload.slug }).whereNot({ id }).first();
    if (clash) {
      throw new HttpError(409, 'Event slug already exists');
    }
  }

  if (payload.total_seats !== undefined && payload.total_seats < event.seats_sold) {
    throw new HttpError(400, 'total_seats cannot be less than seats already sold');
  }

  const [updated] = await db('events')
    .where({ id })
    .update({
      ...payload,
      updated_at: db.fn.now(),
    })
    .returning('*');

  await writeAudit({
    actorId,
    action: 'event.update',
    entityId: id,
    meta: payload,
  });

  return withSeatsLeft(updated);
}

async function setPublishStatus(id, status, actorId) {
  const event = await db('events').where({ id }).whereNull('deleted_at').first();
  if (!event) {
    throw new HttpError(404, 'Event not found');
  }

  if (event.status === status) {
    return withSeatsLeft(event);
  }

  const [updated] = await db('events')
    .where({ id })
    .update({
      status,
      updated_at: db.fn.now(),
    })
    .returning('*');

  await writeAudit({
    actorId,
    action: status === 'published' ? 'event.publish' : 'event.unpublish',
    entityId: id,
    meta: { from: event.status, to: status },
  });

  return withSeatsLeft(updated);
}

module.exports = {
  listPublished,
  getBySlug,
  listAdmin,
  createEvent,
  updateEvent,
  setPublishStatus,
};

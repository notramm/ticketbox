const eventsService = require('../services/events.service');

async function listPublished(req, res) {
  const result = await eventsService.listPublished(req.validatedQuery || req.query);
  res.json(result);
}

async function getBySlug(req, res) {
  const event = await eventsService.getBySlug(req.params.slug);
  res.json(event);
}

async function listAdmin(req, res) {
  const result = await eventsService.listAdmin(req.validatedQuery || req.query);
  res.json(result);
}

async function create(req, res) {
  const event = await eventsService.createEvent(req.body, req.user.id);
  res.status(201).json(event);
}

async function update(req, res) {
  const event = await eventsService.updateEvent(Number(req.params.id), req.body, req.user.id);
  res.json(event);
}

async function publish(req, res) {
  const event = await eventsService.setPublishStatus(
    Number(req.params.id),
    'published',
    req.user.id
  );
  res.json(event);
}

async function unpublish(req, res) {
  const event = await eventsService.setPublishStatus(
    Number(req.params.id),
    'draft',
    req.user.id
  );
  res.json(event);
}

module.exports = {
  listPublished,
  getBySlug,
  listAdmin,
  create,
  update,
  publish,
  unpublish,
};

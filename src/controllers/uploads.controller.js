const uploadsService = require('../services/uploads.service');

async function getUploadUrl(req, res) {
  const result = await uploadsService.createUploadUrl(req.query.filename);
  res.json(result);
}

module.exports = { getUploadUrl };

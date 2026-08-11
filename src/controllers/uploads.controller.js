const uploadsService = require('../services/uploads.service');
const { HttpError } = require('../middleware/errorHandler');

async function getUploadUrl(req, res) {
  const result = await uploadsService.createUploadUrl(req.query.filename);
  res.json(result);
}

async function uploadBanner(req, res) {
  if (!req.file) {
    throw new HttpError(400, 'banner file is required (field name: banner)');
  }

  const result = await uploadsService.uploadBannerBuffer({
    filename: req.file.originalname,
    buffer: req.file.buffer,
    contentType: req.file.mimetype,
  });

  res.status(201).json(result);
}

module.exports = { getUploadUrl, uploadBanner };

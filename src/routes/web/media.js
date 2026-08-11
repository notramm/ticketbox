const express = require('express');
const { asyncHandler } = require('../../middleware/errorHandler');
const mediaService = require('../../services/media.service');

const router = express.Router();

// Express 5 wildcard: /media/banners/....jpg
router.get(
  '/media/*key',
  asyncHandler(async (req, res) => {
    const key = Array.isArray(req.params.key)
      ? req.params.key.join('/')
      : String(req.params.key || '');

    const object = await mediaService.getBannerObject(key);

    res.setHeader('Content-Type', object.contentType);
    res.setHeader('Cache-Control', object.cacheControl);
    if (object.contentLength != null) {
      res.setHeader('Content-Length', String(object.contentLength));
    }

    // AWS SDK v3 Body is a Readable stream in Node
    if (object.body && typeof object.body.pipe === 'function') {
      object.body.pipe(res);
      return;
    }

    const bytes = await object.body.transformToByteArray();
    res.send(Buffer.from(bytes));
  })
);

module.exports = router;

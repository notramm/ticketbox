const { GetObjectCommand } = require('@aws-sdk/client-s3');
const { getS3Client, getBucket } = require('../config/s3');
const { HttpError } = require('../middleware/errorHandler');

async function getBannerObject(key) {
  const normalized = String(key || '').replace(/^\/+/, '');

  if (!normalized || normalized.includes('..') || !normalized.startsWith('banners/')) {
    throw new HttpError(400, 'Invalid banner key');
  }

  try {
    const client = getS3Client();
    const Bucket = getBucket();
    const result = await client.send(
      new GetObjectCommand({
        Bucket,
        Key: normalized,
      })
    );

    return {
      body: result.Body,
      contentType: result.ContentType || 'application/octet-stream',
      contentLength: result.ContentLength,
      cacheControl: 'public, max-age=86400',
    };
  } catch (err) {
    if (err.name === 'NoSuchKey' || err.$metadata?.httpStatusCode === 404) {
      throw new HttpError(404, 'Banner not found');
    }
    if (err.status === 503) throw err;
    throw new HttpError(502, 'Could not fetch banner from S3');
  }
}

module.exports = { getBannerObject };

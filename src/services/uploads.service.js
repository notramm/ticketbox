const crypto = require('crypto');
const path = require('path');
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { getS3Client, getBucket } = require('../config/s3');
const { HttpError } = require('../middleware/errorHandler');

const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

async function createUploadUrl(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new HttpError(400, 'filename query param is required');
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new HttpError(400, 'Only image uploads are allowed (.jpg .jpeg .png .webp .gif)');
  }

  const safeBase = path
    .basename(filename, ext)
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'banner';

  const key = `banners/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBase}${ext}`;
  const bucket = getBucket();
  const client = getS3Client();

  const contentType =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const upload_url = await getSignedUrl(client, command, { expiresIn: 60 * 5 });

  const publicBase = process.env.S3_PUBLIC_BASE_URL;
  const public_url = publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : null;

  return {
    upload_url,
    key,
    public_url,
    expires_in: 300,
    content_type: contentType,
  };
}

function buildKeyAndContentType(filename) {
  if (!filename || typeof filename !== 'string') {
    throw new HttpError(400, 'filename is required');
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new HttpError(400, 'Only image uploads are allowed (.jpg .jpeg .png .webp .gif)');
  }

  const safeBase =
    path
      .basename(filename, ext)
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'banner';

  const key = `banners/${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safeBase}${ext}`;
  const content_type =
    ext === '.png'
      ? 'image/png'
      : ext === '.webp'
        ? 'image/webp'
        : ext === '.gif'
          ? 'image/gif'
          : 'image/jpeg';

  return { key, content_type };
}

/**
 * Server-side upload — avoids browser ↔ S3 CORS issues.
 * Admin SPA sends the file to our API; we PUT to S3 with AWS credentials.
 */
async function uploadBannerBuffer({ filename, buffer, contentType }) {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new HttpError(400, 'Empty file');
  }
  if (buffer.length > 5 * 1024 * 1024) {
    throw new HttpError(400, 'Banner must be 5MB or smaller');
  }

  const { key, content_type } = buildKeyAndContentType(filename);
  const bucket = getBucket();
  const client = getS3Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType || content_type,
    })
  );

  const publicBase = process.env.S3_PUBLIC_BASE_URL;
  const public_url = publicBase ? `${publicBase.replace(/\/$/, '')}/${key}` : null;

  return { key, public_url, content_type: contentType || content_type };
}

module.exports = { createUploadUrl, uploadBannerBuffer };

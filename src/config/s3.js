const { S3Client } = require('@aws-sdk/client-s3');
const { HttpError } = require('../middleware/errorHandler');

let client;

function getS3Client() {
  const region = process.env.AWS_REGION || 'ap-south-1';
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!accessKeyId || !secretAccessKey) {
    throw new HttpError(
      503,
      'AWS credentials are not configured. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY'
    );
  }

  if (!client) {
    client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }

  return client;
}

function getBucket() {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new HttpError(503, 'S3_BUCKET_NAME is not configured');
  }
  return bucket;
}

module.exports = { getS3Client, getBucket };

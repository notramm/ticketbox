/**
 * Apply browser CORS rules to the banners S3 bucket.
 * Fixes: "blocked by CORS policy" on admin banner PUT uploads.
 *
 * Usage (from Backend/):
 *   node scripts/apply-s3-cors.js
 */
require('../src/config/env');

const { PutBucketCorsCommand, GetBucketCorsCommand } = require('@aws-sdk/client-s3');
const { getS3Client, getBucket } = require('../src/config/s3');
const corsConfig = require('./s3-cors.json');

async function main() {
  const client = getS3Client();
  const Bucket = getBucket();

  await client.send(
    new PutBucketCorsCommand({
      Bucket,
      CORSConfiguration: corsConfig,
    })
  );

  const current = await client.send(new GetBucketCorsCommand({ Bucket }));
  console.log(`CORS applied to s3://${Bucket}`);
  console.log(JSON.stringify(current.CORSRules, null, 2));
}

main().catch((err) => {
  console.error('Failed to apply S3 CORS:', err.message || err);
  process.exit(1);
});

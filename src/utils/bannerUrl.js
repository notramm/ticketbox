/**
 * Public URL for an event banner.
 * Uses the local /media proxy so private S3 buckets still render in EJS.
 */
function bannerUrl(bannerKey) {
  if (!bannerKey) return null;
  const key = String(bannerKey).replace(/^\/+/, '');
  if (!key.startsWith('banners/')) return null;
  return `/media/${key}`;
}

module.exports = { bannerUrl };

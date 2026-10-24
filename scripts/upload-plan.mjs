// Which dress-up files still need uploading (pure; tested in upload-plan.test.ts).
// Every path already carries its content hash in the file name, so a path the
// bucket has is the same bytes: it never needs sending again.

/**
 * @param {Record<string, string>} local hashed path -> content hash
 * @param {Set<string>} remote keys already in the bucket
 * @returns {string[]} the local paths missing from the bucket, sorted
 */
export function planUpload(local, remote) {
  return Object.keys(local)
    .filter((p) => !remote.has(p))
    .sort();
}

// Who may read the dress-up files cross-origin: the page fetches them from the R2 public domain
// and draws them into a canvas, which needs CORS.
export const CORS_ORIGINS = [
  'https://rozerothai.com',
  'https://www.rozerothai.com',
  'http://100.108.70.113:3178',
  'http://localhost:3000',
];

/** The bucket CORS policy (PutBucketCors CORSConfiguration). */
export function corsConfig() {
  return {
    CORSRules: [{ AllowedOrigins: [...CORS_ORIGINS], AllowedMethods: ['GET', 'HEAD'], AllowedHeaders: ['*'], MaxAgeSeconds: 86400 }],
  };
}

/**
 * --check: did a GET sent with Origin https://rozerothai.com come back readable by the page?
 * @param {number} status
 * @param {string | null} allowOrigin the Access-Control-Allow-Origin response header
 */
export function checkVerdict(status, allowOrigin) {
  return status === 200 && (allowOrigin === '*' || allowOrigin === CORS_ORIGINS[0]);
}

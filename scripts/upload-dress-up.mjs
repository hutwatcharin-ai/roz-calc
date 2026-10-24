// Upload the dress-up export (out/dress-up, built by scripts/build-dress-up.py) to Cloudflare R2.
// Only files the bucket does not have yet are sent: every name carries its content hash, so a
// name already in the bucket is the same bytes. Prints counts and key names only, never secrets
// or SDK error messages (only the error name).
//
// Usage:
//   npm run dress-up:upload               set the bucket CORS policy, then upload what is missing
//   npm run dress-up:upload -- --check    fetch one hashed JSON from NEXT_PUBLIC_DRESSUP_BASE with
//                                         Origin https://rozerothai.com; expect 200 + CORS header
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET; --check needs only
// NEXT_PUBLIC_DRESSUP_BASE (the public base URL, ending in /).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command, PutBucketCorsCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { CORS_ORIGINS, checkVerdict, corsConfig, planUpload } from './upload-plan.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'out', 'dress-up');
const MANIFEST = path.join(ROOT, 'data', 'dress-up-manifest.json');
const ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
const TYPES = { '.json': 'application/json', '.webp': 'image/webp' };
const CACHE = 'public, max-age=31536000, immutable';
const PARALLEL = 16;

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
/** @type {Record<string, string>} hashed path -> hash */
const local = {};
for (const [key, p] of Object.entries(manifest.parts)) {
  for (const ext of ['.json', '.webp']) local[`${key}.${p.hash}${ext}`] = p.hash;
}
// The picker's tile sheet (scripts/build-dress-up-thumbs.py): its name carries its hash too.
const thumbs = JSON.parse(await readFile(path.join(ROOT, 'data', 'dress-up-thumbs.json'), 'utf8'));
local[thumbs.file] = thumbs.file.split('.').at(-2);

if (process.argv.includes('--check')) {
  const base = process.env.NEXT_PUBLIC_DRESSUP_BASE;
  if (!base) {
    console.error('missing env: NEXT_PUBLIC_DRESSUP_BASE');
    process.exit(1);
  }
  const key = Object.keys(local).sort().find((k) => k.endsWith('.json'));
  let status = 0;
  let allow = null;
  try {
    const res = await fetch(new URL(key, base.endsWith('/') ? base : `${base}/`), { headers: { Origin: CORS_ORIGINS[0] } });
    status = res.status;
    allow = res.headers.get('access-control-allow-origin');
  } catch (e) {
    console.error(`check: fetch failed (${e.name})`);
    process.exit(1);
  }
  const ok = checkVerdict(status, allow);
  console.log(`check ${key}: status ${status}, Access-Control-Allow-Origin ${allow ? 'present' : 'missing'}: ${ok ? 'PASS' : 'FAIL'}`);
  process.exit(ok ? 0 : 1);
}

const missing = ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`missing env: ${missing.join(', ')} (set them in .env.local)`);
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const Bucket = process.env.R2_BUCKET;

// CORS: an Object Read & Write token may not be allowed to change bucket settings; then the
// owner sets the same policy in the dashboard (R2 > bucket > Settings > CORS Policy).
try {
  await s3.send(new PutBucketCorsCommand({ Bucket, CORSConfiguration: corsConfig() }));
  console.log(`CORS policy set: GET, HEAD from ${CORS_ORIGINS.length} origins`);
} catch (e) {
  console.log(
    `CORS not set by this token (${e.name}): in the Cloudflare dashboard, R2 > ${Bucket} > Settings > CORS Policy, allow GET and HEAD from ${CORS_ORIGINS.join(', ')}`,
  );
}

const remote = new Set();
try {
  let ContinuationToken;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken }));
    for (const o of page.Contents ?? []) remote.add(o.Key);
    ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
  } while (ContinuationToken);
} catch (e) {
  console.error(`listing the bucket failed: ${e.name}`);
  process.exit(1);
}

const todo = planUpload(local, remote);
console.log(`${Object.keys(local).length} local files, ${remote.size} in the bucket, ${todo.length} to upload`);

let done = 0;
const failed = [];
async function put(key) {
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket,
        Key: key,
        Body: await readFile(path.join(OUT, key)),
        ContentType: TYPES[path.extname(key)] ?? 'application/octet-stream',
        CacheControl: CACHE,
      }),
    );
    done++;
    if (done % 500 === 0) console.log(`  ${done}/${todo.length}`);
  } catch (e) {
    failed.push(key);
    console.error(`failed ${key}: ${e.name}`);
  }
}
for (let i = 0; i < todo.length; i += PARALLEL) await Promise.all(todo.slice(i, i + PARALLEL).map(put));

console.log(`uploaded ${done}, skipped ${Object.keys(local).length - todo.length}${failed.length ? `, failed ${failed.length}` : ''}`);
if (failed.length) process.exit(1);

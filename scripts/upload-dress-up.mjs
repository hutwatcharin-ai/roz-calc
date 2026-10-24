// Upload the dress-up export (out/dress-up, built by scripts/build-dress-up.py) to Cloudflare R2.
// Only files the bucket does not have yet are sent: every name carries its content hash, so a
// name already in the bucket is the same bytes. Prints counts and key names only, never secrets.
//
// Usage: npm run dress-up:upload   (node --env-file=.env.local scripts/upload-dress-up.mjs)
// Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET (NEXT_PUBLIC_DRESSUP_BASE is
// the page's public base URL and is not needed here).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { planUpload } from './upload-plan.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const OUT = path.join(ROOT, 'out', 'dress-up');
const MANIFEST = path.join(ROOT, 'data', 'dress-up-manifest.json');
const ENV = ['R2_ACCOUNT_ID', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY', 'R2_BUCKET'];
const TYPES = { '.json': 'application/json', '.webp': 'image/webp' };
const CACHE = 'public, max-age=31536000, immutable';
const PARALLEL = 16;

const missing = ENV.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`missing env: ${missing.join(', ')} (set them in .env.local)`);
  process.exit(1);
}

const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
/** @type {Record<string, string>} hashed path -> hash */
const local = {};
for (const [key, p] of Object.entries(manifest.parts)) {
  for (const ext of ['.json', '.webp']) local[`${key}.${p.hash}${ext}`] = p.hash;
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

const remote = new Set();
let ContinuationToken;
do {
  const page = await s3.send(new ListObjectsV2Command({ Bucket, ContinuationToken }));
  for (const o of page.Contents ?? []) remote.add(o.Key);
  ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
} while (ContinuationToken);

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

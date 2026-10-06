// Short links for shared builds: rozerothai.com/b/<id> (owner, 7 Oct 2026).
//
// A build is stored once, as JSON in the private Supabase Storage bucket
// "builds" (created 7 Oct 2026; 4 KB per file, JSON only), under an id taken
// from the hash of the cleaned build. The same build always gets the same
// id, so sharing it twice stores nothing new, and an id can only ever point
// at the build it was made from -- the card image for it can be cached
// forever.
//
// Storage rather than a table because a new table needs DDL, which this
// project runs through a management token we do not have right now; the
// service role key can create buckets and files.
//
// Server only.

import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { sanitizeBuild, type Build } from '@/lib/build-calc';

const BUCKET = 'builds';
// Base58-style: no l, o, I or O, which read as 1 and 0 in a group chat.
const ALPHABET = '0123456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
export const BUILD_ID = /^[0-9a-zA-Z]{8}$/;

/** The stored form: the cleaned build, so equal builds give equal text. */
export function canonical(build: Build): string {
  return JSON.stringify(build);
}

export function buildId(build: Build): string {
  const digest = crypto.createHash('sha256').update(canonical(build)).digest();
  let n = BigInt(`0x${digest.subarray(0, 12).toString('hex')}`);
  let id = '';
  for (let i = 0; i < 8; i++) {
    id += ALPHABET[Number(n % BigInt(ALPHABET.length))];
    n /= BigInt(ALPHABET.length);
  }
  return id;
}

/** Store a build (anything malformed is refused) and return its id. */
export async function saveBuild(raw: unknown): Promise<string | null> {
  const build = sanitizeBuild(raw);
  if (!build) return null;
  const id = buildId(build);
  const { error } = await supabaseAdmin()
    .storage.from(BUCKET)
    .upload(`${id}.json`, canonical(build), { contentType: 'application/json', upsert: false });
  // Already stored: the same build was shared before.
  if (error && !/exists|duplicate/i.test(error.message)) {
    console.error('build share: upload failed', error.message);
    return null;
  }
  return id;
}

export async function loadBuild(id: string): Promise<Build | null> {
  if (!BUILD_ID.test(id)) return null;
  const { data, error } = await supabaseAdmin().storage.from(BUCKET).download(`${id}.json`);
  if (error || !data) return null;
  try {
    return sanitizeBuild(JSON.parse(await data.text()));
  } catch {
    return null;
  }
}

// Fills in monster pictures that this site does not have.
//
// Written as a sweep rather than a list of ids, because the same hole keeps
// reopening: the 524 original sprites arrived with the raw dataset, and every
// monster imported since (Deviling, C4 Golem, the ten Nordfeld ones) landed
// with no picture at all. This asks the table which monsters have no
// image_url, and tries the one host allowed for monster art.
//
// scripts/mirror-nordfeld-sprites.mjs did this for the Nordfeld ten on 9 Sep
// 2026 and is kept for its record of that run; this is the same check with the
// id list taken from the database instead of typed in.
//
// On the source rule: CLAUDE.md lists static.divine-pride.net as usable, with
// its robots open, and separately forbids using the Divine-Pride API to mirror
// their database. This takes images from the open static host and no stats
// from the API.
//
// Every file is checked before it is kept -- a real PNG, and not a copy of
// another sprite, because a host that answers 200 with one shared placeholder
// would otherwise give every monster the same picture.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/mirror-missing-monster-sprites.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const DEST = path.join(process.cwd(), 'public', 'images', 'monsters');
const SOURCE = (id) => `https://static.divine-pride.net/images/mobs/png/${id}.png`;
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** md5 of every sprite already on disk, so a "new" file that is really a
 *  duplicate of one we serve is caught as well as a duplicate within a run. */
function existingHashes() {
  const seen = new Map();
  if (!fs.existsSync(DEST)) return seen;
  for (const name of fs.readdirSync(DEST)) {
    const bytes = fs.readFileSync(path.join(DEST, name));
    seen.set(crypto.createHash('md5').update(bytes).digest('hex'), name);
  }
  return seen;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const { data, error } = await db.from('monsters').select('id, name_en').is('image_url', null).order('id');
  if (error) throw error;
  console.log(`${data.length} monsters have no picture`);
  if (data.length === 0) return;

  fs.mkdirSync(DEST, { recursive: true });
  const seen = existingHashes();
  const written = [];

  for (const row of data) {
    const response = await fetch(SOURCE(row.id));
    if (!response.ok) {
      console.log(`  ${row.id} ${row.name_en}: HTTP ${response.status}, still no picture`);
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
      console.log(`  ${row.id} ${row.name_en}: not a PNG, skipped`);
      continue;
    }
    const hash = crypto.createHash('md5').update(bytes).digest('hex');
    if (seen.has(hash)) {
      console.log(`  ${row.id} ${row.name_en}: same image as ${seen.get(hash)}, skipped as a placeholder`);
      continue;
    }
    seen.set(hash, `${row.id}.png`);
    if (!dryRun) fs.writeFileSync(path.join(DEST, `${row.id}.png`), bytes);
    written.push(row);
    console.log(`  ${row.id} ${row.name_en}: ${bytes.length} bytes`);
  }

  console.log(`\n${written.length}/${data.length} mirrored${dryRun ? ' (dry run: nothing written)' : ''}`);
  if (dryRun || written.length === 0) return;

  for (const row of written) {
    const { error: upError } = await db
      .from('monsters')
      .update({ image_url: `/images/monsters/${row.id}.png` })
      .eq('id', row.id);
    if (upError) throw upError;
  }
  console.log(`image_url set on ${written.length} monsters`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

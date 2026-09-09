// Mirrors the ten Nordfeld monster sprites from Divine-Pride's static host.
//
// These ten were imported on 8 Sep 2026 with no picture: the original 524
// sprites arrived with the raw dataset and the Nordfeld monsters were never
// in it, so every one of them rendered a broken image until the URLs were
// nulled on 9 Sep. Neither prontera nor midgardhub carries an image for any
// of them.
//
// static.divine-pride.net does, at /images/mobs/png/<id>.png. Checked before
// trusting it: all ten return 200, all ten are valid PNGs, all ten are
// distinct files by md5 -- so this is not one placeholder served ten times --
// and their dimensions (56x53 up to 185x152) are the range real RO sprites
// sit in.
//
// On the source rule: CLAUDE.md lists static.divine-pride.net as usable, with
// its robots open, and separately forbids using the Divine-Pride API to
// mirror their database. This takes images from the open static host and no
// stats from the API, which is the side of that line the rule draws. The
// numbers for these monsters stay unknown.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/mirror-nordfeld-sprites.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const IDS = [25321, 25322, 25323, 25324, 25325, 25326, 25327, 25328, 25329, 25336];
const DEST = path.join(process.cwd(), 'public', 'images', 'monsters');
const SOURCE = (id) => `https://static.divine-pride.net/images/mobs/png/${id}.png`;

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

async function main() {
  fs.mkdirSync(DEST, { recursive: true });
  const written = [];
  const seen = new Map();

  for (const id of IDS) {
    const response = await fetch(SOURCE(id));
    if (!response.ok) {
      console.log(`  ${id}: HTTP ${response.status}, skipped`);
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    // A host that answers 200 with an error page or a shared placeholder is
    // the failure this guards against: the file has to be a PNG, and it has
    // to be a different PNG from the others.
    if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) {
      console.log(`  ${id}: not a PNG, skipped`);
      continue;
    }
    const crypto = await import('node:crypto');
    const hash = crypto.createHash('md5').update(bytes).digest('hex');
    if (seen.has(hash)) {
      console.log(`  ${id}: same image as ${seen.get(hash)}, skipped as a placeholder`);
      continue;
    }
    seen.set(hash, id);
    if (!dryRun) fs.writeFileSync(path.join(DEST, `${id}.png`), bytes);
    written.push(id);
    console.log(`  ${id}: ${bytes.length} bytes`);
  }

  console.log(`\n${written.length}/${IDS.length} sprites${dryRun ? ' (dry run: nothing written)' : ' mirrored'}`);
  if (dryRun || written.length === 0) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  for (const id of written) {
    const { error } = await db.from('monsters').update({ image_url: `/images/monsters/${id}.png` }).eq('id', id);
    if (error) throw error;
  }
  console.log(`image_url set on ${written.length} monsters`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

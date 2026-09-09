// Clears the image_url on the ten Nordfeld monsters, which points at files
// that do not exist.
//
// scripts/import-nordfeld-monsters.mjs set image_url to
// /images/monsters/<id>.gif for all ten without checking that the sprite was
// there. None of the ten is: the 524 original sprites arrived with the raw
// dataset, and these monsters were never in it. On production every one of
// them renders a broken-image icon on the monster page and in the list, and
// /images/monsters/25323.gif returns 404.
//
// scripts/monster-images.ts was written for exactly this failure -- "a
// monster row may only carry an image_url for an image this site actually
// serves" -- after Deviling and C4 Golem did the same thing. The rule was
// there and the import walked straight past it.
//
// No allowed source has these sprites. The originals came from the TWRoZ
// public-assets lineage, which CLAUDE.md now forbids fetching, and neither
// prontera nor midgardhub carries an image for any of the ten. So the fix is
// the one the module prescribes: null, which renders as no picture instead of
// a broken one. The monsters stay; only their picture is missing.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/fix-nordfeld-images.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const PUBLIC = path.join(process.cwd(), 'public');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const { data, error } = await db.from('monsters').select('id, name_en, image_url').not('image_url', 'is', null);
  if (error) throw error;

  // Checked against the checkout, not against a list: any monster whose file
  // is missing gets cleared, so this also catches the next import that
  // forgets.
  const broken = data.filter((row) => !fs.existsSync(path.join(PUBLIC, row.image_url.replace(/^\//, ''))));
  console.log(`${broken.length} monsters point at a sprite that is not in public/`);
  for (const row of broken) console.log(`  ${row.id} ${row.name_en} -> ${row.image_url}`);
  if (broken.length === 0 || dryRun) {
    if (dryRun) console.log('(dry run: nothing written)');
    return;
  }

  const { error: upError } = await db
    .from('monsters')
    .update({ image_url: null })
    .in('id', broken.map((row) => row.id));
  if (upError) throw upError;
  console.log('cleared');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

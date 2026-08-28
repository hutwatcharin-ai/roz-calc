// Reports monsters whose image_url points at a file this checkout does not
// serve, and fixes them in the database when asked.
//
// Run it with:      npx tsx scripts/check-monster-images.ts
// Fix the rows:     npx tsx scripts/check-monster-images.ts --fix
//
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment. In bash:  set -a && . ./.env.local && set +a

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { supabaseAdmin } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetch-all-rows';
import { missingImages, type HasImage } from './monster-images';

function servedFileExists(publicPath: string): boolean {
  // Only paths this site serves from /public. Anything else (an absolute URL to
  // somewhere else) is not ours to vouch for, so it is left alone.
  if (!publicPath.startsWith('/')) return true;
  return existsSync(join(process.cwd(), 'public', publicPath));
}

async function main(): Promise<void> {
  const fix = process.argv.includes('--fix');
  const db = supabaseAdmin();

  const { data, error } = await fetchAllRows<HasImage>((from, to) =>
    db.from('monsters').select('id, name_en, image_url').order('id').range(from, to),
  );
  if (error) throw new Error(`Failed to read monsters: ${error.message}`);

  const rows = data ?? [];
  const broken = missingImages(rows, servedFileExists);

  console.log(`checked ${rows.length} monsters`);
  if (broken.length === 0) {
    console.log('every image_url points at a file this site serves');
    return;
  }

  console.log(`${broken.length} point at a file that does not exist:`);
  for (const row of broken) console.log(`  ${row.id}  ${row.name_en}  ${row.image_url}`);

  if (!fix) {
    console.log('\nrun again with --fix to null these out, so the page renders no image');
    console.log('instead of a broken one. The monster row itself is kept either way.');
    process.exitCode = 1;
    return;
  }

  const { error: updateError } = await db
    .from('monsters')
    .update({ image_url: null })
    .in('id', broken.map((row) => row.id));
  if (updateError) throw new Error(`Failed to clear image_url: ${updateError.message}`);

  console.log(`\ncleared image_url on ${broken.length} rows`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Fills the monster stat columns that are still null from
// data/raw/rozerodb-monster-stats.json (scripts/fetch-rozerodb-monster-stats.mjs).
//
// Only a null column is written, never one that already has a number: the
// values we have came from sources checked earlier, and this is a gap-filler,
// not a second opinion. A level that disagrees with ours is reported and the
// whole row skipped, because then the page may be a different monster.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/import-rozerodb-monster-stats.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { STAT_COLUMNS } from './fetch-rozerodb-monster-stats.mjs';

const dryRun = process.argv.includes('--dry-run');
const FILE = path.join(process.cwd(), 'data', 'raw', 'rozerodb-monster-stats.json');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  const fetched = JSON.parse(fs.readFileSync(FILE, 'utf-8')).monsters;
  const ids = Object.keys(fetched).map(Number);
  const { data: rows, error } = await db.from('monsters').select(['id', 'name_en', 'level', ...STAT_COLUMNS].join(',')).in('id', ids);
  if (error) throw error;

  let changed = 0;
  for (const row of rows) {
    const stats = fetched[row.id]?.stats;
    if (!stats) continue;
    if (stats.level != null && row.level != null && stats.level !== row.level) {
      console.log(`  ${row.id} ${row.name_en}: level ${row.level} here, ${stats.level} on rozerodb -- skipped`);
      continue;
    }
    const patch = {};
    for (const c of STAT_COLUMNS) if (row[c] == null && stats[c] != null) patch[c] = stats[c];
    if (!Object.keys(patch).length) continue;
    changed++;
    console.log(`  ${row.id} ${row.name_en}: ${Object.entries(patch).map(([k, v]) => `${k}=${v}`).join(' ')}`);
    if (!dryRun) {
      const { error: upErr } = await db.from('monsters').update(patch).eq('id', row.id);
      if (upErr) throw upErr;
    }
  }
  console.log(`\n${changed} monsters ${dryRun ? 'would change (dry run: nothing written)' : 'updated'}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

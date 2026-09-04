// Fills monster_spawns.amount -- how many of a monster a map holds.
//
// The column was missing entirely: our spawn table only said WHICH monsters a
// map has, never how many, so "where should I level" could not weigh a map
// with 80 Orc Zombies against one with 5. rozerodb prints it on every map page
// as "≈ 80 spawned", and our own crawl of those pages
// (docs/rozerodb-export/data/maps.jsonl, 573 pages) already holds the text.
//
// Matching is by (map_code, monster_id), both exact: the map code is the URL's
// last segment, and the monster id is printed as "# 1153" beside the name.
// Nothing is matched by name.
//
// Run:  npx tsx scripts/import-spawn-amounts.ts [--dry]

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const FILE = 'docs/rozerodb-export/data/maps.jsonl';

// "Orc Zombie # 1153 Lv 51 Undead Undead ≈ 80 spawned" -- the id and the count
// are what this needs; the name is only read back for the log.
const SPAWN = /# (\d+) Lv \d+ [^≈]{0,40}≈ (\d+) spawned/g;

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const db = createClient(url, key);

  // map_code -> monster_id -> amount
  const parsed = new Map<string, Map<number, number>>();
  let pages = 0;
  let rows = 0;

  for (const line of fs.readFileSync(FILE, 'utf8').trim().split('\n')) {
    const rec = JSON.parse(line);
    if (rec.status !== 200 || !rec.url) continue;
    const mapCode = String(rec.url).split('/').filter(Boolean).at(-1);
    if (!mapCode) continue;
    const text = String(rec.text ?? '').replace(/\s+/g, ' ');

    const byMonster = new Map<number, number>();
    for (const match of text.matchAll(SPAWN)) {
      const monsterId = Number(match[1]);
      const amount = Number(match[2]);
      if (!Number.isInteger(monsterId) || !Number.isInteger(amount) || amount <= 0) continue;
      // A map that lists the same monster twice (two spawn entries) is one
      // population as far as our table is concerned, so they add up.
      byMonster.set(monsterId, (byMonster.get(monsterId) ?? 0) + amount);
    }
    if (byMonster.size === 0) continue;
    parsed.set(mapCode, byMonster);
    pages += 1;
    rows += byMonster.size;
  }

  console.log(`parsed ${rows} spawn counts across ${pages} maps`);

  // Paginated: monster_spawns is 2,688 rows, over PostgREST's silent cap.
  const existing: { id: number; monster_id: number; map_code: string; amount: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('monster_spawns')
      .select('id, monster_id, map_code, amount')
      .order('id')
      .range(from, from + 999);
    if (error) throw new Error(`monster_spawns read failed: ${error.message}`);
    if (!data || data.length === 0) break;
    existing.push(...data);
    if (data.length < 1000) break;
  }

  const updates: { id: number; amount: number }[] = [];
  let unmatched = 0;
  for (const spawn of existing) {
    const amount = parsed.get(spawn.map_code)?.get(spawn.monster_id);
    if (amount === undefined) {
      unmatched += 1;
      continue;
    }
    if (spawn.amount === amount) continue;
    updates.push({ id: spawn.id, amount });
  }

  console.log(`our spawn rows: ${existing.length}`);
  console.log(`to write: ${updates.length}; already correct: ${existing.length - updates.length - unmatched}; no count found: ${unmatched}`);

  if (dry) {
    console.log('dry run, nothing written');
    return;
  }

  for (const [i, update] of updates.entries()) {
    const { error } = await db.from('monster_spawns').update({ amount: update.amount }).eq('id', update.id);
    if (error) throw new Error(`spawn ${update.id} update failed: ${error.message}`);
    if (i % 200 === 0) process.stdout.write(`\r  ${i}/${updates.length}`);
  }
  console.log(`\nwrote ${updates.length} amounts`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

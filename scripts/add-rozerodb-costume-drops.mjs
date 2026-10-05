// Costume drops our monster_drops lacked, from rozerodb's monster pages
// (owner, 5 Oct 2026: "many costumes drop from monsters but we don't know").
//
// rozerodb's monster pages list each costume as "[Costume] Name (Bound) # id
// ???" -- item id given, rate unknown, as everywhere: the game does not
// publish costume rates. Every costume pair we already had appears in their
// lists too, so the 29 extra pairs are taken at the same trust, with rate
// null (the site shows "?").
//
// Reads the text export docs/rozerodb-export/data/monsters.jsonl (crawled
// 31 Aug 2026) and inserts only pairs whose monster and item are both in our
// tables and not already there, so it is safe to rerun.
//
//   node --env-file=.env.local scripts/add-rozerodb-costume-drops.mjs [--dry]

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const DRY = process.argv.includes('--dry');
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function all(table, select) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(select).order(select.split(',')[0]).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const items = new Set((await all('items', 'id')).map((i) => i.id));
const monsters = new Set((await all('monsters', 'id')).map((m) => m.id));
const have = new Set((await all('monster_drops', 'monster_id,item_id')).map((d) => `${d.monster_id}:${d.item_id}`));

const pages = fs.readFileSync('docs/rozerodb-export/data/monsters.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const add = [];
for (const page of pages) {
  const m = /^\/monsters\/(\d+)$/.exec(page.path);
  if (!m) continue;
  const monster = Number(m[1]);
  for (const hit of page.text.matchAll(/\[Costume\] [^#]+? # (\d+) /g)) {
    const item = Number(hit[1]);
    const key = `${monster}:${item}`;
    if (have.has(key) || !monsters.has(monster) || !items.has(item)) continue;
    have.add(key);
    add.push({ monster_id: monster, item_id: item, rate: null });
  }
}

console.log(`${add.length} costume drops to add${DRY ? ' (dry run)' : ''}`);
if (!DRY && add.length) {
  const { error } = await db.from('monster_drops').insert(add);
  if (error) throw error;
  console.log('inserted');
}

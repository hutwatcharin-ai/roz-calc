// Finds monster_drops rows that belong to a different monster with the same
// name (owner, 1 Oct 2026: Baphomet Jr. #1101 was showing the MVP Baphomet's
// drops). Some import matched drops by monster name, and six names are shared
// by more than one monster, so a drop row could land on the wrong id.
//
// A row is flagged when BOTH crawled sources (midgardhub and rozerodb, which
// agree with each other on these monsters) list the monster's drops, neither
// lists this item for it, and a same-named monster does list it. Nothing else
// is touched: a drop only our table has, with no same-name twin to explain
// it, is left alone and only counted.
//
// Run:  npx tsx scripts/audit-drop-bleed.ts           (dry run)
//       npx tsx scripts/audit-drop-bleed.ts --write   (deletes the flagged rows)

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const WRITE = process.argv.includes('--write');
const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function midgardhub(): Map<number, Set<number>> {
  const lines = fs.readFileSync(path.join(root, 'docs/midgardhub-export/data/monster_drops.csv'), 'utf8').replace(/^﻿/, '').split(/\r?\n/);
  const head = lines[0].split(',');
  const mi = head.indexOf('monster_id');
  const ii = head.indexOf('item_id');
  const out = new Map<number, Set<number>>();
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue;
    const cols = line.split(',');
    const m = Number(cols[mi]);
    const i = Number(cols[ii]);
    if (!out.has(m)) out.set(m, new Set());
    out.get(m)!.add(i);
  }
  return out;
}

function rozerodb(): Map<number, Set<number>> {
  const out = new Map<number, Set<number>>();
  for (const line of fs.readFileSync(path.join(root, 'docs/rozerodb-export/data/monsters.jsonl'), 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const rec = JSON.parse(line);
    const m = /^\/monsters\/(\d+)$/.exec(rec.path ?? '');
    if (!m) continue;
    const text: string = rec.text ?? '';
    const start = text.indexOf('Drops (');
    if (start < 0) continue;
    const end = text.indexOf('Spawn Atlas', start);
    const block = text.slice(start, end < 0 ? undefined : end);
    out.set(Number(m[1]), new Set([...block.matchAll(/# (\d+)/g)].map((x) => Number(x[1]))));
  }
  return out;
}

(async () => {
  const mh = midgardhub();
  const rz = rozerodb();

  const monsters: { id: number; name_en: string }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('monsters').select('id, name_en').order('id').range(from, from + 999);
    if (error) throw error;
    monsters.push(...(data as any[]));
    if (data!.length < 1000) break;
  }
  const byName = new Map<string, number[]>();
  for (const m of monsters) byName.set(m.name_en, [...(byName.get(m.name_en) ?? []), m.id]);
  const shared = [...byName.entries()].filter(([, ids]) => ids.length > 1);
  console.log(`shared names: ${shared.map(([n, ids]) => `${n} [${ids.join(', ')}]`).join(' · ')}`);

  const flagged: { monster: number; name: string; item: number; itemName: string; rate: number | null; twin: number }[] = [];
  for (const [name, ids] of shared) {
    for (const id of ids) {
      const a = mh.get(id);
      const b = rz.get(id);
      if (!a || !b) { console.log(`  ${name} #${id}: a source has no drop list, skipped`); continue; }
      const { data, error } = await db.from('monster_drops').select('item_id, rate, items(name_en)').eq('monster_id', id);
      if (error) throw error;
      for (const row of data as any[]) {
        if (a.has(row.item_id) || b.has(row.item_id)) continue;
        const twin = ids.find((other) => other !== id && (mh.get(other)?.has(row.item_id) || rz.get(other)?.has(row.item_id)));
        if (twin == null) continue;
        flagged.push({ monster: id, name, item: row.item_id, itemName: row.items?.name_en ?? '?', rate: row.rate, twin });
      }
    }
  }

  console.log(`flagged: ${flagged.length}`);
  for (const f of flagged) console.log(`  ${f.name} #${f.monster}: ${f.itemName} (${f.item}) ${f.rate ?? '?'}% -- belongs to #${f.twin}`);
  if (!WRITE) { console.log('dry run -- pass --write to delete'); return; }
  // Keep what is removed, so it can go back in if a source turns out wrong.
  fs.writeFileSync(path.join(root, 'docs', 'drop-bleed-removed-2026-10-01.json'), JSON.stringify(flagged, null, 1) + '\n');
  for (const f of flagged) {
    const { error } = await db.from('monster_drops').delete().eq('monster_id', f.monster).eq('item_id', f.item);
    if (error) throw new Error(`${f.monster}/${f.item}: ${error.message}`);
  }
  console.log(`deleted: ${flagged.length}`);
})();

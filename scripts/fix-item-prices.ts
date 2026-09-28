// Fixes NPC prices in `items` from the other ROZ databases (owner, 28 Sep 2026).
//
// A price audit (every item against midgardhub, rozerodb and the TWRoZ dump
// our own table started from) found two problems:
//
//   A. 36 rows whose buy price is below their sell price, which no NPC does
//      (Boots bought for 50 and sold for 9,000; every source says 18,000 /
//      9,000). Some import after 2 Sep wrote the buy column over. Fixed only
//      where at least two sources agree on the pair; the rest are listed.
//
//   B. 1,616 rows with no sell price at all. midgardhub lists 1,413 of them,
//      but every one of those reads 0 -- its placeholder for "no price", not
//      a price (Poison Bottle, Turtle Shell, Masamune). No other source has a
//      number for them, so they stay empty. Run on 28 Sep 2026: A fixed 8
//      rows; 28 more (buy 1-8 against a sell of 10, arrows and quivers) have
//      no two sources agreeing and were left; B filled none.
//
// Loot / consumable sell prices -- what the zeny tools use -- already matched
// every source and are not touched.
//
// Run:  npx tsx scripts/fix-item-prices.ts          (dry run, prints changes)
//       npx tsx scripts/fix-item-prices.ts --write  (writes them)

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { parseCard, parseEquipment } from './rozerodb-export-parse';

const WRITE = process.argv.includes('--write');
const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

type P = { buy: number | null; sell: number | null };
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

function midgardhub(): Map<number, P> {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'docs/midgardhub-export/data/items.json'), 'utf8'));
  const rows: any[] = Array.isArray(j) ? j : j.items;
  return new Map(rows.map((r) => [Number(r.id), { buy: num(r.buy_price), sell: num(r.sell_price) }]));
}
function rozerodb(): Map<number, P> {
  const out = new Map<number, P>();
  for (const r of JSON.parse(fs.readFileSync(path.join(root, 'data/raw/rozerodb-items.json'), 'utf8'))) out.set(r.id, { buy: num(r.buy), sell: num(r.sell) });
  for (const file of ['equipment.jsonl', 'cards.jsonl']) {
    for (const line of fs.readFileSync(path.join(root, 'docs/rozerodb-export/data', file), 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const rec = JSON.parse(line);
      const p: any = file === 'cards.jsonl' ? parseCard(rec.text) : parseEquipment(rec.text);
      if (p?.id) out.set(p.id, { buy: p.buy ?? null, sell: p.sell ?? null });
    }
  }
  return out;
}
function twDump(): Map<number, P> {
  const j = JSON.parse(fs.readFileSync(path.join(root, 'data/raw/items.json'), 'utf8'));
  const out = new Map<number, P>();
  for (const r of j.items) {
    const a = typeof r.attributes === 'string' ? r.attributes : JSON.stringify(r.attributes ?? {});
    const b = /buyPrice'?"?\s*:\s*(\d+)/.exec(a);
    const s = /sellPrice'?"?\s*:\s*(\d+)/.exec(a);
    out.set(Number(r.id), { buy: b ? Number(b[1]) : null, sell: s ? Number(s[1]) : null });
  }
  return out;
}

(async () => {
  const rows: { id: number; name_en: string; buy_price: number | null; sell_price: number | null }[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('id,name_en,buy_price,sell_price').order('id').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as any[]));
    if (data!.length < 1000) break;
  }
  const mh = midgardhub();
  const sources = [mh, rozerodb(), twDump()];

  const changes: { id: number; name: string; why: 'A' | 'B'; from: P; to: P }[] = [];
  const unresolved: string[] = [];

  for (const r of rows) {
    // A: buy below sell -- take the pair two or more sources agree on.
    if (r.buy_price && r.sell_price && r.buy_price < r.sell_price) {
      const votes = new Map<string, number>();
      for (const s of sources) {
        const p = s.get(r.id);
        if (p && p.buy != null && p.sell != null && p.buy >= p.sell) votes.set(`${p.buy}/${p.sell}`, (votes.get(`${p.buy}/${p.sell}`) ?? 0) + 1);
      }
      const best = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
      if (best && best[1] >= 2) {
        const [buy, sell] = best[0].split('/').map(Number);
        changes.push({ id: r.id, name: r.name_en, why: 'A', from: { buy: r.buy_price, sell: r.sell_price }, to: { buy, sell } });
      } else {
        unresolved.push(`${r.id} ${r.name_en} buy ${r.buy_price} sell ${r.sell_price} (no two sources agree)`);
      }
      continue;
    }
    // B: no sell price -- fill from midgardhub.
    if (r.sell_price == null) {
      const p = mh.get(r.id);
      // midgardhub writes 0 where it has no price (Poison Bottle, Turtle Shell,
      // Masamune all read 0), so only a real number fills the gap.
      if (p && p.sell != null && p.sell > 0) {
        changes.push({ id: r.id, name: r.name_en, why: 'B', from: { buy: r.buy_price, sell: r.sell_price }, to: { buy: r.buy_price ?? (p.buy && p.buy > 0 ? p.buy : null), sell: p.sell } });
      }
    }
  }

  const a = changes.filter((c) => c.why === 'A');
  const b = changes.filter((c) => c.why === 'B');
  console.log(`A (buy below sell) fixed by consensus: ${a.length}`);
  for (const c of a) console.log(`  ${c.id} ${c.name}: ${c.from.buy}/${c.from.sell} -> ${c.to.buy}/${c.to.sell}`);
  console.log(`A unresolved: ${unresolved.length}`);
  for (const u of unresolved) console.log(`  ${u}`);
  console.log(`B (no sell price) filled: ${b.length}`);
  for (const c of b.slice(0, 15)) console.log(`  ${c.id} ${c.name}: sell ${c.to.sell}, buy ${c.to.buy}`);

  if (!WRITE) { console.log('dry run -- pass --write to apply'); return; }
  let done = 0;
  for (const c of changes) {
    const { error } = await db.from('items').update({ buy_price: c.to.buy, sell_price: c.to.sell }).eq('id', c.id);
    if (error) throw new Error(`${c.id}: ${error.message}`);
    done++;
  }
  console.log(`written: ${done}`);
})();

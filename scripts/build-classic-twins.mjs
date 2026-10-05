// Classic leftovers and the Zero item each one stands for (owner, 5 Oct 2026).
//
// The Zero client still carries classic-RO equipment ids (1463 Hallberd) next
// to Zero's own six-digit copies (630039 Hallberd [1], 630053 Hallberd [2]).
// In the client they read the same; only the id differs, and monsters drop
// the six-digit ones. Our shop and forge data come from rAthena, which knows
// only the classic ids, so until now "sold by Weapon Dealer" sat on 1463 --
// a page nobody's item is -- while 630053, the one the shop really sells for
// 1,650z (owner's shop screenshot), said nothing about shops.
//
// A leftover is lib/classic-twins' rule: equipment, id under 100000, a Zero
// id with the same name exists, no monster drops it. Each is mapped to one
// Zero twin, by the first test that leaves exactly one:
//
//   1. the twin with an NPC buy price (the shop copy: 630053 at 1,650z)
//   2. the twin a monster drops
//   3. the twin with the same card slots
//
// and to null when none does, so the page can say "in game this is one of
// ..." instead of guessing.
//
//   node --env-file=.env.local scripts/build-classic-twins.mjs

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

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

const absent = new Set(JSON.parse(fs.readFileSync('data/game-absent-items.json', 'utf8')).ids);
const items = (await all('items', 'id,name_en,category,slots,buy_price')).filter((i) => !absent.has(i.id));
const dropped = new Set((await all('monster_drops', 'item_id')).map((d) => d.item_id));

const gear = (i) => i.category === 'Weapon' || i.category === 'Armor';
const zeroByName = new Map();
for (const i of items.filter((i) => i.id >= 100000)) {
  const k = i.name_en.toLowerCase();
  zeroByName.set(k, [...(zeroByName.get(k) ?? []), i]);
}

const one = (list) => (list.length === 1 ? list[0].id : null);
const twins = {};
const how = { buy: 0, drop: 0, slots: 0, none: 0 };
for (const i of items) {
  if (!gear(i) || i.id >= 100000 || dropped.has(i.id)) continue;
  const zero = zeroByName.get(i.name_en.toLowerCase());
  if (!zero) continue;
  const byBuy = one(zero.filter((z) => (z.buy_price ?? 0) > 0));
  const byDrop = one(zero.filter((z) => dropped.has(z.id)));
  const bySlots = one(zero.filter((z) => (z.slots ?? 0) === (i.slots ?? 0)));
  const to = byBuy ?? byDrop ?? bySlots;
  how[byBuy ? 'buy' : byDrop ? 'drop' : bySlots ? 'slots' : 'none'] += 1;
  twins[i.id] = { name: i.name_en, category: i.category, to, among: zero.map((z) => z.id) };
}

const out = {
  _meta: {
    built: new Date().toISOString().slice(0, 10),
    how: 'node --env-file=.env.local scripts/build-classic-twins.mjs',
    rule: 'equipment, id < 100000, a Zero (>= 100000) id with the same name, no monster drop; mapped by buy price, then drop, then slots',
    counts: { leftovers: Object.keys(twins).length, mappedBy: how },
  },
  twins,
};
fs.writeFileSync('data/classic-twins.json', JSON.stringify(out, null, 2) + '\n');
console.log(out._meta.counts);

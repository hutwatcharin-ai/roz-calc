// Classic leftovers and the Zero item each one stands for (owner, 5 Oct 2026).
//
// The Zero client still carries classic-RO equipment ids (1463 Hallberd) next
// to Zero's own six-digit copies (630039 Hallberd [1], 630053 Hallberd [2]).
// In the client they read the same; only the id differs, and monsters drop
// the six-digit ones. Our shop and forge data come from rAthena, which knows
// only the classic ids, so until now "sold by Weapon Dealer" sat on 1463 --
// a page nobody's item is.
//
// A leftover is lib/classic-twins' rule: equipment, id under 100000, a Zero
// id with the same name exists, no monster drops it.
//
// Which Zero copy, the owner's rule (5 Oct 2026, from play): Zero has a shop
// copy with the classic slot count and a drop copy with one slot more --
// Gladius [2] 510136 is sold for 1,200z, Gladius [3] 510182 drops. So:
//
//   to    the copy with the fewest slots: the leftover page redirects here
//         and the forge recipe sits here (the forged weapon itself is another
//         item again -- no slots, four random option rows -- that the site
//         has no page for)
//   shop  the same copy, but only when its slots are no more than the
//         classic one's. 14 items exist in Zero only as the drop copy (Sword
//         [4], Rapier [3]); nobody has seen a shop sell those, so no shop.
//
// The first version of this file (same day) picked the copy with a buy price,
// then the dropped one -- which put "sold by Weapon Dealer" on 41 drop copies,
// Gladius [3] among them.
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
const how = { shopCopy: 0, dropCopyOnly: 0, none: 0 };
for (const i of items) {
  if (!gear(i) || i.id >= 100000 || dropped.has(i.id)) continue;
  const zero = zeroByName.get(i.name_en.toLowerCase());
  if (!zero) continue;
  const fewest = Math.min(...zero.map((z) => z.slots ?? 0));
  const to = one(zero.filter((z) => (z.slots ?? 0) === fewest));
  const shop = to !== null && fewest <= (i.slots ?? 0) ? to : null;
  how[to === null ? 'none' : shop === null ? 'dropCopyOnly' : 'shopCopy'] += 1;
  twins[i.id] = { name: i.name_en, category: i.category, slots: i.slots ?? 0, to, shop, among: zero.map((z) => z.id) };
}

const out = {
  _meta: {
    built: new Date().toISOString().slice(0, 10),
    how: 'node --env-file=.env.local scripts/build-classic-twins.mjs',
    rule: 'equipment, id < 100000, a Zero (>= 100000) id with the same name, no monster drop; to = the fewest-slot Zero copy; shop = that copy when its slots <= the classic one',
    counts: { leftovers: Object.keys(twins).length, mappedBy: how },
  },
  twins,
};
fs.writeFileSync('data/classic-twins.json', JSON.stringify(out, null, 2) + '\n');
console.log(out._meta.counts);

// Builds data/headgear-slots.json: which head layers (upper, mid, lower) each
// headgear in the equipment list takes, for the equipment page's position
// filter (owner, 28 Oct 2026).
//
// Two sources, in this order:
//   1. the dress room's index (data/dress-up-client.json, from the RO Zero
//      client), which knows every hat it can draw;
//   2. rAthena's item_db_equip.yml Locations (Head_Top / Head_Mid / Head_Low),
//      by id, then by name -- classic hats the dress room does not draw.
// Where both know a hat they are compared, and the count of disagreements is
// written to _meta so a bad match shows up.
//
//   node --env-file=.env.local scripts/build-headgear-slots.mjs <item_db_equip.yml>

import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const equipPath = process.argv[2];
if (!equipPath) throw new Error('usage: build-headgear-slots.mjs <rathena item_db_equip.yml>');

const LETTER = { u: 'upper', m: 'mid', l: 'lower' };
const RATHENA = { Head_Top: 'upper', Head_Mid: 'mid', Head_Low: 'lower' };
const ORDER = ['upper', 'mid', 'lower'];

const dress = JSON.parse(readFileSync('data/dress-up-client.json', 'utf8')).items;
const gearTypes = JSON.parse(readFileSync('data/gear-types.json', 'utf8')).types;

/** rAthena head layers by id and by lower-cased name (first name wins, as in build-gear-types). */
const byId = new Map();
const byName = new Map();
for (const block of readFileSync(equipPath, 'utf8').split('\n  - Id: ').slice(1)) {
  const id = Number(block.slice(0, block.indexOf('\n')).trim());
  const loc = /\n {4}Locations:\n((?: {6}.*\n)+)/.exec(block);
  if (!Number.isFinite(id) || !loc) continue;
  const slots = [...loc[1].matchAll(/^ {6}(\w+): true/gm)].map((m) => RATHENA[m[1]]).filter(Boolean);
  if (slots.length === 0) continue;
  const name = (/\n {4}Name: (.*)/.exec(block)?.[1] ?? '').trim().replace(/^"(.*)"$/, '$1').toLowerCase();
  byId.set(id, slots);
  if (!byName.has(name)) byName.set(name, slots);
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const rows = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from('items').select('id, name_en, category, weapon_type').in('category', ['Armor', 'Weapon']).order('id').range(from, from + 999);
  if (error) throw error;
  rows.push(...data);
  if (data.length < 1000) break;
}
const hats = rows.filter((r) => (r.weapon_type ?? gearTypes[r.id]?.type) === 'Headgear');

const sort = (slots) => ORDER.filter((s) => slots.includes(s));
const slots = {};
const how = { dress: 0, rathenaId: 0, rathenaName: 0, unknown: 0 };
let compared = 0;
const disagree = [];
for (const h of hats) {
  const fromDress = dress[h.id] ? [...dress[h.id][0]].map((l) => LETTER[l]).filter(Boolean) : [];
  const fromId = byId.get(h.id) ?? null;
  const fromName = byName.get(h.name_en.toLowerCase()) ?? null;
  const rathena = fromId ?? fromName;
  if (fromDress.length > 0 && rathena) {
    compared++;
    if (sort(fromDress).join() !== sort(rathena).join()) disagree.push(`${h.id} ${h.name_en}: dress ${sort(fromDress)} / rathena ${sort(rathena)}`);
  }
  let pick = null;
  if (fromDress.length > 0) (pick = fromDress), how.dress++;
  else if (fromId) (pick = fromId), how.rathenaId++;
  else if (fromName) (pick = fromName), how.rathenaName++;
  else how.unknown++;
  if (pick) slots[h.id] = sort(pick).map((s) => s[0]).join('');
}

const out = {
  _meta: {
    built: new Date().toISOString().slice(0, 10),
    how: 'node --env-file=.env.local scripts/build-headgear-slots.mjs <rathena db/re/item_db_equip.yml>',
    what: 'head layers per headgear id: letters u upper, m mid, l lower',
    headgears: hats.length,
    from: how,
    control: { compared, disagree },
  },
  slots: Object.fromEntries(Object.entries(slots).sort(([a], [b]) => Number(a) - Number(b))),
};
writeFileSync('data/headgear-slots.json', JSON.stringify(out, null, 1) + '\n');
console.log(hats.length, 'headgears', how, `compared ${compared}, disagree ${disagree.length}`);
for (const d of disagree) console.log('  ', d);

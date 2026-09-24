// Reverse index: item id -> which guide pages feature it.
//
// star-gear.json and woe-items.json already carry real item ids, so those two
// halves are read straight off disk. memorial-gear.json names its 44 set
// pieces (lib/memorial-gear.ts's own comment: "it has no ids"), so this script
// does the same name join that page does at request time, once, against a
// live items table -- the output is committed so every item detail page reads
// a static file instead of repeating that query on every render.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-item-guide-refs.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEST = path.join(process.cwd(), 'data', 'item-guide-refs.json');

const starGear = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'star-gear.json'), 'utf-8'));
const woeItems = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'woe-items.json'), 'utf-8'));
const memorialGear = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'memorial-gear.json'), 'utf-8'));
const formerNames = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'item-former-names.json'), 'utf-8')).items;

function key(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const refs = new Map(); // id -> [{ href, label }]

function add(id, href, label) {
  if (!Number.isFinite(id)) return;
  const list = refs.get(id) ?? [];
  if (!list.some((r) => r.href === href)) list.push({ href, label });
  refs.set(id, list);
}

// star-gear: every entry carries its own id directly.
for (const item of starGear.items) add(item.id, '/guides/star-gear', 'ติดดาว');

// woe: force/gear/cards/other all carry id directly; the two consumable lists
// do not name specific rows (they describe categories), so they contribute
// nothing here.
for (const group of ['force', 'gear', 'cards', 'other']) {
  for (const item of woeItems[group] ?? []) add(item.id, '/guides/woe', 'สงครามกิลด์ (WoE)');
}

// memorial-gear: only the 44 named set pieces (the guide's headline content),
// not crafting materials -- resolved against the live items table the same
// way lib/memorial-gear.ts's loadMemorialGear does, by current name or any
// former name on record.
async function resolveMemorialGear() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const byName = new Map();
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase.from('items').select('id, name_en').order('id').range(from, from + PAGE - 1);
    if (error) throw new Error(`items query failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) {
      byName.set(key(row.name_en), row.id);
      for (const former of formerNames[String(row.id)] ?? []) {
        if (!byName.has(key(former.name))) byName.set(key(former.name), row.id);
      }
    }
    if (data.length < PAGE) break;
  }

  const pieceNames = new Set();
  for (const set of memorialGear.sets) for (const piece of set.pieces) pieceNames.add(piece);

  const unresolved = [];
  for (const name of pieceNames) {
    const id = byName.get(key(name));
    if (id === undefined) {
      unresolved.push(name);
      continue;
    }
    add(id, '/guides/memorial-gear', 'อุปกรณ์ดันเจี้ยนความทรงจำ');
  }
  return { total: pieceNames.size, unresolved };
}

const { total, unresolved } = await resolveMemorialGear();
if (unresolved.length > 0) {
  throw new Error(`memorial-gear: ${unresolved.length}/${total} piece names did not resolve to an item id: ${unresolved.join(', ')}`);
}

const out = {
  _meta: {
    what: 'Reverse index from an item id to the guide pages that feature it, for backlinks on item/equipment/card detail pages.',
    sources: ['data/star-gear.json', 'data/woe-items.json', 'data/memorial-gear.json'],
    regenerate: 'set -a; . ./.env.local; set +a; node scripts/build-item-guide-refs.mjs',
    built: new Date().toISOString().slice(0, 10),
    itemCount: refs.size,
  },
  refs: Object.fromEntries([...refs.entries()].sort((a, b) => a[0] - b[0])),
};

fs.writeFileSync(DEST, JSON.stringify(out, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${DEST}: ${refs.size} items, memorial-gear resolved ${total}/${total} piece names.`);

// Which monsters drop the ordinary twin of each first-tier ★ piece, for the
// "ตัวธรรมดาดรอปจากไหน" drawer on /guides/star-gear. A ★ piece is made from
// dropped copies of its ordinary item (one drop = one token), so the reader's
// real question is "what do I kill".
//
// Base names: the same name without the stars, except five whose ordinary
// item is spelt or named differently. Each override was checked on
// 28 Sep 2026 against the item's own description and required level:
//   Crossbow        -> Cross Bow         (same bow type, both Lv 18; client spells the plain one apart)
//   Hora            -> Studded Knuckles  (both Lv 12 knuckles; the client's own token for ★ Hora is
//                                         "★ Studded Knuckles Crafting Token")
//   Leather Jacket  -> Jacket            ("simple jacket made from inexpensive leather")
//   Long Coat       -> Coat              ("long coat that reaches below the knees")
//   Steel Chainmail -> Chain Mail        (the ★ text: "forge existing steel chain armor")
// Improved Wrist Guard has no ordinary item in the data at all (Ninja is not
// in the game), so it gets an empty list and the page says so.
//
// Every ordinary item has two ids; the slotted one is what monsters drop, the
// other has no droppers (likely the NPC-shop copy, which cannot be traded for
// tokens). Droppers of all ids with the base name are merged.
//
// Rates: null where the source has none. Never filled in.
// Status per monster: 'open' = spawns on at least one map nothing marks as
// closed; 'closed' = spawns only on maps lib/map-availability marks as not yet
// open (with the month); 'nospawn' = no spawn row at all (champion copies and
// monsters of later content).
//
// Run: node scripts/build-star-droppers.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const env = Object.fromEntries(
  fs.readFileSync(path.join(root, '.env.local'), 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const star = JSON.parse(fs.readFileSync(path.join(root, 'data', 'star-gear.json'), 'utf8'));
const closedMaps = JSON.parse(fs.readFileSync(path.join(root, 'data', 'map-availability.json'), 'utf8')).maps;

export const BASE_OVERRIDES = {
  Crossbow: 'Cross Bow',
  Hora: 'Studded Knuckles',
  'Leather Jacket': 'Jacket',
  'Long Coat': 'Coat',
  'Steel Chainmail': 'Chain Mail',
};

const baseName = (name) => name.replace(/^★+ /, '').replace(/ - (Sun|Moon)$/, '');
const out = {};

for (const piece of star.items.filter((p) => p.tier === 1)) {
  const own = baseName(piece.name);
  const plainName = BASE_OVERRIDES[own] ?? own;
  const { data: items, error } = await db.from('items').select('id, name_en, category, icon_url').eq('name_en', plainName);
  if (error) throw error;
  const ids = (items ?? []).map((r) => r.id);
  let droppers = [];
  if (ids.length) {
    const { data: drops, error: dErr } = await db
      .from('monster_drops')
      .select('item_id, rate, monsters(id, name_en, level, image_url)')
      .in('item_id', ids);
    if (dErr) throw dErr;
    const monsterIds = [...new Set((drops ?? []).map((d) => d.monsters?.id).filter(Boolean))];
    const { data: spawns, error: sErr } = monsterIds.length
      ? await db.from('monster_spawns').select('monster_id, map_code').in('monster_id', monsterIds)
      : { data: [], error: null };
    if (sErr) throw sErr;
    const mapsOf = new Map();
    for (const s of spawns ?? []) {
      if (!mapsOf.has(s.monster_id)) mapsOf.set(s.monster_id, new Set());
      mapsOf.get(s.monster_id).add(s.map_code);
    }
    // One row per monster: the best rate if it drops more than one id.
    const byMonster = new Map();
    for (const d of drops ?? []) {
      const m = d.monsters;
      if (!m) continue;
      const prev = byMonster.get(m.id);
      const rate = d.rate == null ? null : Number(d.rate);
      if (!prev || (rate != null && (prev.rate == null || rate > prev.rate))) {
        const maps = [...(mapsOf.get(m.id) ?? [])];
        const open = maps.filter((c) => !closedMaps[c]);
        const status = maps.length === 0 ? 'nospawn' : open.length ? 'open' : 'closed';
        const when = status === 'closed' ? [...new Set(maps.map((c) => closedMaps[c].when))].join(', ') : null;
        byMonster.set(m.id, { id: m.id, name: m.name_en, level: m.level, image: m.image_url ?? null, rate, status, when });
      }
    }
    const order = { open: 0, closed: 1, nospawn: 2 };
    droppers = [...byMonster.values()].sort(
      (a, b) => order[a.status] - order[b.status] || (a.level ?? 999) - (b.level ?? 999) || (b.rate ?? -1) - (a.rate ?? -1),
    );
  }
  // The icon of the id monsters actually drop, else any id's.
  const dropped = (items ?? []).find((r) => droppers.length && r.icon_url) ?? (items ?? []).find((r) => r.icon_url);
  out[piece.id] = { star: piece.name, plainName, plainIds: ids, plainIcon: dropped?.icon_url ?? null, droppers };
}

const file = {
  _meta: {
    what: 'Monsters that drop the ordinary twin of each first-tier ★ piece (keyed by the ★ id).',
    built: new Date().toISOString().slice(0, 10),
    rates: 'null = the source has no rate for that drop; the page shows ไม่ทราบ.',
    status: "open = spawns on a map not marked closed; closed = only on maps data/map-availability.json marks closed (when = month); nospawn = no spawn row.",
    regenerate: 'node scripts/build-star-droppers.mjs',
  },
  pieces: out,
};
fs.writeFileSync(path.join(root, 'data', 'star-droppers.json'), JSON.stringify(file, null, 2) + '\n');
for (const [id, p] of Object.entries(out)) {
  const c = { open: 0, closed: 0, nospawn: 0 };
  for (const d of p.droppers) c[d.status]++;
  console.log(id, p.star, '->', p.plainName, `ids=${p.plainIds.join('/')}`, JSON.stringify(c), 'rated', p.droppers.filter((d) => d.rate != null).length);
}

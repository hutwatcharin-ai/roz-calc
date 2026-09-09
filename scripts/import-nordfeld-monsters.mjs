// Adds the Nordfeld monsters, the one content area our table has none of.
//
// Found on 8 Sep 2026 while chasing search misses on the monsters page. Ten
// cards in our items table -- Mace Boulder Dwarf, Nordium Golem, Gem Poring
// and the rest -- name a monster that is nowhere in the monsters table, and
// no monster we do have carries a spawn on any nrd_* map. The whole of
// Nordfeld (two fields, two cave floors) was never imported.
//
// Two independent sources agree on every one of the ten, and neither is
// ours: the 3 Sep prontera crawl (which carries level, race, element, size,
// drops and spawns) and the 31 Aug rozerodb export (which carries the same
// level, race, element and size, plus the map code, in its page text). The
// name written here is rozerodb's, because it spells out what prontera
// abbreviates -- "Boulder Dwarf Swordmaster", not "Boulderdwarf SM" -- and
// because the two disagreements on word order (Gem Poring / Poring Gem) are
// settled by the card, which is a third witness and an in-game string.
//
// Neither source has HP, EXP, ATK or the stat block for these: both print a
// dash. Those columns are left null rather than guessed, so the page will
// say the number is unknown instead of showing a made-up one.
//
// The six monsters we already have that also live in Nordfeld -- Familiar,
// Spore, Stainer, Green/Red/Shining Plant -- get their missing nrd_ spawn
// rows here too, for the same reason: the map pages are empty without them.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/import-nordfeld-monsters.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const SUMMARY = path.join(process.cwd(), 'docs', 'prontera-export', 'mobs-summary.json');

// id -> the name rozerodb prints, which is the one we store.
const NAMES = {
  25321: 'Boulder Dwarf Mace',
  25322: 'Boulder Dwarf Hammer',
  25323: 'Gem Poring',
  25324: 'Nordium Golem',
  25325: 'Boulder Dwarf Pick',
  25326: 'Boulder Dwarf Cannon',
  25327: 'Boulder Dwarf Hammer (Armored)',
  25328: 'Boulder Dwarf Mace (Armored)',
  25329: 'Boulder Dwarf Leader',
  25336: 'Boulder Dwarf Swordmaster',
};

// prontera writes these lower case and underscored; our columns do not.
const RACE = {
  angel: 'Angel', brute: 'Brute', demi_human: 'Demi-Human', demon: 'Demon',
  dragon: 'Dragon', fish: 'Fish', formless: 'Formless', insect: 'Insect',
  plant: 'Plant', undead: 'Undead',
};
const ELEMENT = {
  earth: 'Earth', fire: 'Fire', ghost: 'Ghost', holy: 'Holy', neutral: 'Neutral',
  poison: 'Poison', shadow: 'Shadow', undead: 'Undead', water: 'Water', wind: 'Wind',
};
const SIZE = { small: 'Small', medium: 'Medium', large: 'Large' };

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const mobs = JSON.parse(fs.readFileSync(SUMMARY, 'utf-8')).monsters;
  const byId = new Map(mobs.map((m) => [m.id, m]));

  const { data: existing, error: exErr } = await db.from('monsters').select('id');
  if (exErr) throw exErr;
  const have = new Set(existing.map((r) => r.id));

  // 1. the ten monsters
  const rows = [];
  for (const [idText, name] of Object.entries(NAMES)) {
    const id = Number(idText);
    if (have.has(id)) { console.log(`  ${id} ${name}: already in the table, skipped`); continue; }
    const m = byId.get(id);
    if (!m) { console.log(`  ${id} ${name}: not in the crawl, skipped`); continue; }
    const race = RACE[m.race];
    const element = ELEMENT[m.element];
    const size = SIZE[m.size];
    if (!race || !element || !size || !m.level) {
      console.log(`  ${id} ${name}: source is missing level/race/element/size, skipped`);
      continue;
    }
    rows.push({
      id, name_en: name, level: m.level, race, element,
      element_level: m.element_level ?? null, size,
      // Not `/images/monsters/${id}.gif`: that was the first version, and
      // none of the ten sprites exists in public/, so every one of them
      // rendered a broken image on production until 9 Sep 2026. A monster row
      // may only carry an image_url for a file this site serves
      // (scripts/monster-images.ts). No allowed source has these sprites.
      image_url: null,
      is_mvp: !!m.is_mvp, is_aggressive: null,
    });
  }

  // 2. their drops, and 3. every Nordfeld spawn the crawl carries
  const wanted = new Set(rows.map((r) => r.id));
  const drops = [];
  for (const id of wanted) {
    for (const d of byId.get(id).drops) {
      // A rate of 0 is the source saying it does not know the rate, not a
      // drop that never happens -- storing it would read as "0%" on the page.
      if (!d.rate) { console.log(`  drop skipped: ${d.name} (${d.item_id}) has no rate in the source`); continue; }
      drops.push({ monster_id: id, item_id: d.item_id, rate: d.rate });
    }
  }
  const spawns = [];
  for (const m of mobs) {
    for (const s of m.spawns) {
      if (!s.map_code?.startsWith('nrd_')) continue;
      if (!wanted.has(m.id) && !have.has(m.id)) continue; // a monster we neither have nor are adding
      spawns.push({
        monster_id: m.id, map_code: s.map_code,
        map_display_name: s.map_name, amount: s.count ?? null,
      });
    }
  }

  // Drops point at items; a card we do not stock would be a dangling link.
  const itemIds = [...new Set(drops.map((d) => d.item_id))];
  const { data: items, error: itErr } = await db.from('items').select('id').in('id', itemIds);
  if (itErr) throw itErr;
  const stocked = new Set(items.map((r) => r.id));
  const dropsOk = drops.filter((d) => stocked.has(d.item_id));
  for (const d of drops) if (!stocked.has(d.item_id)) console.log(`  drop skipped: item ${d.item_id} is not in our items table`);

  // A spawn row we already have must not be doubled.
  const { data: haveSpawns, error: spErr } = await db.from('monster_spawns').select('monster_id, map_code').like('map_code', 'nrd_%');
  if (spErr) throw spErr;
  const seen = new Set(haveSpawns.map((r) => `${r.monster_id}:${r.map_code}`));
  const spawnsNew = spawns.filter((s) => !seen.has(`${s.monster_id}:${s.map_code}`));

  console.log(`\n${rows.length} monsters, ${dropsOk.length} drops, ${spawnsNew.length} spawn rows${dryRun ? ' (dry run: nothing written)' : ''}`);
  for (const r of rows) console.log(`  + ${r.id} ${r.name_en} — lv ${r.level} ${r.element} ${r.race} ${r.size}`);
  for (const s of spawnsNew) console.log(`  spawn ${s.monster_id} @ ${s.map_code} (${s.amount})`);

  if (dryRun) return;
  if (rows.length) {
    const { error } = await db.from('monsters').insert(rows);
    if (error) throw error;
  }
  if (dropsOk.length) {
    const { error } = await db.from('monster_drops').insert(dropsOk);
    if (error) throw error;
  }
  if (spawnsNew.length) {
    const { error } = await db.from('monster_spawns').insert(spawnsNew);
    if (error) throw error;
  }
  console.log('written');
}

main().catch((e) => { console.error(e); process.exit(1); });

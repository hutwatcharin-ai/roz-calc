// Where a piece of gear is worn, for the 248 rows our own table cannot say.
//
// items.weapon_type is the column the equipment filter runs on, and it is
// empty for 244 of the 411 armour rows: pick "เกราะ/สวมใส่ -> รองเท้า" and the
// list answers with 7 pairs of shoes out of 38. Mirror Shield, Coat and every
// Advanced Guild piece are invisible to the filter. The gap is not random --
// it is the rows carrying Zero's renumbered ids (450xxx armour, 460xxx shield,
// 470xxx shoes, 480xxx garment, 490xxx accessory, 4xxxxx headgear), which the
// import never mapped.
//
// Source: rAthena's db/re/item_db_equip.yml, where nearly every entry carries
// a Locations: block. Four passes, most trustworthy first:
//
//   1. by item id     exact
//   2. by item name   the Zero renumbering kept the classic name, so "Mirror
//                     Shield" 460120 resolves through the classic 2103
//   3. by id range    Zero's blocks, 450xxx armour and so on
//   4. by name word   "Desert Leather Boots" is footwear, for the handful of
//                     Zero-only rows the first three passes cannot reach
//
// The last two are inferences, so they are checked rather than assumed: on
// every row rAthena can answer, the rule is compared against that answer, and
// the script refuses to write if it finds a disagreement it does not already
// know about (28949 Jewel Shield sits in the 28xxx accessory block and is a
// shield, which is why 28xxx is not one of the ranges). A future rAthena
// update that breaks a rule fails the build instead of publishing a wrong
// slot. The counts each pass actually produced are in the file's _meta.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-gear-types.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SOURCE = 'https://raw.githubusercontent.com/rathena/rathena/master/db/re/item_db_equip.yml';
const DEST = path.join(process.cwd(), 'data', 'gear-types.json');

/** Values already used in items.weapon_type, so the filter needs no new vocabulary. */
const ARMOR_SLOTS = ['Headgear', 'Armor', 'Garment', 'Shoes', 'Shield', 'Accessory'];

/** rAthena's SubType for weapons -> the wording our column uses. */
const WEAPON_SUBTYPE = {
  Dagger: 'Dagger',
  '1hSword': 'One-handed Sword',
  '2hSword': 'Two-handed Sword',
  '1hAxe': 'One-handed Axe',
  '2hAxe': 'Two-handed Axe',
  '1hSpear': 'One-handed Spear',
  '2hSpear': 'Two-handed Spear',
  '1hStaff': 'One-handed Staff',
  '2hStaff': 'Two-handed Staff',
  Mace: 'Mace',
  Book: 'Book',
  Katar: 'Katar',
  Knuckle: 'Knuckle',
  Whip: 'Whip',
  Musical: 'Instrument',
  Huuma: 'Huuma Shuriken',
  Bow: 'Bow',
  Shotgun: null,
  Rifle: null,
  Gatling: null,
  Grenade: null,
  Revolver: null,
};

/** The one place a Locations block is turned into a slot name. */
function slotFromLocations(locations) {
  const set = new Set(locations);
  // A hat is a hat whichever of the three head layers it occupies.
  if ([...set].some((l) => l.startsWith('Head'))) return 'Headgear';
  if (set.has('Armor')) return 'Armor';
  // Left_Hand on an armour-type row is a shield; weapons never reach here.
  if (set.has('Left_Hand')) return 'Shield';
  if (set.has('Shoes')) return 'Shoes';
  if (set.has('Garment')) return 'Garment';
  if ([...set].some((l) => l.includes('Accessory'))) return 'Accessory';
  return null;
}

/**
 * Zero's id blocks. Verified against rAthena below, not trusted on sight.
 *
 * The classic 2xxx blocks are here too because 88 of the unclassified rows
 * carry classic ids. 28xxx is deliberately absent: Jewel Shield 28949 proves
 * that block mixes shields in with the accessories.
 */
function slotFromIdRange(id) {
  if (id >= 400000 && id < 450000) return 'Headgear';
  if (id >= 450000 && id < 460000) return 'Armor';
  if (id >= 460000 && id < 470000) return 'Shield';
  if (id >= 470000 && id < 480000) return 'Shoes';
  if (id >= 480000 && id < 490000) return 'Garment';
  if (id >= 490000 && id < 500000) return 'Accessory';
  if (id >= 2100 && id < 2200) return 'Shield';
  if (id >= 2200 && id < 2300) return 'Headgear';
  if (id >= 2300 && id < 2400) return 'Armor';
  if (id >= 2400 && id < 2500) return 'Shoes';
  if (id >= 2500 && id < 2600) return 'Garment';
  if (id >= 2600 && id < 3000) return 'Accessory';
  if (id >= 5000 && id < 6000) return 'Headgear';
  if (id >= 18500 && id < 20000) return 'Headgear';
  return null;
}

/**
 * Pass 4, for the rows no id and no name reach: what the name itself says.
 *
 * "Desert Leather Boots" is footwear and nothing but footwear. This is still
 * an inference, so it carries the same control check as the id ranges -- every
 * keyword here is compared against rAthena's answer on every row rAthena can
 * answer, and the build fails on a single disagreement. Words that lose that
 * check are not in this list: "Guard" is a shield in Guard but a headgear in
 * Guard Cap, "Wing" is a headgear or a garment depending on the piece.
 */
const NAME_WORDS = [
  [/\b(boots|sandals?|sandle|shoes|slippers|greaves)\b/i, 'Shoes'],
  [/\b(ring|earrings?|bracelet|clip|necklace|brooch|glove)\b/i, 'Accessory'],
  [/\b(muffler|manteau|hood|cloak|shawl|scarf)\b/i, 'Garment'],
  [/\b(buckler|shield)\b/i, 'Shield'],
  [/\b(hat|cap|helm|helmet|crown|mask|wig|circlet|tiara|hairband|headband|headphones?)\b/i, 'Headgear'],
  [/\b(armor|armour|robe|mail|jacket|suit|tights|clothes|vest|coat)\b/i, 'Armor'],
];

function slotFromName(name) {
  for (const [pattern, slot] of NAME_WORDS) if (pattern.test(name)) return slot;
  return null;
}

/** `  - Id: 2104\n    AegisName: ...` blocks, split without a YAML parser. */
function parseEquipDb(text) {
  const byId = new Map();
  const byName = new Map();
  for (const block of text.split('\n  - Id: ').slice(1)) {
    const id = Number(block.slice(0, block.indexOf('\n')).trim());
    if (!Number.isFinite(id)) continue;
    const locations = [];
    const locationBlock = /\n    Locations:\n((?:      .*\n)+)/.exec(block);
    if (locationBlock) {
      for (const m of locationBlock[1].matchAll(/^ {6}(\w+): true/gm)) locations.push(m[1]);
    }
    const name = (/\n {4}Name: (.*)/.exec(block)?.[1] ?? '').trim().replace(/^"(.*)"$/, '$1');
    const subType = /\n {4}SubType: (\w+)/.exec(block)?.[1] ?? null;
    const entry = { id, name, locations, subType };
    byId.set(id, entry);
    // First name wins: the classic entry comes before its Zero reissue in the
    // file, and the classic one is the one with a Locations block.
    const key = name.toLowerCase();
    if (locations.length > 0 && !byName.has(key)) byName.set(key, entry);
  }
  return { byId, byName };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`could not read the equip table: HTTP ${response.status}`);
  const { byId, byName } = parseEquipDb(await response.text());
  console.log(`${byId.size} equip entries in the source, ${[...byId.values()].filter((e) => e.locations.length > 0).length} with a Locations block`);

  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('items')
      .select('id, name_en, category, weapon_type')
      .in('category', ['Armor', 'Weapon'])
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  console.log(`${rows.length} gear rows, ${rows.filter((r) => !r.weapon_type).length} with no type`);

  // The control check for pass 3. Every row rAthena can answer is compared
  // against what the range rule would have said.
  const KNOWN_EXCEPTIONS = ['28949'];
  const checks = [
    ['id-range', (row) => slotFromIdRange(row.id)],
    ['name-word', (row) => slotFromName(row.name_en)],
  ];
  const control = {};
  for (const [label, guessFor] of checks) {
    let agree = 0;
    const disagree = [];
    for (const row of rows) {
      const entry = byId.get(row.id) ?? byName.get(row.name_en.toLowerCase());
      const truth = entry ? slotFromLocations(entry.locations) : null;
      const guess = guessFor(row);
      if (!truth || !guess) continue;
      if (truth === guess) agree += 1;
      else disagree.push(`${row.id} ${row.name_en}: ${label} says ${guess}, rAthena says ${truth}`);
    }
    console.log(`${label} rule: agrees on ${agree} rows, disagrees on ${disagree.length}`);
    for (const line of disagree) console.log(`  ${line}`);
    const unexpected = disagree.filter((line) => !KNOWN_EXCEPTIONS.includes(line.split(' ')[0]));
    if (unexpected.length > 0) {
      throw new Error(`the ${label} rule broke on ${unexpected.length} rows -- fix it before publishing`);
    }
    control[label] = { agree, disagree };
  }

  const slots = {};
  const source = { id: 0, name: 0, range: 0, word: 0 };
  const unknown = [];
  // An entry answers whichever question it can: a Locations block places
  // armour, a SubType names a weapon. Our own category is not consulted,
  // because on these rows it is sometimes the thing that is wrong.
  const resolve = (entry) => slotFromLocations(entry.locations) ?? WEAPON_SUBTYPE[entry.subType ?? ''] ?? null;

  for (const row of rows) {
    if (row.weapon_type) continue;
    const own = byId.get(row.id);
    let slot = own ? resolve(own) : null;
    let how = 'id';
    if (!slot) {
      const named = byName.get(row.name_en.toLowerCase());
      if (named) {
        slot = resolve(named);
        how = 'name';
      }
    }
    if (!slot) {
      slot = slotFromIdRange(row.id);
      how = 'range';
    }
    if (!slot) {
      slot = slotFromName(row.name_en);
      how = 'word';
    }
    if (!slot) {
      unknown.push({ id: row.id, name: row.name_en, category: row.category });
      continue;
    }
    // A row whose slot is an armour slot belongs in the armour half of the
    // filter, whatever our category column says.
    const belongs = ARMOR_SLOTS.includes(slot) ? 'Armor' : 'Weapon';
    slots[row.id] = { type: slot, how, ...(belongs === row.category ? {} : { category: belongs }) };
    source[how] += 1;
  }

  const ordered = Object.fromEntries(Object.keys(slots).sort((a, b) => Number(a) - Number(b)).map((id) => [id, slots[id]]));
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          built: new Date().toISOString().slice(0, 10),
          source: SOURCE,
          how: 'node scripts/build-gear-types.mjs',
          why: 'items.weapon_type is empty for the rows carrying Zero renumbered ids, which hides most armour from the equipment filter.',
          gearRows: rows.length,
          rowsWithNoType: rows.filter((r) => !r.weapon_type).length,
          filled: Object.keys(ordered).length,
          byId: source.id,
          byName: source.name,
          byIdRange: source.range,
          byNameWord: source.word,
          control,
          categoryFixed: Object.entries(ordered).filter(([, v]) => v.category).map(([id, v]) => `${id} -> ${v.category}`),
          stillUnknown: unknown,
        },
        types: ordered,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`filled ${Object.keys(ordered).length}: ${source.id} by id, ${source.name} by name, ${source.range} by id range, ${source.word} by name word`);
  console.log(`${unknown.length} rows still have no type: ${unknown.map((u) => `${u.id} ${u.name}`).join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

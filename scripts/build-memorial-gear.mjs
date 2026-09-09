// Builds data/memorial-gear.json: the shape of the memorial-dungeon gear
// ladder, which our own data cannot describe.
//
// The 44 pieces are all in our items table with the game client's own
// description, and that text is richer than any guide -- it carries the base
// stats, the per-refine bonuses and the set bonus, which the guides omit. So
// the page renders stats from the client and this file supplies only what the
// client cannot say:
//
//   - that a Subjugation piece becomes an Expedition piece, and what that
//     costs (the client describes each item alone, never the ladder)
//   - which four pieces are meant to be worn together, and for which build
//   - which dungeon a piece comes out of
//   - the enchant rules: price, the chance of destroying the item, and which
//     slot the essence lands in
//
// Source for those: roz-global.info (mirrored in docs/rozglobal-export,
// fetched 8 Sep 2026), a French Zero guide the user has confirmed as sound.
// Every piece name it lists was matched against our items table -- 44 of 44 --
// and the numbers it gives for HP, SP, DEF and FLEE agree with the client on
// all 44, which is the check that lets the rest of its claims stand.
//
// Run:  node scripts/build-memorial-gear.mjs

import fs from 'node:fs';
import path from 'node:path';

const TABLES = path.join(process.cwd(), 'docs', 'rozglobal-export', 'tables.json');
const OUT = path.join(process.cwd(), 'data', 'memorial-gear.json');

const tables = JSON.parse(fs.readFileSync(TABLES, 'utf-8'));
const gear = tables['donjon-equipement.html'];
const craft = tables['donjon-equipement-fabrication.html'];
const enchant = tables['donjon-equipement-enchantement.html'];

/** The guide writes "Nom français (English Name) [1]"; we key on the English. */
function englishName(cell) {
  const m = /\(([^)]+)\)/.exec(cell);
  return (m ? m[1] : cell).replace(/\s*\[\d\]\s*$/, '').replace(/’/g, "'").trim();
}

// Which four pieces belong together, and what the set is for. The grouping is
// the guide's (one table per set); the label is read off the stats those four
// carry -- STR/AGI for melee, DEX/AGI for bow and dagger, INT/DEX for casting
// speed, INT/VIT for a caster that has to survive being hit.
const SET_ROLES = [
  { table: 1, rank: 'IV', role: 'ทุกอาชีพ' },
  { table: 2, rank: 'III', role: 'สายตี' },
  { table: 3, rank: 'III', role: 'สายเวท' },
  { table: 4, rank: 'II', role: 'สายตีระยะประชิด' },
  { table: 5, rank: 'II', role: 'สายว่องไว ธนู/มีด' },
  { table: 6, rank: 'II', role: 'สายเวทเน้นร่ายไว' },
  { table: 7, rank: 'II', role: 'สายเวทเน้นอึด' },
  { table: 8, rank: 'I', role: 'สายตีระยะประชิด' },
  { table: 9, rank: 'I', role: 'สายว่องไว ธนู/มีด' },
  { table: 10, rank: 'I', role: 'สายเวทเน้นร่ายไว' },
  { table: 11, rank: 'I', role: 'สายเวทเน้นอึด' },
];

const sets = SET_ROLES.map(({ table, rank, role }) => ({
  rank,
  role,
  pieces: gear[table].rows.slice(1).map((row) => englishName(row[0])),
}));

// Rank IV is the one the level cap actually allows today. The `level` is the
// required_level our items table carries, checked against every piece.
const ranks = [
  { rank: 'IV', name: 'Subjugation', level: 60, from: 'หีบในดันเจี้ยนความทรงจำโหมดปกติ', crystal: null, crystalAmount: 0 },
  { rank: 'III', name: 'Expedition', level: 70, from: 'อัปจากแรงค์ IV', crystal: 'Faintly Glowing Crystal', crystalAmount: 50 },
  { rank: 'II', name: 'Contingent', level: 80, from: 'อัปจากแรงค์ III', crystal: 'Crystal of Blue Light', crystalAmount: 50 },
  { rank: 'I', name: 'Conqueror', level: 90, from: 'อัปจากแรงค์ II', crystal: null, crystalAmount: 50 },
];

// Jellostones per upgraded piece, and the fragments each stone is made of.
const stoneFor = {};
for (const row of craft[2].rows.slice(1)) {
  const piece = englishName(row[0]);
  // "2 × Pierre de Jellopy du Lotus Rouge (Crimson Jellostone) 1 × ..."
  const parts = [...row[1].matchAll(/(\d+)\s*×[^(]*\(([^)]+)\)/g)].map((m) => ({
    stone: m[2].trim(),
    amount: Number(m[1]),
  }));
  if (parts.length > 0) stoneFor[piece] = parts;
}
// Only eight pieces have their stone cost published; the guide says the rest
// vary "by piece" without listing them. The page must not imply the table is
// complete, so the count travels with the data.
const stoneFromFragment = craft[1].rows.slice(1).map((row) => ({
  stone: englishName(row[0]),
  fragment: englishName(row[1]),
  amount: 5,
}));

// The guide writes these in French; the site is Thai. Small closed sets, so
// a map is honest -- nothing is being interpreted, only rendered.
const SIDE_TH = { Droite: 'ขวา', Gauche: 'ซ้าย' };
const DUNGEON_TH = {
  'Mémoire des orcs': 'ถ้ำออร์ค Geffen',
  'Égouts de Prontera': 'ท่อ Prontera',
  Izlude: 'Izlude',
  "Enfer des fourmis": 'รังมด',
};
const ACTION_TH = { Enchanter: 'ใส่เอนแชนต์', "Retirer l'enchantement": 'ถอดเอนแชนต์' };
const PIECE_TH = { Armure: 'เกราะ' };

function dungeonTh(name) {
  if (!name) return null;
  const key = Object.keys(DUNGEON_TH).find((k) => name.startsWith(k));
  return key ? DUNGEON_TH[key] : name;
}

// Four accessories that sit outside the ladder, one per dungeon on hard mode.
const accessories = gear[12].rows.slice(1).map((row, i) => {
  const materials = [...(craft[3].rows[i + 1]?.[1] ?? '').matchAll(/(\d+)\s*×[^(]*\(([^)]+)\)/g)].map((m) => ({
    item: m[2].trim(),
    amount: Number(m[1]),
  }));
  return {
    name: englishName(row[0]),
    side: SIDE_TH[row[1]] ?? row[1],
    materials,
    dungeon: dungeonTh(craft[3].rows[i + 1]?.[2] ?? null),
  };
});

// What an enchant can land on, and how often. Two tables upstream -- one for
// armour, one that puts garment and shoes side by side -- merged into one row
// per outcome so a reader compares the three slots in a glance.
//
// The three columns each sum to exactly 100.00%, which is the reason these
// are published as rates rather than as somebody's impression. That sum is
// asserted in lib/memorial-gear.test.ts, so a bad re-extraction fails loudly.
const STAT_TH = {
  'ESQ (Flee)': 'FLEE',
  'Critique (Critical)': 'คริ',
  'DÉF (Def)': 'DEF',
  'DÉF.M (Mdef)': 'MDEF',
  'Max HP': 'Max HP',
  AGI: 'AGI',
  DEX: 'DEX',
  'FOR (Str)': 'STR',
  INT: 'INT',
  VIT: 'VIT',
  'CHA (Luk)': 'LUK',
};

/** "6,03 %" -> 6.03 ; a missing cell -> null. */
function percent(cell) {
  if (!cell) return null;
  const n = Number(cell.replace('%', '').replace(',', '.').trim());
  return Number.isFinite(n) ? n : null;
}

const outcomeRows = new Map();
function outcome(stat, value) {
  const id = `${stat}|${value}`;
  if (!outcomeRows.has(id)) {
    outcomeRows.set(id, { stat: STAT_TH[stat] ?? stat, value, armor: null, garment: null, shoes: null });
  }
  return outcomeRows.get(id);
}
for (const row of enchant[1].rows.slice(1)) outcome(row[0], row[1]).armor = percent(row[2]);
for (const row of enchant[2].rows.slice(1)) {
  const o = outcome(row[0], row[1]);
  o.garment = percent(row[2]);
  o.shoes = percent(row[3]);
}
const enchantOutcomes = [...outcomeRows.values()];

// What enchanting costs and what it risks. The essence itself is an item in
// our table, so only the rules live here.
const enchantRules = {
  costs: enchant[0].rows.slice(1).map((row) => ({
    action: ACTION_TH[row[0]] ?? row[0],
    // "100 000 zeny" -> "100,000 zeny"; "1 Zelstar" is left alone.
    cost: row[1].replace(/(\d)\s(?=\d{3})/g, '$1,'),
    destroyChance: row[2].replace(/\s%/, '%'),
  })),
  slotByRank: enchant[3].rows.slice(1).map((row) => ({
    rank: row[1],
    piece: PIECE_TH[row[2]] ?? row[2],
    // "4ᵉ emplacement" -> 4
    slot: Number((/(\d)/.exec(row[3]) ?? [])[1]) || null,
  })),
  outcomes: enchantOutcomes,
};

const out = {
  _meta: {
    what: 'สายชุด 4 แรงค์จากดันเจี้ยนความทรงจำ: ลำดับอัปเกรด ชุดที่ใส่คู่กัน วัตถุดิบ และกติกาเอนแชนต์',
    why: 'ไคลเอนต์บอกค่าของแต่ละชิ้นได้ครบ แต่ไม่บอกว่าชิ้นไหนอัปเป็นชิ้นไหน ใส่คู่กับอะไร หรือเอนแชนต์อย่างไร ไฟล์นี้เก็บเฉพาะส่วนนั้น',
    source: 'roz-global.info (docs/rozglobal-export, ดึง 8 ก.ย. 2026) · ชื่อชิ้นทั้ง 44 ตรงกับตาราง items ของเรา และตัวเลข HP/SP/DEF/FLEE ตรงกับคำอธิบายในไคลเอนต์ทั้ง 44 ชิ้น',
    regenerate: 'node scripts/build-memorial-gear.mjs',
    generatedAt: new Date().toISOString(),
  },
  ranks,
  sets,
  stoneFor,
  stoneFromFragment,
  accessories,
  enchantRules,
};

fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
const pieces = sets.reduce((n, s) => n + s.pieces.length, 0);
console.log(`${ranks.length} ranks · ${sets.length} sets · ${pieces} pieces · ${accessories.length} accessories -> ${path.relative(process.cwd(), OUT)}`);

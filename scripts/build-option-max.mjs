// Random option maximums for /database/random-options (owner, 4 Nov 2026: a
// player who sees a piece in a shop wants to know what the best roll of that
// option is). One row per option per kind of gear, one column per source, the
// highest value each source can roll.
//
// Sources:
// - rozerodb.com/tools/affixes, pulled 7 Oct 2026 into
//   docs/rozerodb-export/data/affixes.json: monster drop, MVP, activation,
//   blacksmith forging and Glast Heim garments. Its monster drop, MVP weapon
//   and forging pools match roztoday's row for row and match the Taiwan
//   official pools (lib/data/random-option-pools.json) slot by slot.
// - Clock Tower Gear: the game's item text as roztoday shows it (seen 4 Nov
//   2026); the owner checked the stat lines (+5) in game. rozerodb and Taiwan
//   do not have it yet.
//
// Option names: the client's own Thai (AddRandomOptionNameTable_thTH) where it
// has one, otherwise written in the same style, with element, race and size
// left in English the way the Thai client leaves them.
//
// Run: node scripts/build-option-max.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = 'docs/rozerodb-export/data/affixes.json';
const OUT = 'data/option-max.json';

const SOURCES = [
  { key: 'monster', label: 'ดรอปมอน' },
  { key: 'mvp', label: 'MVP' },
  { key: 'activation', label: 'Activation' },
  { key: 'forged', label: 'ตีเอง' },
  { key: 'glast', label: 'Glast Heim' },
  { key: 'gear', label: 'Clock Tower Gear' },
];

const KINDS = [
  { key: 'armor', label: 'เกราะ' },
  { key: 'garment', label: 'ผ้าคลุม' },
  { key: 'shoes', label: 'รองเท้า' },
  { key: 'magic', label: 'อาวุธเวท' },
  { key: 'melee', label: 'อาวุธประชิด' },
  { key: 'ranged', label: 'อาวุธระยะไกล' },
  { key: 'clock', label: 'หมวกหอนาฬิกา' },
];

// rozerodb [file key, type] -> [source, kinds it applies to]. Activation's
// "Physical Series" and forged weapons cover melee and ranged alike.
const MAP = [
  ['monsterDrop', 'Armor', 'monster', ['armor']],
  ['monsterDrop', 'Garment', 'monster', ['garment']],
  ['monsterDrop', 'Shoes', 'monster', ['shoes']],
  ['monsterDrop', 'Magic Series', 'monster', ['magic']],
  ['monsterDrop', 'Melee Series', 'monster', ['melee']],
  ['monsterDrop', 'Ranged Series', 'monster', ['ranged']],
  ['mvp', 'Magic Series', 'mvp', ['magic']],
  ['mvp', 'Melee Series', 'mvp', ['melee']],
  ['mvp', 'Ranged Series', 'mvp', ['ranged']],
  ['activation', 'Magic Series', 'activation', ['magic']],
  ['activation', 'Physical Series', 'activation', ['melee', 'ranged']],
  ['blacksmith', 'Forging Weapons', 'forged', ['melee', 'ranged']],
  ['glast', 'Garment', 'glast', ['garment']],
];

// Clock Tower Gear: one roll, slot 1.
const GEAR = [
  ['STR', 1, 5], ['AGI', 1, 5], ['VIT', 1, 5], ['INT', 1, 5], ['DEX', 1, 5], ['LUK', 1, 5],
  ['MaxHP', 1, 500], ['MaxSP', 1, 250], ['ATK', 1, 20], ['MATK', 1, 20], ['HIT', 1, 20], ['FLEE', 1, 20],
];

// Two names for one option in rozerodb.
const SAME = { 'MaxHP(MHP)': 'MaxHP', 'MaxSP(MSP)': 'MaxSP', 'Variable Casting reduction': 'Variable Casting reduction (%)' };

const PLAIN = {
  ATK: 'ATK', 'ATK (%)': 'ATK %', MATK: 'MATK', 'MATK (%)': 'MATK %', ASPD: 'ASPD',
  'ASPD increase (%)': 'ASPD % (ลดดีเลย์หลังโจมตี)', HIT: 'HIT', FLEE: 'FLEE', CRI: 'CRIT',
  'Critical Damage increase (%)': 'ดาเมจคริติคอล %', MaxHP: 'MaxHP', MaxSP: 'MaxSP',
  'MaxHP (%)': 'MaxHP %', 'MaxSP (%)': 'MaxSP %', 'HP Recovery speed increase (%)': 'อัตราฟื้นฟู HP %',
  'SP Recovery speed increase (%)': 'อัตราฟื้นฟู SP %', DEF: 'DEF', MDEF: 'MDEF',
  STR: 'STR', AGI: 'AGI', VIT: 'VIT', INT: 'INT', DEX: 'DEX', LUK: 'LUK',
  'Heal increase (%)': 'ฮีลแรงขึ้น %', 'Received Healing increase': 'ผลการฟื้นฟูที่ได้รับ %',
  'Variable Casting reduction (%)': 'ร่ายแบบแปรผันเร็วขึ้น %', 'Long-range Physical Damage increase (%)': 'ดาเมจกายภาพระยะไกล %',
  'SP Consumption reduction (%)': 'ใช้ SP น้อยลง %',
};

const KIND_TH = { Phys: 'กายภาพ', Physical: 'กายภาพ', Magic: 'เวท' };
const SIZE_TH = { Small: 'เล็ก', Medium: 'กลาง', Large: 'ใหญ่' };

function thai(name) {
  if (PLAIN[name]) return PLAIN[name];
  let m;
  if ((m = name.match(/^(Physical|Phys|Magic) Damage to (Normal|Boss) enemies \(%\)$/)))
    return `ดาเมจ${KIND_TH[m[1]]}ใส่${m[2] === 'Boss' ? 'บอส' : 'มอนธรรมดา'} %`;
  if ((m = name.match(/^(Physical|Phys|Magic) Damage to (\S+) enemies \(%\)$/))) return `ดาเมจ${KIND_TH[m[1]]}ใส่ธาตุ ${m[2]} %`;
  if ((m = name.match(/^(Phys|Magic) Damage to (\S+) monsters \(%\)$/))) return `ดาเมจ${KIND_TH[m[1]]}ใส่เผ่า ${m[2]} %`;
  if ((m = name.match(/^Phys Damage to (Small|Medium|Large) targets \(%\)$/))) return `ดาเมจกายภาพใส่ขนาด${SIZE_TH[m[1]]} %`;
  if ((m = name.match(/^Ignore Normal Enemy (Phys|Magic) Def \(%\)$/))) return `เจาะ ${m[1] === 'Phys' ? 'DEF' : 'MDEF'} มอนธรรมดา %`;
  if ((m = name.match(/^Ignore (\S+) (Phys|Magic) Def \(%\)$/))) return `เจาะ ${m[2] === 'Phys' ? 'DEF' : 'MDEF'} เผ่า ${m[1]} %`;
  if ((m = name.match(/^(Phys|Magic) Damage from (\S+) enemies reduction \(%\)$/))) return `ลดดาเมจ${KIND_TH[m[1]]}จากธาตุ ${m[2]} %`;
  if ((m = name.match(/^(\S+) resistance increase \(%\)$/))) return `ต้านทานธาตุ ${m[1]} %`;
  if ((m = name.match(/^Resistance to (\S+) \(%\)$/))) return `ลดดาเมจจากเผ่า ${m[1]} %`;
  throw new Error(`no Thai name for "${name}"`);
}

// Rows that one of the three sources leaves out (checked 4 Nov 2026). Kept,
// because the other two agree, but marked.
const FLAG = {
  'melee|Physical Damage to Holy enemies (%)': 'ไต้หวันไม่มีแถวนี้ในดรอปมอน rozerodb กับ roztoday มี',
  'ranged|Physical Damage to Holy enemies (%)': 'ไต้หวันไม่มีแถวนี้ในดรอปมอน rozerodb กับ roztoday มี',
  'garment|Magic Damage from Wind enemies reduction (%)': 'ไต้หวันไม่มีแถวนี้ในผ้าคลุม Glast Heim rozerodb มี',
};

const src = JSON.parse(readFileSync(SRC, 'utf8'));
const rows = Object.fromEntries(KINDS.map((k) => [k.key, new Map()]));

function add(kind, en, source, slot, min, max) {
  const key = SAME[en] ?? en;
  const table = rows[kind];
  if (!table.has(key)) table.set(key, { en: key, th: thai(key), cells: {} });
  const row = table.get(key);
  const cell = (row.cells[source] ??= { min, max, slots: [] });
  cell.min = Math.min(cell.min, min);
  cell.max = Math.max(cell.max, max);
  if (!cell.slots.includes(slot)) cell.slots.push(slot);
}

for (const [file, type, source, kinds] of MAP) {
  const list = src[file].filter((r) => r.type === type);
  if (list.length === 0) throw new Error(`nothing for ${file} / ${type}`);
  for (const r of list) {
    const slot = Number(r.tier.replace('Slot ', ''));
    const [lo, hi] = String(r.value).split('-').map(Number);
    for (const k of kinds) add(k, r.name, source, slot, lo, hi ?? lo);
  }
}
for (const [en, lo, hi] of GEAR) add('clock', en, 'gear', 1, lo, hi);

// Sections, in the order a player reads gear: stats, attack, damage by
// element, by race or size, defence piercing, then defence.
const GROUPS = [
  ['stat', 'สเตตัส'],
  ['attack', 'โจมตี'],
  ['element', 'ดาเมจตามธาตุ'],
  ['target', 'ดาเมจตามเผ่า ขนาด บอส'],
  ['pierce', 'เจาะเกราะ'],
  ['defence', 'ป้องกัน'],
];

function group(en) {
  if (/^(STR|AGI|VIT|INT|DEX|LUK|MaxHP|MaxSP)( |$)/.test(en)) return 'stat';
  if (/^Ignore /.test(en)) return 'pierce';
  if (/Damage to (Neutral|Water|Earth|Fire|Wind|Poison|Holy|Shadow|Ghost|Undead) enemies/.test(en)) return 'element';
  if (/Damage to .* (monsters|targets)|Damage to (Normal|Boss) enemies/.test(en)) return 'target';
  if (/^(DEF|MDEF|FLEE)$|Recovery|Received Healing|reduction \(%\)$|resistance|Resistance/.test(en) && !/Casting|Consumption/.test(en)) return 'defence';
  return 'attack';
}

// Ten element rows or ten race rows with the same numbers read as one row
// with ten names on it, which is how a player thinks of them anyway.
function fold(list) {
  const out = [];
  const byKey = new Map();
  for (const r of list) {
    const m = r.th.match(/^(.*(?:ธาตุ|เผ่า|ขนาด)) ?(\S+) %$/);
    if (!m) { out.push({ ...r, group: group(r.en) }); continue; }
    const key = m[1] + '|' + JSON.stringify(r.cells);
    let row = byKey.get(key);
    if (!row) {
      row = { en: r.en, th: m[1] + ' %', members: [], cells: r.cells, group: group(r.en) };
      byKey.set(key, row);
      out.push(row);
    }
    row.members.push(m[2]);
    if (r.flag) (row.flags ??= []).push(m[2] + ': ' + r.flag);
  }
  for (const r of out) if (r.members && r.members.length === 1) { r.th = r.th.replace(/ %$/, ' ' + r.members[0] + ' %'); delete r.members; }
  const order = Object.fromEntries(GROUPS.map(([g], i) => [g, i]));
  return out.sort((a, b) => order[a.group] - order[b.group]);
}

const out = {
  _meta: {
    how: 'node scripts/build-option-max.mjs',
    sources: 'rozerodb.com/tools/affixes (7 Oct 2026); Clock Tower Gear from the game text via roztoday (4 Nov 2026)',
  },
  sources: SOURCES,
  groups: GROUPS.map(([key, label]) => ({ key, label })),
  kinds: KINDS.map((k) => {
    const list = [...rows[k.key].values()];
    for (const r of list) {
      const flag = FLAG[`${k.key}|${r.en}`];
      if (flag) r.flag = flag;
      for (const c of Object.values(r.cells)) c.slots.sort();
    }
    const used = SOURCES.map((s) => s.key).filter((s) => list.some((r) => r.cells[s]));
    return { ...k, sources: used, rows: fold(list) };
  }),
};
writeFileSync(OUT, JSON.stringify(out) + '\n');
console.log(out.kinds.map((k) => `${k.key} ${k.rows.length} rows [${k.sources.join(',')}]`).join('\n'));

// Turns two of the mirrored roz-global.info pages into data the site can use:
// the Qpet eggs and the second job-change NPCs.
//
// Source: docs/rozglobal-export (fetched 8 Sep 2026). Both are things our own
// tables cannot answer -- an egg's stat bonus is not in the item description,
// and no table here holds an NPC's coordinates -- so the guide is the source
// and the page credits it.
//
// Where a second source does exist, it is used. Every egg, taming item and
// source monster is looked up in our own tables, and the drop rate the guide
// prints is compared with the rate in monster_drops. The comparison is
// reported when this runs; a mismatch is data worth knowing about, not a
// reason to silently prefer one side.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-rozglobal-guides.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const TABLES = path.join(process.cwd(), 'docs', 'rozglobal-export', 'tables.json');
const tables = JSON.parse(fs.readFileSync(TABLES, 'utf-8'));

const squash = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------------------------------------------------------------- Qpets

// "Poring (0,2 %) Mastering (0,25 %)" -> two {monster, rate}
function eggSources(cell) {
  return [...(cell ?? '').matchAll(/([A-Za-z][A-Za-z' .-]*?)\s*\(([\d,.]+)\s*%\)/g)].map((m) => ({
    monster: m[1].trim(),
    rate: Number(m[2].replace(',', '.')),
  }));
}

const qpetTowns = tables['qpets.html'][0].rows.slice(1).map((row) => {
  // "/navi payon 175/131"
  const m = /\/navi\s+(\S+)\s+(\d+)\/(\d+)/.exec(row[1] ?? '');
  return { town: row[0], map: m?.[1] ?? null, x: m ? Number(m[2]) : null, y: m ? Number(m[3]) : null };
});

// The bonus cells are mostly stat abbreviations the game already writes in
// English, with a handful of French words mixed in. Those words are replaced
// one for one -- longest first, so "Rés. poison" is matched before "Rés.".
const BONUS_TH = [
  ['Récup. HP', 'ฟื้น HP'],
  ['Récup. SP', 'ฟื้น SP'],
  ['Rés. poison', 'ต้านพิษ'],
  ['Rés. étourd.', 'ต้านสตัน'],
  ['Dégâts phys.', 'ดาเมจกายภาพ'],
  ['P.Dodge', 'P.Dodge'],
  ['→ et', '·'],
];

function bonusTh(text) {
  let out = text.trim();
  for (const [fr, th] of BONUS_TH) out = out.split(fr).join(th);
  return out;
}

const qpets = tables['qpets.html'][1].rows.slice(1).map((row) => ({
  pet: row[0].trim(),
  level1: bonusTh(row[1]),
  level2: bonusTh(row[2]),
  taming: row[3].trim(),
  sources: eggSources(row[4]),
}));

// ------------------------------------------------------- Job change NPCs

// One table per class, in the order the page's headings run.
const JOB_ORDER = [
  'Priest', 'Monk', 'Hunter', 'Bard', 'Dancer', 'Wizard', 'Sage',
  'Blacksmith', 'Alchemist', 'Knight', 'Crusader', 'Assassin', 'Rogue',
];
const PLACE_TH = {
  'Église de Prontera': 'โบสถ์ Prontera',
  Monastère: 'วัด (Monastery)',
  'Forêt de Payon': 'ป่า Payon',
  Comodo: 'Comodo',
  'Tour de Geffen': 'หอคอย Geffen',
  'Académie d’Izlude': 'สถาบัน Izlude',
  'Geffen (intérieur)': 'ในเมือง Geffen',
  'Al De Baran': 'Al De Baran',
  'Prontera (intérieur)': 'ในเมือง Prontera',
  'Château de Prontera': 'ปราสาท Prontera',
  'Désert de Morocc': 'ทะเลทราย Morocc',
  'Phare de Faros': 'ประภาคาร Faros',
};

const jobChange = tables['changement-de-classe-2.html'].map((table, i) => {
  const rows = table.rows;
  const position = rows[0]?.[1] ?? '';
  const m = /\/navi\s+(\S+)\s+(\d+)\/(\d+)/.exec(position);
  const place = position.replace(/\/navi[\s\S]*$/, '').trim();
  return {
    job: JOB_ORDER[i] ?? `class ${i + 1}`,
    place: PLACE_TH[place] ?? place,
    map: m?.[1] ?? null,
    x: m ? Number(m[2]) : null,
    y: m ? Number(m[3]) : null,
    requirement: rows[1]?.[1] ?? null,
  };
});

// ------------------------------------------------------------ cross-check

async function crossCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.log('ไม่มี key ใน env — ข้ามการตรวจไขว้');
    return null;
  }
  const db = createClient(url, key);
  const page = 1000;
  const readAll = async (table, columns) => {
    const out = [];
    for (let from = 0; ; from += page) {
      const { data, error } = await db.from(table).select(columns).order('id').range(from, from + page - 1);
      if (error) throw error;
      out.push(...data);
      if (data.length < page) break;
    }
    return out;
  };
  const [items, monsters, drops] = await Promise.all([
    readAll('items', 'id, name_en'),
    readAll('monsters', 'id, name_en'),
    readAll('monster_drops', 'id, item_id, monster_id, rate'),
  ]);
  const itemByName = new Map(items.map((i) => [squash(i.name_en), i]));
  const monsterByName = new Map(monsters.map((m) => [squash(m.name_en), m]));
  // The guide was written before we renamed thirty monsters to match their
  // cards, so it still says "Moonlight" where the table now says "Moonlight
  // Flower". data/monster-former-names.json is exactly that mapping.
  const former = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'monster-former-names.json'), 'utf-8'));
  for (const [id, names] of Object.entries(former.monsters)) {
    const monster = monsters.find((m) => m.id === Number(id));
    if (!monster) continue;
    for (const { name } of names) if (!monsterByName.has(squash(name))) monsterByName.set(squash(name), monster);
  }
  const dropRate = new Map(drops.map((d) => [`${d.monster_id}:${d.item_id}`, d.rate]));

  let eggsFound = 0;
  let tamingFound = 0;
  const rateChecks = { agree: 0, differ: [], noRow: 0, noMonster: 0 };
  for (const pet of qpets) {
    const egg = itemByName.get(squash(`${pet.pet} Egg`));
    pet.eggId = egg?.id ?? null;
    if (egg) eggsFound += 1;
    const taming = itemByName.get(squash(pet.taming));
    pet.tamingId = taming?.id ?? null;
    if (taming) tamingFound += 1;
    for (const source of pet.sources) {
      const monster = monsterByName.get(squash(source.monster));
      source.monsterId = monster?.id ?? null;
      if (!monster) { rateChecks.noMonster += 1; continue; }
      if (!egg) continue;
      const ours = dropRate.get(`${monster.id}:${egg.id}`);
      if (ours === undefined) { rateChecks.noRow += 1; continue; }
      if (ours === null) { rateChecks.noRow += 1; continue; }
      if (Math.abs(ours - source.rate) < 0.001) rateChecks.agree += 1;
      else rateChecks.differ.push(`${pet.pet}: ไกด์ ${source.rate}% / เรา ${ours}%`);
    }
  }
  return { eggsFound, tamingFound, rateChecks };
}

const check = await crossCheck();

const out = {
  _meta: {
    what: 'ไข่ Qpet และ NPC เปลี่ยนอาชีพ 2 จาก roz-global.info',
    source: 'roz-global.info (docs/rozglobal-export, ดึง 8 ก.ย. 2026)',
    verified: check
      ? `ไข่ที่หาเจอในตาราง items ${check.eggsFound}/${qpets.length} · ของฝึก ${check.tamingFound}/${qpets.length} · อัตราดรอปตรงกับ monster_drops ${check.rateChecks.agree} คู่ ต่างกัน ${check.rateChecks.differ.length} คู่`
      : 'ยังไม่ได้ตรวจไขว้',
    npcNote: 'พิกัด NPC ไม่มีแหล่งที่สอง — ตาราง map_stats ของเราสร้างจากจุดเกิดมอน จึงไม่มีแมพในอาคารทั้ง 13 แมพนี้',
    regenerate: 'node scripts/build-rozglobal-guides.mjs',
    generatedAt: new Date().toISOString(),
  },
  qpetTowns,
  qpets,
  jobChange,
};

fs.writeFileSync(path.join(process.cwd(), 'data', 'rozglobal-guides.json'), JSON.stringify(out, null, 1));
console.log(`qpets ${qpets.length} · เมืองที่มี NPC ${qpetTowns.length} · อาชีพ 2 ${jobChange.length}`);
if (check) {
  console.log(`  ไข่เจอในตารางเรา ${check.eggsFound}/${qpets.length} · ของฝึก ${check.tamingFound}/${qpets.length}`);
  console.log(`  อัตราดรอป: ตรง ${check.rateChecks.agree} · ต่าง ${check.rateChecks.differ.length} · ไม่มีแถวให้เทียบ ${check.rateChecks.noRow} · ไม่รู้จักมอน ${check.rateChecks.noMonster}`);
  for (const d of check.rateChecks.differ) console.log(`    ! ${d}`);
}

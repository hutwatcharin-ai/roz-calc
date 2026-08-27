// Seeds batch 1 of the Thai translation: the structural labels and the
// recurring stat names. Measured against the live data, these 58 terms cover
// 4,240 of the 5,956 lines in all item descriptions -- 71%.
//
// The term list is derived from the database rather than hardcoded, so a term
// that appears in the data but not in the mapping below is REPORTED rather than
// silently skipped. A hardcoded list would drift the first time an item lands.

import { supabaseAdmin } from '../lib/supabase';
import { classifyLine } from '../lib/item-description-th';

// null means deliberately English -- see the migration's comment on thai_term.
const LABEL_TH: Record<string, string | null> = {
  'Weight': 'น้ำหนัก',
  'Type': 'ประเภท',
  'Required Level': 'เลเวลที่ต้องใช้',
  'Equippable by': 'อาชีพที่ใส่ได้',
  'Equipped on': 'ช่องที่ใส่',
  'DEF': null,
  'Position': 'ตำแหน่ง',
  'ATK': null,
  'Weapon Level': 'ระดับอาวุธ',
  'Element': 'ธาตุ',
  'Equipped': 'ใช้กับ',
  'Equip': 'ใช้กับ',
  'Usable by': 'อาชีพที่ใช้ได้',
  'Range': 'ระยะ',
  'Cover reads': 'ปกเขียนว่า',
  'Cooldown': null,
  'Melee physical attacks': 'การโจมตีระยะประชิด',
};

const STAT_TH: Record<string, string | null> = {
  'ATK': null, 'DEF': null, 'MATK': null, 'MDEF': null,
  'STR': null, 'AGI': null, 'VIT': null, 'INT': null, 'DEX': null, 'LUK': null,
  'HIT': null, 'FLEE': null, 'CRIT': null, 'ASPD': null,
  'MHP': null, 'MSP': null, 'SP': null, 'HP': null,
  'FLEE Rate': 'อัตรา FLEE',
  'Perfect Dodge': null,
  'Movement Speed': 'ความเร็วเคลื่อนที่',
  'Attack Speed': 'ความเร็วโจมตี',
  'Critical Rate': 'อัตรา CRIT',
  'Critical Damage': null,
  'Physical Damage': null,
  'Magical Damage': null,
  'Ranged Physical Damage': null,
  'Damage Taken': null,
  'Resistance': null,
  'Cast Time': 'เวลาร่าย',
  'Fixed Casting Time': 'เวลาร่ายคงที่',
  'Variable Casting Time': null,
  'SP Recovery': 'การฟื้นฟู SP',
  'HP Recovery': 'การฟื้นฟู HP',
  'Weight Limit': 'น้ำหนักที่แบกได้',
  'EXP': null,
  'Zeny': null,
};

async function main() {
  const db = supabaseAdmin();

  // Read every description and classify it, so the terms actually present in
  // the data are what gets seeded.
  const descriptions: string[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('description').range(from, from + 999);
    if (error) throw new Error(`Failed to read items at ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) if (row.description) descriptions.push(row.description);
    if (data.length < 1000) break;
  }

  const labels = new Map<string, number>();
  const stats = new Map<string, number>();
  for (const d of descriptions) {
    for (const raw of d.split('\n')) {
      const c = classifyLine(raw);
      if (!c) continue;
      if (c.kind === 'label') labels.set(c.term, (labels.get(c.term) ?? 0) + 1);
      else if (c.kind === 'stat') stats.set(c.term, (stats.get(c.term) ?? 0) + 1);
    }
  }

  const rows: { source_term: string; thai_term: string | null; kind: string }[] = [];
  const unseeded: string[] = [];
  let covered = 0;

  for (const [term, count] of labels) {
    if (term in LABEL_TH) {
      rows.push({ source_term: term, thai_term: LABEL_TH[term], kind: 'label' });
      covered += count;
    } else {
      unseeded.push(`label (${count}x): ${term}`);
    }
  }

  for (const [term, count] of stats) {
    if (term in STAT_TH) {
      rows.push({ source_term: term, thai_term: STAT_TH[term], kind: 'stat' });
      covered += count;
    } else {
      unseeded.push(`stat (${count}x): ${term}`);
    }
  }

  const { error } = await db.from('item_description_terms').upsert(rows, { onConflict: 'source_term' });
  if (error) throw new Error(`Failed to seed terms: ${error.message}`);

  console.log(`seeded ${rows.length} terms, covering ${covered} lines`);
  console.log(`not seeded: ${unseeded.length}`);
  for (const u of unseeded.slice(0, 40)) console.log(`  ${u}`);
  if (unseeded.length > 40) console.log(`  ... and ${unseeded.length - 40} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

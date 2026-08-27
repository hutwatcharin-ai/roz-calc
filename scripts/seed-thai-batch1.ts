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
  // Alternate spellings of stats already mapped above, listed separately
  // because the lookup is exact and the source data is not consistent about
  // capitalisation or abbreviation.
  'Flee': null, 'Max HP': null, 'Max SP': null,
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

  // A term can legitimately appear as both a label and a stat name -- ATK and
  // DEF are both, in the live data. `source_term` is the primary key, so an
  // upsert batch containing two rows for the same term makes Postgres refuse
  // the whole batch ("ON CONFLICT DO UPDATE command cannot affect row a
  // second time"). Rows are therefore built into a Map keyed by source_term,
  // not an array, so each term contributes exactly one row.
  const rowsByTerm = new Map<string, { source_term: string; thai_term: string | null; kind: string }>();
  const conflicts: string[] = [];
  const unseeded: string[] = [];
  let covered = 0;
  let merged = 0;

  function addTerm(term: string, count: number, mapping: Record<string, string | null>, kind: string) {
    if (!(term in mapping)) {
      unseeded.push(`${kind} (${count}x): ${term}`);
      return;
    }
    covered += count;
    const thaiTerm = mapping[term];
    const existing = rowsByTerm.get(term);
    if (!existing) {
      // `kind` records where the term was first seen, not an exhaustive
      // classification -- a term like ATK is genuinely both a label and a
      // stat name.
      rowsByTerm.set(term, { source_term: term, thai_term: thaiTerm, kind });
      return;
    }
    merged += 1;
    if (existing.thai_term !== thaiTerm) {
      // A term meaning one thing as a label and another as a stat is a real
      // inconsistency in the mapping, not something to paper over. Silently
      // keeping whichever came first would hide that behind a working seed,
      // so this fails loudly instead -- nothing in today's data hits this
      // path, which is exactly why it must fail if it ever does.
      conflicts.push(
        `${term}: ${existing.kind}=${JSON.stringify(existing.thai_term)} vs ${kind}=${JSON.stringify(thaiTerm)}`,
      );
    }
  }

  for (const [term, count] of labels) addTerm(term, count, LABEL_TH, 'label');
  for (const [term, count] of stats) addTerm(term, count, STAT_TH, 'stat');

  if (conflicts.length > 0) {
    throw new Error(`Conflicting translations between label and stat mappings:\n${conflicts.join('\n')}`);
  }

  const rows = [...rowsByTerm.values()];

  const { error } = await db.from('item_description_terms').upsert(rows, { onConflict: 'source_term' });
  if (error) throw new Error(`Failed to seed terms: ${error.message}`);

  console.log(`seeded ${rows.length} terms, covering ${covered} lines`);
  console.log(`merged ${merged} terms that appear as both a label and a stat name`);
  console.log(`not seeded: ${unseeded.length}`);
  for (const u of unseeded.slice(0, 40)) console.log(`  ${u}`);
  if (unseeded.length > 40) console.log(`  ... and ${unseeded.length - 40} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

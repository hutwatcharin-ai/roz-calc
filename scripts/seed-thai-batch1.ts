// Seeds batch 1 of the Thai translation: the structural labels and the
// recurring stat names. Measured against the live data on 2026-08-27, this
// seeds 46 terms (25 of them deliberately English) covering 4,195 of the 5,956
// lines in all item descriptions -- 70%. All 20 label terms in the data are
// seeded; the 106 unseeded terms are all long phrase-shaped "stat" names
// (`Damage Taken from Insect Monsters`), which batch 2 translates whole.
//
// The term list is derived from the database rather than hardcoded, so a term
// that appears in the data but not in the mapping below is REPORTED rather than
// silently skipped. A hardcoded list would drift the first time an item lands.
//
// Drift runs the other way too, so the script also reports mapping keys that
// occur nowhere in the data -- 13 of them today. Those are kept deliberately:
// they are real spellings the game uses elsewhere and cost nothing while they
// match nothing, and the report means they cannot quietly become fiction.

import { supabaseAdmin } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetch-all-rows';
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
  // Three label terms that are really sentence openers. They are still labels
  // structurally -- name, colon, value -- so they belong here rather than in
  // the whole-line table, and leaving them out was how the earlier "17 of 17
  // labels mapped" ledger line came to be true against a short measurement.
  // Skill and item names (Faith, Prisoner Uniform) stay English, like every
  // other proper noun the game shows in English.
  //
  // NOTE for batch 2: these three render a Thai opener followed by an
  // untranslated English clause, which is an improvement but not a finished
  // line. To finish one, put the whole sentence in item_description_lines and
  // leave this row alone -- compose() gives the line dictionary priority over
  // the term dictionary, so the whole line wins on its own.
  'During transformation': 'ระหว่างแปลงร่าง',
  'For each level of Faith learned': 'ต่อทุกเลเวลของ Faith ที่เรียนรู้',
  'When worn with Prisoner Uniform': 'เมื่อสวมคู่กับ Prisoner Uniform',
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
  // One stat, three spellings, and they must not land in three different
  // states: `CRIT` and `Critical` are the stat itself and stay English like
  // every other stat abbreviation, while `Critical Rate` is the stat plus the
  // word "rate", which is what gets translated.
  'Critical': null,
  'FLEE Rate': 'อัตรา FLEE',
  // "อัตรา Critical", never "อัตรา CRIT": the source line says "Critical Rate",
  // so a reader matching the page against their game client never sees the
  // string "CRIT" there. A translation may not introduce a token the English
  // did not contain -- the same ruling that turned a bare `FLEE` back into
  // `อัตรา FLEE`, which is allowed only because FLEE is in the source.
  'Critical Rate': 'อัตรา Critical',
  'Perfect Dodge': null,
  'Movement Speed': 'ความเร็วเคลื่อนที่',
  'Attack Speed': 'ความเร็วโจมตี',
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
  // `.order('id')` is load-bearing, not tidiness: without a stable sort
  // PostgREST may return rows in a different order per request, so page two can
  // repeat or skip rows from page one. It happens to be stable at 1,300 rows
  // today, which is exactly how this class of bug stays hidden until the table
  // grows.
  const { data: itemRows, error: itemsError } = await fetchAllRows<{ description: string | null }>(
    (from, to) => db.from('items').select('description').order('id').range(from, to),
  );
  if (itemsError) throw new Error(`Failed to read items: ${itemsError.message}`);
  const descriptions: string[] = [];
  for (const row of itemRows ?? []) if (row.description) descriptions.push(row.description);

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
      // `kind` records where the term was FIRST SEEN, not an exhaustive
      // classification. The label loop runs before the stat loop, so ATK and
      // DEF are stored as 'label' even though both are also stat names.
      //
      // Nothing reads `kind` today, which is why this is a recorded risk and
      // not a restructure: a future query filtering `where kind = 'stat'`
      // would silently miss ATK and DEF -- the two most common stats in the
      // data. Whoever writes that query must read the terms table as
      // term-keyed and treat `kind` as a hint about provenance only.
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

  // Keys that match nothing in the data are reported for the same reason terms
  // in the data that match no key are: a mapping and a measurement that drift
  // apart quietly is how "17 of 17 labels mapped" came to be written about 20.
  const seen = new Set([...labels.keys(), ...stats.keys()]);
  const dead = [...Object.keys(LABEL_TH), ...Object.keys(STAT_TH)].filter((k) => !seen.has(k));

  console.log(`seeded ${rows.length} terms, covering ${covered} lines`);
  console.log(`  ${rows.filter((r) => r.thai_term === null).length} of them deliberately English (NULL)`);
  console.log(`merged ${merged} terms that appear as both a label and a stat name`);
  console.log(`distinct terms in the data: ${labels.size} labels, ${stats.size} stat names`);
  console.log(`mapping keys that occur nowhere in the data: ${dead.length}`);
  for (const d of dead) console.log(`  ${d}`);
  console.log(`not seeded: ${unseeded.length}`);
  for (const u of unseeded.slice(0, 40)) console.log(`  ${u}`);
  if (unseeded.length > 40) console.log(`  ... and ${unseeded.length - 40} more`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

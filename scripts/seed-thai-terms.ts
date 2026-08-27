// Seeds the term dictionary: the structural labels and the stat names.
//
// Not "batch 1" -- one script owns this table, and every batch adds to the
// mapping below rather than writing a second script with a second mapping that
// can drift from this one. Measured against the live data on 2026-08-27, this
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

  // ---------------------------------------------------------------------
  // Batch 2: the long phrase-shaped stat names. 106 terms, 141 occurrences.
  //
  // These are compounds, and the whole point of translating them as TERMS is
  // that the value passes through untouched -- an item with -15% and one with
  // -3% are the same translation work. They follow four shapes, held to
  // strictly so the page does not read as if four people wrote it:
  //
  //   Physical Damage to X   -> Physical Damage ต่อ<X>
  //   Damage Taken from X    -> Damage Taken จาก<X>
  //   X-Property Resistance  -> Resistance ธาตุ X
  //   Resistance to <status> -> Resistance ต่อ <status>
  //
  // Mechanic terms keep their canonical English spelling even where the source
  // is inconsistent about case (`Physical damage to ...`). Rendering the same
  // mechanic two ways because the upstream data is sloppy is exactly the drift
  // this glossary exists to prevent, and the token is the game's own, not one
  // this translation invented.

  // Physical Damage to <race>
  'Physical Damage to Brute Monsters': 'Physical Damage ต่อมอนสเตอร์ Brute',
  'Physical Damage to Demon Monsters': 'Physical Damage ต่อมอนสเตอร์ Demon',
  'Physical damage to Demon-type enemies': 'Physical Damage ต่อศัตรูประเภท Demon',
  'Physical Damage to Dragon Monsters': 'Physical Damage ต่อมอนสเตอร์ Dragon',
  'Physical Damage to Fish Monsters': 'Physical Damage ต่อมอนสเตอร์ Fish',
  'Physical Damage to Formless Monsters': 'Physical Damage ต่อมอนสเตอร์ Formless',
  'Physical Damage to Insect Monsters': 'Physical Damage ต่อมอนสเตอร์ Insect',
  'Physical Damage to Plant Monsters': 'Physical Damage ต่อมอนสเตอร์ Plant',
  'Physical Damage to Undead Monsters': 'Physical Damage ต่อมอนสเตอร์ Undead',
  'Physical damage to Undead monsters': 'Physical Damage ต่อมอนสเตอร์ Undead',
  'Physical Damage to Demi-Human Enemies': 'Physical Damage ต่อศัตรู Demi-Human',
  'Physical damage to Demi-Human enemies': 'Physical Damage ต่อศัตรู Demi-Human',
  'Physical Damage to Boss Monsters': 'Physical Damage ต่อมอนสเตอร์ Boss',
  'Physical Damage to Large-Size Monsters': 'Physical Damage ต่อมอนสเตอร์ขนาด Large',
  'Physical Damage to Medium-Size Monsters': 'Physical Damage ต่อมอนสเตอร์ขนาด Medium',

  // Physical Damage to <element>
  'Physical Damage to Earth Enemies': 'Physical Damage ต่อศัตรูธาตุ Earth',
  'Physical Damage to Wind Enemies': 'Physical Damage ต่อศัตรูธาตุ Wind',
  'Physical Damage to Fire-property Monsters': 'Physical Damage ต่อมอนสเตอร์ธาตุ Fire',
  'Physical damage to Ghost-Property monsters': 'Physical Damage ต่อมอนสเตอร์ธาตุ Ghost',
  'Physical Damage to Holy-property Monsters': 'Physical Damage ต่อมอนสเตอร์ธาตุ Holy',
  'Physical Damage to Water-property Monsters': 'Physical Damage ต่อมอนสเตอร์ธาตุ Water',
  'Physical Damage to Wind-property Monsters': 'Physical Damage ต่อมอนสเตอร์ธาตุ Wind',

  // Physical Damage to a named monster, or a race the glossary does not list.
  // The name stays exactly as the game spells it, plural included.
  'Physical Damage to Aster': 'Physical Damage ต่อ Aster',
  'Physical Damage to Goblin': 'Physical Damage ต่อ Goblin',
  'Physical damage to Orcs': 'Physical Damage ต่อ Orcs',
  'Physical Damage to Shellfish': 'Physical Damage ต่อ Shellfish',
  'Physical Damage to Siege Guardians': 'Physical Damage ต่อ Siege Guardians',

  // Damage Taken from ...
  'Damage Taken from Angel Monsters': 'Damage Taken จากมอนสเตอร์ Angel',
  'Damage Taken from Brute Monsters': 'Damage Taken จากมอนสเตอร์ Brute',
  'Damage Taken from Demon Monsters': 'Damage Taken จากมอนสเตอร์ Demon',
  'Damage Taken from Demon Enemies': 'Damage Taken จากศัตรู Demon',
  'Damage Taken from Demon and Undead Enemies': 'Damage Taken จากศัตรู Demon และ Undead',
  'Damage Taken from Demi-Human Enemies': 'Damage Taken จากศัตรู Demi-Human',
  'Damage Taken from Dragon Monsters': 'Damage Taken จากมอนสเตอร์ Dragon',
  'Damage Taken from Formless Monsters': 'Damage Taken จากมอนสเตอร์ Formless',
  'Damage Taken from Insect Monsters': 'Damage Taken จากมอนสเตอร์ Insect',
  'Damage taken from Plant enemies': 'Damage Taken จากศัตรู Plant',
  'Damage taken from Earth-property monsters': 'Damage Taken จากมอนสเตอร์ธาตุ Earth',
  'Damage taken from Fire-property attacks': 'Damage Taken จากการโจมตีธาตุ Fire',
  'Damage taken from Shadow-Property attacks': 'Damage Taken จากการโจมตีธาตุ Shadow',
  'Damage taken from boss-type enemies': 'Damage Taken จากศัตรูประเภท Boss',
  'Damage taken from normal enemies': 'Damage Taken จากศัตรูทั่วไป',
  'Damage Taken from siege Guardians': 'Damage Taken จาก siege Guardians',

  // `Physical Damage Taken` keeps the whole English phrase. The glossary holds
  // both `Physical Damage` and `Damage Taken`, they overlap on one word, and
  // any Thai rendering that splits them drops one of the two.
  'Physical Damage Taken from Fish Monsters': 'Physical Damage Taken จากมอนสเตอร์ Fish',
  'Physical Damage Taken from Undead Enemies': 'Physical Damage Taken จากศัตรู Undead',
  'Physical Damage Taken from Undead Monsters': 'Physical Damage Taken จากมอนสเตอร์ Undead',
  'Physical damage taken from Angel Monsters': 'Physical Damage Taken จากมอนสเตอร์ Angel',
  'Physical damage taken from Demon Monsters': 'Physical Damage Taken จากมอนสเตอร์ Demon',
  'Physical damage taken from Munak': 'Physical Damage Taken จาก Munak',
  'Ranged Physical Damage Taken': 'Physical Damage Taken จากระยะไกล',
  'Physical and magical damage taken from Plant monsters':
    'ความเสียหายกายภาพและเวทที่ได้รับจากมอนสเตอร์ Plant',

  // <element>-Property Resistance
  'Earth-Property Resistance': 'Resistance ธาตุ Earth',
  'Fire-Property Resistance': 'Resistance ธาตุ Fire',
  'Ghost-Property Resistance': 'Resistance ธาตุ Ghost',
  'Holy-Property Resistance': 'Resistance ธาตุ Holy',
  'Neutral-Property Resistance': 'Resistance ธาตุ Neutral',
  'Poison-Property Resistance': 'Resistance ธาตุ Poison',
  'Shadow-Property Resistance': 'Resistance ธาตุ Shadow',
  'Undead-Property Resistance': 'Resistance ธาตุ Undead',
  'Water-Property Resistance': 'Resistance ธาตุ Water',
  'Wind-Property Resistance': 'Resistance ธาตุ Wind',
  'Shadow- and Undead-Property Resistance': 'Resistance ธาตุ Shadow และ Undead',

  // Resistance to <status ailment>. The ailment stays English -- it is what
  // the game prints on the status icon the player is looking at.
  'Resistance to Bleeding': 'Resistance ต่อ Bleeding',
  'Resistance to Blind': 'Resistance ต่อ Blind',
  'Resistance to Confusion': 'Resistance ต่อ Confusion',
  'Resistance to Frozen': 'Resistance ต่อ Frozen',
  'Resistance to Petrify': 'Resistance ต่อ Petrify',
  'Resistance to Poison': 'Resistance ต่อ Poison',
  'Resistance to Silence': 'Resistance ต่อ Silence',
  'Resistance to Sleep': 'Resistance ต่อ Sleep',
  'Resistance to Stun': 'Resistance ต่อ Stun',

  // Recovery and healing
  'HP Recovery Rate': 'อัตราฟื้นฟู HP',
  'HP recovery rate': 'อัตราฟื้นฟู HP',
  'SP Recovery Rate': 'อัตราฟื้นฟู SP',
  'SP recovery rate': 'อัตราฟื้นฟู SP',
  'HP recovery from Candy and Candy Cane': 'การฟื้นฟู HP จาก Candy และ Candy Cane',
  'HP recovery from Herb-type items': 'การฟื้นฟู HP จากไอเทมประเภท Herb',
  "HP recovery from Meat and Monster's Feed": "การฟื้นฟู HP จาก Meat และ Monster's Feed",
  'Heal effect of sushi and sashimi consumption': 'ผลการฟื้นฟูจากซูชิและซาชิมิ',
  'Received Heal Amount': 'ปริมาณ Heal ที่ได้รับ',

  // EXP
  'EXP Gained from Angel Monsters': 'EXP ที่ได้รับจากมอนสเตอร์ Angel',
  'EXP Gained from Demon Monsters': 'EXP ที่ได้รับจากมอนสเตอร์ Demon',
  'EXP Gained from Fish Monsters': 'EXP ที่ได้รับจากมอนสเตอร์ Fish',
  'EXP Gained from Undead Monsters': 'EXP ที่ได้รับจากมอนสเตอร์ Undead',

  // Skills and casting
  'Cast time': 'เวลาร่าย',
  'Fixed casting time': 'เวลาร่ายคงที่',
  'SP consumption': 'การใช้ SP',
  'SP cost of skills': 'SP ที่สกิลใช้',
  'Arrow Throwing damage': 'ความเสียหายของ Arrow Throwing',
  'Damage of Double Strafe and Arrow Shower': 'ความเสียหายของ Double Strafe และ Arrow Shower',
  'Damage of Holy Light': 'ความเสียหายของ Holy Light',
  'Damage of Meteor Storm and Fire Pillar': 'ความเสียหายของ Meteor Storm และ Fire Pillar',
  'Damage of Slinging Arrow and Melody Strike':
    'ความเสียหายของ Slinging Arrow และ Melody Strike',
  'Earth Magical Damage': 'ความเสียหายเวทธาตุ Earth',
  'Ranged Weapon Physical Damage': 'Physical Damage ของ Weapon ระยะไกล',
  'Critical Rate against Demi-Human monsters': 'อัตรา Critical ต่อมอนสเตอร์ Demi-Human',
  'Critical Rate against Dragon monsters': 'อัตรา Critical ต่อมอนสเตอร์ Dragon',
  'Critical Rate against Insect monsters': 'อัตรา Critical ต่อมอนสเตอร์ Insect',

  // Sentence-opener stat names: the value that follows them is the number.
  'Each refine increases Raging Trifecta Blow damage by':
    'ทุกระดับตีบวก เพิ่มความเสียหายของ Raging Trifecta Blow',
  'Each refine on Shield grants MDEF': 'ทุกระดับตีบวกของ Shield ให้ MDEF',

  'All basic stats': 'ค่าสถานะพื้นฐานทั้งหมด',

  // Deliberately English: stat names the game itself displays in English, the
  // same family as ATK and Perfect Dodge above.
  'MaxHP': null,
  'MaxSP': null,
  'Perfect Hit': null,
  'Physical Defense': null,
  'Stun': null,
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

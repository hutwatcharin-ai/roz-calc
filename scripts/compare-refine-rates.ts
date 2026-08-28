// Cross-checks the refine success table against rozerodb's transcription.
//
// The success table is the one part of the refine data with no formula behind
// it: the ATK, bonus-ATK and DEF tables are arithmetic and lib/refine-table.
// test.ts derives them from formula, but success chances are just numbers on a
// page. So they get a second reader instead.
//
// rozerodb.com transcribed the same official page (roz.mygnjoy.com guide 20)
// independently. Its robots.txt allows everything except /api/, and this reads
// one guide page. Running it the first time found four wrong cells in our
// table -- armour's special column at +11 to +14, read as 18 where it is 8.
//
// Run it with:  npx tsx scripts/compare-refine-rates.ts
// Needs network access. Exits non-zero on any difference.

import { GEAR_TYPES, MAX_REFINE, REFINE_CHANCE, type GearType } from '../lib/refine-table';

const URL = 'https://rozerodb.com/guides/refine';

// Their column order, left to right, under the "Refinement Rates" heading. Each
// column is a Normal/Special pair, so a row is ten numbers.
const COLUMNS: GearType[] = ['armour', 'weapon1', 'weapon2', 'weapon3', 'weapon4'];

function textOf(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

function parseRates(text: string): Record<number, Record<GearType, { normal: number; special: number }>> {
  const start = text.indexOf('Refinement Rates');
  if (start === -1) throw new Error('no "Refinement Rates" section -- the page layout changed');

  const section = text.slice(start, start + 6000);
  const rows: Record<number, Record<GearType, { normal: number; special: number }>> = {};

  // "+ 11 8 % 8 % 18 % 18 % 18 % 18 % 15 % 15 % 8 % 8 %"
  const ROW = /\+ (\d+) ((?:\d+ % ){9}\d+ %)/g;
  for (const match of section.matchAll(ROW)) {
    const level = Number(match[1]);
    const values = [...match[2].matchAll(/(\d+) %/g)].map((m) => Number(m[1]));
    if (values.length !== 10) throw new Error(`+${level}: ${values.length} values, expected 10`);
    rows[level] = Object.fromEntries(
      COLUMNS.map((gear, i) => [gear, { normal: values[i * 2], special: values[i * 2 + 1] }]),
    ) as Record<GearType, { normal: number; special: number }>;
  }

  const missing = Array.from({ length: MAX_REFINE }, (_, i) => i + 1).filter((n) => !rows[n]);
  if (missing.length > 0) {
    // Refusing a partial comparison: silently checking 14 of 20 levels and
    // reporting "no differences" is worse than not checking at all.
    throw new Error(`parsed only ${Object.keys(rows).length} levels, missing +${missing.join(', +')}`);
  }
  return rows;
}

async function main(): Promise<void> {
  const response = await fetch(URL);
  if (!response.ok) throw new Error(`Failed to fetch ${URL}: ${response.status}`);
  const theirs = parseRates(textOf(await response.text()));

  const differences: string[] = [];
  let cells = 0;

  for (let level = 1; level <= MAX_REFINE; level += 1) {
    for (const gear of GEAR_TYPES) {
      for (const kind of ['normal', 'special'] as const) {
        cells += 1;
        const ours = REFINE_CHANCE[gear][level - 1][kind];
        const them = theirs[level][gear][kind];
        if (ours !== them) differences.push(`+${level} ${gear} ${kind}: ours ${ours}, rozerodb ${them}`);
      }
    }
  }

  console.log(`${cells} cells compared against rozerodb`);
  console.log(`${differences.length} differ:`);
  for (const line of differences) console.log(`  ${line}`);

  if (differences.length === 0) {
    console.log('\ntwo independent readings of the same page agree everywhere');
    return;
  }
  console.log('\none of the two transcriptions is wrong -- go and look at the page');
  process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

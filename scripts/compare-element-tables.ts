// Cross-checks the official Zero element table against rAthena's Renewal one.
//
// This is what makes a hand transcription of 400 cells trustworthy: a slip of
// the eye shows up as a spray of differences, not as the one the two sources
// genuinely disagree on. Run it after touching official-element-data.ts.
//
// Run it with:  npx tsx scripts/compare-element-tables.ts
// Needs network access to raw.githubusercontent.com. Exits non-zero if the
// differences are not exactly the known list below.

import { ELEMENT_TABLE, ELEMENTS, type Element, type ElementLevel } from '../lib/element-table';
import { OFFICIAL_COLUMNS, OFFICIAL_ELEMENT_TABLE } from './official-element-data';

const RATHENA_URL = 'https://raw.githubusercontent.com/rathena/rathena/master/db/re/attr_fix.yml';

// rAthena writes Dark where the game writes Shadow.
const RENAME: Record<string, string> = { Dark: 'Shadow' };

// The differences we already know about. Anything outside this list is a
// transcription error until proven otherwise.
//
// The one entry is also the one cell the site does NOT ship as the guide has
// it: the guide's Lv2 Poison row duplicates its Lv1 row character for
// character, so the generator overrides it back to rAthena's 50. That is why
// the second check below expects the shipped table to differ from rAthena
// nowhere at all -- if the override ever stops being applied, this run says so.
const KNOWN: { level: ElementLevel; attack: Element; defence: Element; official: number; rathena: number }[] = [
  { level: 2, attack: 'Undead', defence: 'Poison', official: 75, rathena: 50 },
];

function parse(yaml: string): Record<number, Record<string, Record<string, number>>> {
  const table: Record<number, Record<string, Record<string, number>>> = {};
  let level: number | null = null;
  let attacker: string | null = null;

  for (const raw of yaml.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (line.trim() === '' || line.trim().startsWith('#')) continue;

    const levelMatch = /^\s*-\s*Level:\s*(\d+)\s*$/.exec(line);
    if (levelMatch) {
      level = Number(levelMatch[1]);
      table[level] = {};
      attacker = null;
      continue;
    }
    if (level === null) continue;

    const attackerMatch = /^ {4}([A-Za-z]+):\s*$/.exec(line);
    if (attackerMatch) {
      attacker = RENAME[attackerMatch[1]] ?? attackerMatch[1];
      table[level][attacker] = {};
      continue;
    }

    const valueMatch = /^ {6}([A-Za-z]+):\s*(-?\d+)\s*$/.exec(line);
    if (valueMatch && attacker) {
      table[level][attacker][RENAME[valueMatch[1]] ?? valueMatch[1]] = Number(valueMatch[2]);
    }
  }
  return table;
}

async function main(): Promise<void> {
  const response = await fetch(RATHENA_URL);
  if (!response.ok) throw new Error(`Failed to fetch attr_fix.yml: ${response.status}`);
  const rathena = parse(await response.text());

  const levels: ElementLevel[] = [1, 2, 3, 4];
  const found: string[] = [];
  let cells = 0;

  for (const level of levels) {
    for (const defence of ELEMENTS) {
      OFFICIAL_ELEMENT_TABLE[level][defence].forEach((official, i) => {
        const attack = OFFICIAL_COLUMNS[i];
        const theirs = rathena[level]?.[attack]?.[defence];
        cells += 1;
        if (theirs === official) return;
        const key = `Lv${level} ${attack} -> ${defence}`;
        found.push(`${key}: official ${official}, rAthena ${theirs}`);
      });
    }
  }

  console.log(`${cells} cells compared against rAthena Renewal`);
  console.log(`${found.length} differ:`);
  for (const line of found) console.log(`  ${line}`);

  const expected = KNOWN.map(
    (k) => `Lv${k.level} ${k.attack} -> ${k.defence}: official ${k.official}, rAthena ${k.rathena}`,
  );
  const unexpected = found.filter((f) => !expected.includes(f));
  const missing = expected.filter((e) => !found.includes(e));

  if (unexpected.length === 0 && missing.length === 0) {
    console.log('\nexactly the known differences -- the transcription holds');
    compareShipped(rathena);
    return;
  }

  if (unexpected.length > 0) {
    console.log('\nNOT in the known list (likely a transcription error):');
    for (const line of unexpected) console.log(`  ${line}`);
  }
  if (missing.length > 0) {
    console.log('\nexpected but no longer differing (rAthena may have changed):');
    for (const line of missing) console.log(`  ${line}`);
  }
  process.exitCode = 1;
  compareShipped(rathena);
}

// The table the site actually renders, after the generator's overrides. Every
// cell should now match rAthena: the guide agreed on 399 of them and the site
// sides with rAthena on the 400th.
function compareShipped(rathena: Record<number, Record<string, Record<string, number>>>): void {
  const differ: string[] = [];
  for (const level of [1, 2, 3, 4] as ElementLevel[]) {
    for (const attack of ELEMENTS) {
      for (const defence of ELEMENTS) {
        const ours = ELEMENT_TABLE[level][attack][defence];
        const theirs = rathena[level]?.[attack]?.[defence];
        if (ours !== theirs) differ.push(`Lv${level} ${attack} -> ${defence}: site ${ours}, rAthena ${theirs}`);
      }
    }
  }

  console.log(`\nlib/element-table.ts (what the site renders) vs rAthena: ${differ.length} differ`);
  for (const line of differ) console.log(`  ${line}`);
  if (differ.length > 0) {
    console.log('the override in generate-element-table.ts is not being applied -- regenerate');
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

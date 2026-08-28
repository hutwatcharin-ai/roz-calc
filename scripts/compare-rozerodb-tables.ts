// Cross-checks the element and size tables against rozerodb's transcription.
//
// Both tables here were read off screenshots of the official guide. rozerodb
// read the same guide independently, so its pages are a second pair of eyes on
// exactly the numbers that have no formula behind them. Its robots.txt allows
// everything but /api/, and this reads one guide page.
//
// Only element level 1 can be checked: rozerodb renders levels 2 to 4 from
// /api/, which its robots.txt disallows, so this stops at what the page serves.
// Levels 2 to 4 are covered instead by scripts/compare-element-tables.ts, which
// diffs all four levels against rAthena.
//
// Run it with:  npx tsx scripts/compare-rozerodb-tables.ts
// Needs network access. Exits non-zero unless the differences are exactly the
// known list below.

import { ELEMENT_TABLE, ELEMENTS, type Element } from '../lib/element-table';
import { SIZE_TABLE, SIZES, type MonsterSize } from '../lib/size-table';

const URL = 'https://rozerodb.com/guides/elements-sizes';

// rozerodb merges the one- and two-handed rows the guide prints separately, and
// names two weapons differently. Mapping by name rather than by position keeps
// the comparison honest about which rows were actually checked.
const SIZE_ALIASES: Record<string, string[]> = {
  'Bare Handed': ['Bare hand'],
  Dagger: ['Dagger'],
  '1H Sword': ['One-Handed Sword'],
  '2H Sword': ['Two-Handed Sword'],
  Spear: ['One-Handed Spear', 'Two-Handed Spear'],
  Axe: ['One-Handed Axe', 'Two-Handed Axe'],
  Mace: ['One-Handed Mace', 'Two-Handed Mace'],
  'Rod / Staff': ['One-Handed Staff', 'Two-Handed Staff'],
  Bow: ['Bow'],
  Katar: ['Katar'],
  Book: ['Book'],
  Knuckle: ['Fist'],
  Instrument: ['Instrument'],
  Whip: ['Whip'],
  Gun: ['Gun'],
  'Huuma Shuriken': ['Huuma Shuriken'],
  // "Spear · Peco/Gryphon" is a mounted variant this site does not carry. It is
  // listed in KNOWN_MISSING rather than mapped, so the count stays truthful.
};

const KNOWN_MISSING = ['Spear · Peco/Gryphon'];

// Differences we know about and have not resolved. Anything outside this list
// is a transcription error until proven otherwise.
const KNOWN_SIZE_DIFFERENCES: { weapon: string; size: MonsterSize; ours: number; theirs: number }[] = [
  // Our screenshot of the official guide was read as 75; rozerodb reads the
  // same guide as 50. rAthena cannot settle it: its Renewal table says 75 and
  // its pre-Renewal table says 50, and its size_fix.yml only lists overrides
  // rather than the whole matrix. Classic Ragnarok gives Whip and Book the same
  // profile, which would make 50 right, but that is an argument from
  // convention, not a reading of the page -- so the value stays as transcribed
  // and the disagreement stays visible until someone looks at the guide again.
  { weapon: 'Whip', size: 'large', ours: 75, theirs: 50 },
];

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

/** Their element chart is defender-major: one row per defender, attackers across. */
function parseElements(text: string): Record<string, number[]> {
  const names = ELEMENTS.join('|');
  const rows: Record<string, number[]> = {};
  const ROW = new RegExp(`(${names}) ((?:\\d+ % ){9}\\d+ %)`, 'g');
  for (const match of text.matchAll(ROW)) {
    rows[match[1]] = [...match[2].matchAll(/(\d+) %/g)].map((m) => Number(m[1]));
  }
  if (Object.keys(rows).length !== ELEMENTS.length) {
    throw new Error(`parsed ${Object.keys(rows).length} element rows, expected ${ELEMENTS.length}`);
  }
  return rows;
}

function parseSizes(text: string): Record<string, number[]> {
  const start = text.indexOf('Weapon Size Penalties');
  if (start === -1) throw new Error('no "Weapon Size Penalties" section -- the page layout changed');
  const section = text.slice(start, start + 2000);

  // Matching against the names we expect rather than "any word before three
  // percentages": their first row is preceded by the column headers, and two
  // names start with a digit, both of which a loose pattern gets wrong -- and
  // gets wrong silently, by producing fewer rows and comparing what is left.
  const names = [...Object.keys(SIZE_ALIASES), ...KNOWN_MISSING]
    .sort((a, b) => b.length - a.length)
    .map((n) => n); // these names contain no regex metacharacters

  const rows: Record<string, number[]> = {};
  const ROW = new RegExp(`(${names.join('|')}) ((?:\\d+ % ){2}\\d+ %)`, 'g');
  for (const match of section.matchAll(ROW)) {
    rows[match[1]] = [...match[2].matchAll(/(\d+) %/g)].map((m) => Number(m[1]));
  }
  return rows;
}

function main2(theirElements: Record<string, number[]>, theirSizes: Record<string, number[]>): void {
  const differences: string[] = [];
  let cells = 0;

  for (const defence of ELEMENTS) {
    const row = theirElements[defence];
    ELEMENTS.forEach((attack: Element, i) => {
      cells += 1;
      const ours = ELEMENT_TABLE[1][attack][defence];
      if (ours !== row[i]) differences.push(`Lv1 ${attack} -> ${defence}: ours ${ours}, rozerodb ${row[i]}`);
    });
  }
  console.log(`${cells} element cells compared at level 1 (levels 2-4 come from /api/, which robots.txt disallows)`);
  console.log(`${differences.length} differ`);
  for (const line of differences) console.log(`  ${line}`);

  const sizeDifferences: string[] = [];
  let sizeCells = 0;
  const unmatched: string[] = [];

  for (const [theirName, ourNames] of Object.entries(SIZE_ALIASES)) {
    const theirRow = theirSizes[theirName];
    if (!theirRow) {
      unmatched.push(theirName);
      continue;
    }
    for (const ourName of ourNames) {
      const ours = SIZE_TABLE.find((row) => row.weapon === ourName);
      if (!ours) throw new Error(`alias points at a weapon we do not have: ${ourName}`);
      SIZES.forEach((size, i) => {
        sizeCells += 1;
        if (ours[size] !== theirRow[i]) {
          sizeDifferences.push(`${ourName} vs ${size}: ours ${ours[size]}, rozerodb ${theirRow[i]}`);
        }
      });
    }
  }

  console.log(`\n${sizeCells} size cells compared across ${Object.keys(SIZE_ALIASES).length} of their rows`);
  console.log(`${sizeDifferences.length} differ:`);
  for (const line of sizeDifferences) console.log(`  ${line}`);
  if (unmatched.length > 0) console.log(`rows we expected but could not parse: ${unmatched.join(', ')}`);
  for (const name of KNOWN_MISSING) {
    console.log(`not carried by this site, deliberately: ${name}${theirSizes[name] ? ` (${theirSizes[name].join('/')})` : ''}`);
  }

  const expected = KNOWN_SIZE_DIFFERENCES.map(
    (k) => `${k.weapon} vs ${k.size}: ours ${k.ours}, rozerodb ${k.theirs}`,
  );
  const unexpected = sizeDifferences.filter((d) => !expected.includes(d));
  const resolved = expected.filter((e) => !sizeDifferences.includes(e));

  if (differences.length === 0 && unexpected.length === 0 && resolved.length === 0 && unmatched.length === 0) {
    console.log('\nexactly the known differences -- both transcriptions still say what they said');
    return;
  }
  if (unexpected.length > 0) {
    console.log('\nNOT in the known list (likely a transcription error):');
    for (const line of unexpected) console.log(`  ${line}`);
  }
  if (resolved.length > 0) {
    console.log('\nexpected but no longer differing (rozerodb may have corrected theirs):');
    for (const line of resolved) console.log(`  ${line}`);
  }
  process.exitCode = 1;
}

async function main(): Promise<void> {
  const response = await fetch(URL);
  if (!response.ok) throw new Error(`Failed to fetch ${URL}: ${response.status}`);
  const text = textOf(await response.text());
  main2(parseElements(text), parseSizes(text));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Checks stored Thai translations against the glossary in spec section 3.
//
// Written BEFORE the first batch is translated, deliberately. A checker written
// afterwards gets shaped by the translations it is meant to judge.
//
// Run it with:  npx tsx scripts/check-thai-glossary.ts
// Exits non-zero if any stored translation breaks a rule.

import { supabaseAdmin } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetch-all-rows';

export interface GlossaryIssue {
  rule: 'number-mismatch' | 'must-stay-english' | 'no-thai-characters';
  source: string;
  thai: string;
  detail: string;
}

// Spec section 3.2. Every one of these must survive into the Thai, because the
// game itself displays them in English -- a player matching the page against
// their inventory needs the same string in both places.
export const MUST_STAY_ENGLISH: readonly string[] = [
  // stat abbreviations
  'ATK', 'DEF', 'MATK', 'MDEF', 'STR', 'AGI', 'VIT', 'INT', 'DEX', 'LUK',
  'HIT', 'FLEE', 'CRIT', 'ASPD', 'MHP', 'MSP', 'SP', 'HP',
  // mechanics
  'Physical Damage', 'Critical Damage', 'Perfect Dodge', 'Variable Casting Time',
  'Damage Taken', 'Resistance',
  // status ailments
  'Curse', 'Silence', 'Blind', 'Stun', 'Sleep', 'Frozen', 'Poison', 'Petrify',
  // elements
  'Fire', 'Water', 'Wind', 'Earth', 'Holy', 'Shadow', 'Ghost', 'Undead', 'Neutral',
  // monster races
  'Brute', 'Demi-Human', 'Demon', 'Formless', 'Insect', 'Plant', 'Fish', 'Dragon', 'Angel',
  // equip slots
  'Armor', 'Weapon', 'Shield', 'Garment', 'Shoes', 'Accessory', 'Headgear',
  // frequently referenced NPC
  'Collector',
];

// Equip slots are the one glossary category that is also a common English word
// inside a longer LABEL NAME -- `Weapon Level : N` reads 155 times in the live
// data. Translating a label name is exactly what batch 1 does, so these terms
// are looked for only on the value side of a label, never in its name.
const EQUIP_SLOTS: ReadonlySet<string> = new Set([
  'Armor', 'Weapon', 'Shield', 'Garment', 'Shoes', 'Accessory', 'Headgear',
]);

const THAI_CHARACTER = /[฀-๿]/;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// A number carries its sign and its unit. Comparing bare digits makes three
// different manglings invisible, and each one flips what the line means:
//   HIT -10.            -> HIT +10          a penalty becomes a bonus
//   Reduces damage 5%.  -> ลดความเสียหาย 5   a percentage becomes a flat amount
//   ATK +5, DEF +3      -> ATK +3, DEF +5   the two stats swap numbers
//
// The first two are caught by keeping the sign and the `%` on the token. The
// third is not: the multiset {+3, +5} is identical either way, so the numbers
// have to be tied to something that survives translation. MUST_STAY_ENGLISH is
// exactly the list of things the Thai keeps verbatim, so a number is also
// recorded against the glossary term immediately in front of it.
//
// Both comparisons stay order-insensitive, because Thai word order legitimately
// moves a whole clause -- `DEF +3 และ ATK +5` keeps every number with its stat.
const NUMBER = /([+-]?)\s*(\d+)\s*(%?)/g;

function anchorBefore(text: string, index: number): string {
  const before = text.slice(0, index).replace(/\s+$/, '');
  let best = '';
  for (const term of MUST_STAY_ENGLISH) {
    if (term.length <= best.length || !before.endsWith(term)) continue;
    const boundary = before[before.length - term.length - 1];
    // "MHP" must not be read as the term "HP" with an M glued to the front.
    if (boundary !== undefined && /[A-Za-z]/.test(boundary)) continue;
    best = term;
  }
  return best;
}

/** Every number in `text` as `sign + digits + unit`, sorted. */
export function numberTokens(text: string): string[] {
  const tokens: string[] = [];
  for (const m of text.matchAll(NUMBER)) {
    const [, sign, digits, percent] = m;
    tokens.push(`${sign}${digits}${percent}`);
  }
  return tokens.sort();
}

/** The same tokens, grouped by the glossary term standing in front of them. */
function anchoredNumbers(text: string): Map<string, string[]> {
  const byTerm = new Map<string, string[]>();
  for (const m of text.matchAll(NUMBER)) {
    const anchor = anchorBefore(text, m.index ?? 0);
    if (anchor === '') continue;
    const [, sign, digits, percent] = m;
    const list = byTerm.get(anchor) ?? [];
    list.push(`${sign}${digits}${percent}`);
    byTerm.set(anchor, list);
  }
  for (const list of byTerm.values()) list.sort();
  return byTerm;
}

// Whole-word only: "Fired" contains "Fire" but is not the element, and flagging
// it would train the reader to ignore this checker.
function containsTerm(text: string, term: string): boolean {
  return new RegExp(`(^|[^A-Za-z])${escapeRegExp(term)}([^A-Za-z]|$)`).test(text);
}

// An equip slot is a VALUE ("Equipped on : Armor", "Type : Weapon"), and it is
// only the equip slot when it stands on its own. `Weapon Level` is a label
// NAME that happens to start with the word, and batch 1 translates label names
// on purpose -- so a whole-word match flags all 155 `Weapon Level : N` lines
// and the term row behind them. Standing alone means not glued to another
// English word by a single space or hyphen.
function containsStandaloneTerm(text: string, term: string): boolean {
  const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(term)}([^A-Za-z]|$)`, 'g');
  for (const match of text.matchAll(pattern)) {
    const start = (match.index ?? 0) + match[1].length;
    const end = start + term.length;
    if (/[A-Za-z][ -]$/.test(text.slice(0, start))) continue;
    if (/^[ -][A-Za-z]/.test(text.slice(end))) continue;
    return true;
  }
  return false;
}

export function checkTranslation(source: string, thai: string): GlossaryIssue[] {
  const issues: GlossaryIssue[] = [];

  const srcNums = numberTokens(source);
  const thaiNums = numberTokens(thai);
  if (srcNums.join(',') !== thaiNums.join(',')) {
    issues.push({
      rule: 'number-mismatch',
      source,
      thai,
      detail: `source has [${srcNums.join(', ')}], translation has [${thaiNums.join(', ')}]`,
    });
  } else {
    // Only when the quantities themselves agree, so a line is never reported
    // twice for the same defect. A term is compared only where it anchors a
    // number on BOTH sides: `FLEE Rate +5.` renders as `อัตรา FLEE +5`, which
    // puts FLEE next to the number where the English had "Rate" there, and
    // that is a legitimate rendering, not a moved quantity.
    const srcAnchored = anchoredNumbers(source);
    const thaiAnchored = anchoredNumbers(thai);
    for (const [term, srcList] of srcAnchored) {
      const thaiList = thaiAnchored.get(term);
      if (!thaiList || thaiList.length === 0) continue;
      if (srcList.join(',') === thaiList.join(',')) continue;
      issues.push({
        rule: 'number-mismatch',
        source,
        thai,
        detail:
          `${term} has [${srcList.join(', ')}] in the source ` +
          `but [${thaiList.join(', ')}] in the translation`,
      });
    }
  }

  for (const term of MUST_STAY_ENGLISH) {
    const present = EQUIP_SLOTS.has(term) ? containsStandaloneTerm : containsTerm;
    if (present(source, term) && !present(thai, term)) {
      issues.push({ rule: 'must-stay-english', source, thai, detail: `missing term: ${term}` });
    }
  }

  if (!THAI_CHARACTER.test(thai)) {
    issues.push({
      rule: 'no-thai-characters',
      source,
      thai,
      detail: 'translation contains no Thai characters',
    });
  }

  return issues;
}

// Both tables, not just one. The whole-line table is empty until batch 2, so a
// checker that reads only that one reports "0 issues" over 0 rows and looks
// like a passing gate -- while the 18 term translations batch 1 actually
// shipped go unchecked.
async function main(): Promise<void> {
  const db = supabaseAdmin();
  let issueCount = 0;
  let checked = 0;

  const report = (id: string, issues: GlossaryIssue[]) => {
    for (const issue of issues) {
      issueCount += 1;
      console.log(`${id}  [${issue.rule}] ${issue.detail}`);
      console.log(`    en: ${issue.source}`);
      console.log(`    th: ${issue.thai}`);
    }
  };

  const { data: lines, error: linesError } = await fetchAllRows<{
    source_line: string;
    thai_line: string;
  }>((from, to) =>
    db.from('item_description_lines').select('source_line, thai_line').order('source_line').range(from, to),
  );
  if (linesError) throw new Error(`Failed to read item_description_lines: ${linesError.message}`);

  for (const row of lines ?? []) {
    checked += 1;
    report(`line "${row.source_line}"`, checkTranslation(row.source_line, row.thai_line));
  }

  const { data: terms, error: termsError } = await fetchAllRows<{
    source_term: string;
    thai_term: string | null;
  }>((from, to) =>
    db.from('item_description_terms').select('source_term, thai_term').order('source_term').range(from, to),
  );
  if (termsError) throw new Error(`Failed to read item_description_terms: ${termsError.message}`);

  let deliberatelyEnglish = 0;
  for (const row of terms ?? []) {
    // A NULL translation is a decision, not a translation: the glossary says
    // the term stays English. Running the rules over it would flag every one
    // of them for having no Thai characters.
    if (row.thai_term === null) {
      deliberatelyEnglish += 1;
      continue;
    }
    checked += 1;
    report(`term "${row.source_term}"`, checkTranslation(row.source_term, row.thai_term));
  }

  console.log(
    `checked ${checked} translations ` +
      `(${(lines ?? []).length} lines, ${(terms ?? []).length - deliberatelyEnglish} terms; ` +
      `${deliberatelyEnglish} terms deliberately left in English)`,
  );
  console.log(issueCount === 0 ? 'no glossary issues' : `${issueCount} glossary issues`);

  if (issueCount > 0) process.exitCode = 1;
}

// Only when run as a script. The test file imports this module, and a bare
// `main()` call would fire a database read inside the test run.
const entry = (process.argv[1] ?? '').split('\\').join('/');
if (/\/check-thai-glossary\.ts$/.test(entry)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

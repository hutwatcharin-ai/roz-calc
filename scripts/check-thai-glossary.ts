// Checks stored Thai translations against the glossary in spec section 3.
//
// Written BEFORE the first batch is translated, deliberately. A checker written
// afterwards gets shaped by the translations it is meant to judge.

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

const THAI_CHARACTER = /[฀-๿]/;

// Digits only, sign and percent excluded: the point is that the quantities
// match, and Thai word order legitimately moves a sign or a unit around.
function numbersIn(text: string): string[] {
  return (text.match(/\d+/g) ?? []).sort();
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Whole-word only: "Fired" contains "Fire" but is not the element, and flagging
// it would train the reader to ignore this checker.
function containsTerm(text: string, term: string): boolean {
  return new RegExp(`(^|[^A-Za-z])${escapeRegExp(term)}([^A-Za-z]|$)`).test(text);
}

export function checkTranslation(source: string, thai: string): GlossaryIssue[] {
  const issues: GlossaryIssue[] = [];

  const srcNums = numbersIn(source);
  const thaiNums = numbersIn(thai);
  if (srcNums.join(',') !== thaiNums.join(',')) {
    issues.push({
      rule: 'number-mismatch',
      source,
      thai,
      detail: `source has [${srcNums.join(', ')}], translation has [${thaiNums.join(', ')}]`,
    });
  }

  for (const term of MUST_STAY_ENGLISH) {
    if (containsTerm(source, term) && !containsTerm(thai, term)) {
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

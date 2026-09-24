import { describe, it, expect } from 'vitest';
import starGear from '@/data/star-gear.json';
import thai from '@/data/star-effects-th.json';

// A translation is the easiest place on this site to lose a number. The Thai
// for a ★ piece is written by hand, from the English row our items table
// holds, and a slip of one digit reads perfectly and is wrong -- nothing else
// in the codebase would catch it.
//
// So this test compares the two mechanically: every English row must have a
// Thai row, every number in the English must appear in the Thai, and every
// stat name must survive too. It cannot tell whether the Thai reads well. It
// can tell that "MaxHP will be +450" did not quietly become +400.

type Tier = { kind: string; refine: number; text: string };
type Piece = { id: number; name: string; lang: string; base: string; tiers: Tier[] };

const ENGLISH = (starGear.items as Piece[]).filter((p) => p.lang === 'en');
const TH = thai.items as Record<string, Record<string, string>>;

/** The key a tier is stored under: at7, every2, and so on. */
function tierKey(tier: Tier): string {
  return `${tier.kind}${tier.refine}`;
}

/** Stat names that must survive translation. Longest first so MaxHP is taken
 *  before HP and a row that only says MaxHP is not credited with an HP. */
const STATS = [
  'MaxHP', 'MaxSP', 'MATK', 'MDEF', 'ASPD', 'CRIT', 'ATK', 'DEF', 'FLEE', 'HIT',
  'CRI', 'MHP', 'STR', 'INT', 'LUK', 'VIT', 'DEX', 'AGI', 'SP', 'HP',
];

function statsIn(text: string): string[] {
  let rest = text;
  const found: string[] = [];
  for (const stat of STATS) {
    const pattern = new RegExp(stat, 'g');
    if (pattern.test(rest)) {
      found.push(stat);
      rest = rest.replace(pattern, ' ');
    }
  }
  return found;
}

function numbersIn(text: string): string[] {
  return (text.match(/\d+/g) ?? []).filter((n) => n.length > 0);
}

describe('Thai for the ★ pieces the client has no Thai for', () => {
  it('has a row for every English piece', () => {
    const missing = ENGLISH.filter((p) => !TH[String(p.id)]).map((p) => p.name);
    expect(missing).toEqual([]);
  });

  it('covers every part of every piece', () => {
    const gaps: string[] = [];
    for (const piece of ENGLISH) {
      const row = TH[String(piece.id)] ?? {};
      if (!row.base) gaps.push(`${piece.name} base`);
      for (const tier of piece.tiers) {
        if (!row[tierKey(tier)]) gaps.push(`${piece.name} ${tierKey(tier)}`);
      }
    }
    expect(gaps).toEqual([]);
  });

  it('keeps every number', () => {
    const lost: string[] = [];
    for (const piece of ENGLISH) {
      const row = TH[String(piece.id)] ?? {};
      const parts: [string, string][] = [['base', piece.base], ...piece.tiers.map((t) => [tierKey(t), t.text] as [string, string])];
      for (const [key, english] of parts) {
        const th = row[key] ?? '';
        for (const number of numbersIn(english)) {
          if (!th.includes(number)) lost.push(`${piece.name} ${key}: ${number} หายไป`);
        }
      }
    }
    expect(lost).toEqual([]);
  });

  it('keeps every stat name', () => {
    const lost: string[] = [];
    for (const piece of ENGLISH) {
      const row = TH[String(piece.id)] ?? {};
      const parts: [string, string][] = [['base', piece.base], ...piece.tiers.map((t) => [tierKey(t), t.text] as [string, string])];
      for (const [key, english] of parts) {
        const th = row[key] ?? '';
        for (const stat of statsIn(english)) {
          if (!th.includes(stat)) lost.push(`${piece.name} ${key}: ${stat} หายไป`);
        }
      }
    }
    expect(lost).toEqual([]);
  });

  it('adds no number the English never had', () => {
    const extra: string[] = [];
    for (const piece of ENGLISH) {
      const row = TH[String(piece.id)] ?? {};
      const parts: [string, string][] = [['base', piece.base], ...piece.tiers.map((t) => [tierKey(t), t.text] as [string, string])];
      for (const [key, english] of parts) {
        const seen = new Set(numbersIn(english));
        for (const number of numbersIn(row[key] ?? '')) {
          if (!seen.has(number)) extra.push(`${piece.name} ${key}: ${number} ไม่มีในต้นฉบับ`);
        }
      }
    }
    expect(extra).toEqual([]);
  });
});

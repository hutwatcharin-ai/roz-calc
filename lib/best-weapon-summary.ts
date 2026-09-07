// The two lines the monster page says about what to hit a monster with.
//
// The old panel listed every element and every weapon type and explained
// that the two multipliers multiply. Players asked what the words meant
// (7 Sep 2026). What they want is the answer: which element, which weapons
// lose damage -- and nothing at all when nothing is interesting (a Neutral 3
// monster takes the same from nine elements; listing nine names says less
// than "any").

import type { Element, ElementLevel } from '@/lib/element-table';
import { rankElements } from '@/lib/damage-multiplier';
import { SIZE_TABLE, type MonsterSize } from '@/lib/size-table';

export interface ElementAdvice {
  /** Elements tied for best, in table order. Empty when every element is 100. */
  best: Element[];
  bestPct: number;
  /** Elements that deal less than a full hit, worst first. */
  avoid: { element: Element; pct: number }[];
}

export function elementAdvice(defence: Element, defenceLevel: ElementLevel): ElementAdvice {
  const ranked = rankElements(defence, defenceLevel);
  const top = ranked[0]?.element ?? 100;
  const best = top > 100 ? ranked.filter((r) => r.element === top).map((r) => r.attack) : [];
  const avoid = ranked
    .filter((r) => r.element < 100)
    .sort((a, b) => a.element - b.element)
    .map((r) => ({ element: r.attack, pct: r.element }));
  return { best, bestPct: top, avoid };
}

export interface SizeGroup {
  pct: number;
  /** Thai weapon names, one-handed/two-handed pairs folded ("ขวาน" for both axes). */
  labels: string[];
}

// "ขวานมือเดียว" + "ขวานสองมือ" with the same multiplier read as one word.
function foldHands(labels: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const label of labels) {
    const stem = label.replace(/(มือเดียว|สองมือ)$/, '');
    const pair = stem !== label && labels.includes(`${stem}มือเดียว`) && labels.includes(`${stem}สองมือ`);
    const name = pair ? stem : label;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(name);
  }
  return out;
}

/** Weapon types grouped by their size multiplier against this size, best first. */
export function sizeGroups(size: MonsterSize): SizeGroup[] {
  const byPct = new Map<number, string[]>();
  for (const row of SIZE_TABLE) {
    const pct = row[size];
    byPct.set(pct, [...(byPct.get(pct) ?? []), row.label]);
  }
  return [...byPct.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([pct, labels]) => ({ pct, labels: foldHands(labels) }));
}

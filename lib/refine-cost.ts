// What getting to +N actually costs.
//
// The guide publishes the per-attempt chance and stops there, which is the
// number that misleads people: "+7 is 40%" reads as "two tries and I am there",
// when the real question is how many whole items burn on the way. With the
// plain ore a failure destroys the equipment, so every attempt run starts again
// from +0, and the cost compounds.
//
// One run = one item, taken from the starting refine as far as it gets.
//   S     = chance one run reaches the target = product of each step's chance
//   items = 1 / S, because runs are independent and identical
//   ore   = attempts, which is items x the attempts an average run makes
//
// Runs are geometric, so the expected values above are exact, not simulated.
// The median is reported alongside because the mean of a geometric variable is
// dragged up by a long tail: it is normal to need fewer items than "expected".

import { ORE, chanceAt, type GearType } from './refine-table';

export type RefineStep = {
  /** The refine this step reaches: 7 means the +6 -> +7 attempt. */
  level: number;
  /** Chance this single attempt succeeds, as a percentage. */
  chance: number;
  /** Chance one run gets this far at all, as a percentage. */
  reach: number;
};

export type RefineCost = {
  steps: RefineStep[];
  /** Chance a single item makes it all the way, as a percentage. */
  runChance: number;
  /** Expected equipment consumed, counting the one you keep. */
  expectedItems: number;
  /**
   * Expected attempts. NOT the same as ore pieces: how many pieces one attempt
   * eats is not published anywhere we can read, and assuming one because other
   * Ragnarok versions do it is the exact reasoning that makes rAthena's Renewal
   * numbers wrong for Zero. Callers must present this as attempts.
   */
  expectedAttempts: number;
  /**
   * Expected refine fees in Zeny. This one is solid: the guide's fee column is
   * per attempt, and an attempt is an attempt whether it succeeds or not.
   */
  expectedFeeZeny: number;
  /**
   * Ore cost in Zeny PER PIECE PER ATTEMPT -- multiply by however many pieces
   * an attempt turns out to eat. Null where the guide publishes no price.
   */
  expectedOreZenyPerPiece: number | null;
  /** Items that give a 50% chance of at least one success. */
  itemsFor50: number;
  /** Items that give a 90% chance of at least one success. */
  itemsFor90: number;
};

/** Items needed for the given confidence of at least one success. */
export function itemsForConfidence(runChancePercent: number, confidence: number): number {
  const p = runChancePercent / 100;
  if (p >= 1) return 1;
  if (p <= 0) return Infinity;
  return Math.ceil(Math.log(1 - confidence) / Math.log(1 - p));
}

export function refineCost(
  gear: GearType,
  target: number,
  special: boolean,
  from = 0,
): RefineCost {
  if (!Number.isInteger(target) || target <= from) {
    throw new Error(`target +${target} is not above the starting +${from}`);
  }

  const steps: RefineStep[] = [];
  let reach = 1; // chance a run is still alive going into this step
  let attemptsPerRun = 0; // expected attempts one run makes

  for (let level = from + 1; level <= target; level += 1) {
    const chance = chanceAt(gear, level, special);
    // An attempt only happens if the run survived every earlier step.
    attemptsPerRun += reach;
    steps.push({ level, chance, reach: reach * 100 });
    reach *= chance / 100;
  }

  const runChance = reach;
  const expectedItems = 1 / runChance;
  const expectedAttempts = expectedItems * attemptsPerRun;

  const spec = (special ? ORE[gear].special : null) ?? ORE[gear].normal;

  return {
    steps,
    runChance: runChance * 100,
    expectedItems,
    expectedAttempts,
    expectedFeeZeny: expectedAttempts * spec.feeZeny,
    expectedOreZenyPerPiece: spec.oreZeny === null ? null : expectedAttempts * spec.oreZeny,
    itemsFor50: itemsForConfidence(runChance * 100, 0.5),
    itemsFor90: itemsForConfidence(runChance * 100, 0.9),
  };
}

/** The ore and fee a run of this kind uses, falling back to the plain ore where there is no special one. */
export function oreFor(gear: GearType, special: boolean) {
  return (special ? ORE[gear].special : null) ?? ORE[gear].normal;
}

// ---------------------------------------------------------------------------
// Plans that mix ores, HD among them (owner, 8 Oct 2026).
//
// HD ore only works on equipment already at +7 to +9, and a failure there
// drops the refine by one instead of destroying the item. That makes runs no
// longer independent, so 1 / S does not apply: a run can wander +7 -> +8 ->
// +7 -> +6. The expected numbers are then the solution of a small linear
// system, one equation per refine level:
//
//   x[L] = c[L] + p * x[L+1] + (1 - p) * x[fall(L)]
//
// where fall(L) is +0 on a fresh item when the ore breaks it, or L-1 with HD.
// Solved exactly by Gaussian elimination (at most 20 unknowns).
//
// HD's own success chance is not in the guide; the plain ore's column is used
// (what other Ragnarok versions do), and the page says so.

export type OreMode = 'normal' | 'special' | 'hd';
export const HD_FROM = 7;
export const HD_TO = 9;
export const HD_FEE_ZENY = 20_000;

export interface RefinePlan {
  /** Expected items consumed, counting the one you keep. */
  expectedItems: number;
  expectedAttempts: number;
  /** Expected attempts made with HD ore. */
  expectedHdAttempts: number;
  expectedFeeZeny: number;
}

/**
 * The ore an attempt from +level uses under a mode. The HD plan is what a
 * player does: Concentrated ore below +7 and above +9, HD from +7 to +9 (the
 * guide lists HD only for the equipment that also has Concentrated ore).
 */
export function oreAt(mode: OreMode, level: number): 'normal' | 'special' | 'hd' {
  if (mode === 'hd') return level >= HD_FROM && level <= HD_TO ? 'hd' : 'special';
  return mode;
}

function solve(a: number[][], b: number[]): number[] {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let r = col + 1; r < n; r += 1) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let r = 0; r < n; r += 1) {
      if (r === col || m[r][col] === 0) continue;
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= n; c += 1) m[r][c] -= f * m[col][c];
    }
  }
  return m.map((row, i) => row[n] / row[i]);
}

export function refinePlan(gear: GearType, target: number, mode: OreMode, from = 0): RefinePlan {
  if (!Number.isInteger(target) || target <= from) throw new Error(`target +${target} is not above the starting +${from}`);
  const special = ORE[gear].special !== null;
  const n = target; // unknowns: levels 0 .. target-1
  // Three quantities share one matrix: attempts, items broken, fees.
  const a = Array.from({ length: n }, () => new Array<number>(n).fill(0));
  const attempts = new Array<number>(n).fill(0);
  const breaks = new Array<number>(n).fill(0);
  const fees = new Array<number>(n).fill(0);
  const hd = new Array<number>(n).fill(0);
  for (let L = 0; L < n; L += 1) {
    const ore = oreAt(mode, L);
    const p = chanceAt(gear, L + 1, ore === 'special' && special) / 100;
    a[L][L] += 1;
    if (L + 1 < n) a[L][L + 1] -= p;
    const fall = ore === 'hd' ? L - 1 : 0;
    a[L][fall] -= 1 - p;
    attempts[L] = 1;
    hd[L] = ore === 'hd' ? 1 : 0;
    breaks[L] = ore === 'hd' ? 0 : 1 - p;
    const spec = ore === 'special' && special ? ORE[gear].special! : ORE[gear].normal;
    fees[L] = ore === 'hd' ? HD_FEE_ZENY : spec.feeZeny;
  }
  const at = (v: number[]) => solve(a, v)[from];
  return {
    expectedItems: 1 + at(breaks),
    expectedAttempts: at(attempts),
    expectedHdAttempts: at(hd),
    expectedFeeZeny: at(fees),
  };
}

/** Chance of reaching the target with at most `items` pieces, for the break-only modes. */
export function chanceWithItems(runChancePercent: number, items: number): number {
  const p = runChancePercent / 100;
  return (1 - Math.pow(1 - p, items)) * 100;
}

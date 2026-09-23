// The maths behind /tools/enchant.
//
// No game data lives here. The rates come from data/memorial-gear.json, which
// the official guide supplied and lib/memorial-gear.ts already reads; this file
// only turns "6.03% per try" into the numbers a player plans with: how many
// tries, how much Zeny, and what the odds look like after N of them.
//
// One try = one enchant. Rerolling an enchant that is already on the piece
// costs a removal first, which is a separate price and a separate risk, so the
// caller is told about it rather than having it silently folded in.

export interface EnchantPlan {
  /** Chance of the wanted roll on a single try, as a percentage. */
  chancePct: number;
  /** Average tries to see it once. Infinite when the chance is zero. */
  expectedTries: number;
  /** Average Zeny for those tries. */
  expectedZeny: number;
  /** Chance of seeing it at least once within the tries asked for, percent. */
  withinPct: number;
  /** Tries needed before the odds pass half, and nine in ten. */
  triesFor50: number;
  triesFor90: number;
}

export function chanceWithin(chancePct: number, tries: number): number {
  if (chancePct <= 0 || tries <= 0) return 0;
  const p = Math.min(chancePct, 100) / 100;
  return (1 - (1 - p) ** tries) * 100;
}

/** Tries before the odds of at least one success reach `targetPct`. */
export function triesFor(chancePct: number, targetPct: number): number {
  if (chancePct <= 0) return Number.POSITIVE_INFINITY;
  const p = Math.min(chancePct, 100) / 100;
  if (p >= 1) return 1;
  return Math.ceil(Math.log(1 - targetPct / 100) / Math.log(1 - p));
}

export function planFor(chancePct: number, tries: number, zenyPerTry: number): EnchantPlan {
  const p = chancePct / 100;
  const expectedTries = p > 0 ? 1 / p : Number.POSITIVE_INFINITY;
  return {
    chancePct,
    expectedTries,
    expectedZeny: expectedTries * zenyPerTry,
    withinPct: chanceWithin(chancePct, tries),
    triesFor50: triesFor(chancePct, 50),
    triesFor90: triesFor(chancePct, 90),
  };
}

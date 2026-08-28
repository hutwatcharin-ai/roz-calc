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
  /** Expected ore consumed, one per attempt. */
  expectedOre: number;
  /** Expected refine fees in Zeny. Ore is priced separately, and only when the guide gives a price. */
  expectedFeeZeny: number;
  /** Expected ore cost in Zeny, or null where the guide publishes no price. */
  expectedOreZeny: number | null;
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
  const expectedOre = expectedItems * attemptsPerRun;

  const spec = (special ? ORE[gear].special : null) ?? ORE[gear].normal;

  return {
    steps,
    runChance: runChance * 100,
    expectedItems,
    expectedOre,
    expectedFeeZeny: expectedOre * spec.feeZeny,
    expectedOreZeny: spec.oreZeny === null ? null : expectedOre * spec.oreZeny,
    itemsFor50: itemsForConfidence(runChance * 100, 0.5),
    itemsFor90: itemsForConfidence(runChance * 100, 0.9),
  };
}

/** The ore and fee a run of this kind uses, falling back to the plain ore where there is no special one. */
export function oreFor(gear: GearType, special: boolean) {
  return (special ? ORE[gear].special : null) ?? ORE[gear].normal;
}

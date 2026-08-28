import { describe, it, expect } from 'vitest';
import { itemsForConfidence, refineCost } from './refine-cost';
import { chanceAt, type GearType } from './refine-table';

// A tiny deterministic generator so the simulation below is reproducible. The
// simulation exists to check the closed-form maths against something that makes
// no assumptions at all: it just refines until it runs out of items.
function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function simulate(gear: GearType, target: number, special: boolean, runs: number, seed: number) {
  const rand = lcg(seed);
  let items = 0;
  let ore = 0;

  for (let run = 0; run < runs; run += 1) {
    for (;;) {
      items += 1; // a fresh piece of equipment
      let level = 0;
      let alive = true;
      while (alive && level < target) {
        ore += 1;
        if (rand() * 100 < chanceAt(gear, level + 1, special)) level += 1;
        else alive = false;
      }
      if (level === target) break; // this run got there; move to the next run
    }
  }

  return { items: items / runs, ore: ore / runs };
}

describe('refineCost', () => {
  it('costs a single 90% step as one and a bit items', () => {
    const cost = refineCost('weapon1', 1, false);
    expect(cost.runChance).toBeCloseTo(90, 6);
    expect(cost.expectedItems).toBeCloseTo(1 / 0.9, 6);
    expect(cost.expectedOre).toBeCloseTo(1 / 0.9, 6);
  });

  it('compounds two steps rather than averaging them', () => {
    // 90% then 90% is 81% for the pair, and the second attempt only happens on
    // the runs that survived the first -- so ore is not simply 2 x items.
    const cost = refineCost('weapon1', 2, false);
    expect(cost.runChance).toBeCloseTo(81, 6);
    expect(cost.expectedItems).toBeCloseTo(1 / 0.81, 6);
    expect(cost.expectedOre).toBeCloseTo((1 / 0.81) * 1.9, 6);
  });

  it('spends no spare items when every step is certain', () => {
    // Armour +1 to +3 with the concentrated ore is 100% three times over.
    const cost = refineCost('armour', 3, true);
    expect(cost.runChance).toBe(100);
    expect(cost.expectedItems).toBe(1);
    expect(cost.expectedOre).toBe(3);
    expect(cost.itemsFor50).toBe(1);
    expect(cost.itemsFor90).toBe(1);
  });

  it('agrees with a simulation that just refines until it gets there', () => {
    // The independent check on the closed form. Geometric tails are heavy, so
    // the tolerance is loose on purpose; a wrong model misses by far more.
    const cases: [GearType, number, boolean][] = [
      ['weapon1', 4, false],
      ['weapon3', 7, false],
      ['armour', 7, true],
      ['weapon4', 5, false],
    ];

    for (const [gear, target, special] of cases) {
      const exact = refineCost(gear, target, special);
      const sim = simulate(gear, target, special, 20_000, 12345);
      const label = `${gear} +${target}${special ? ' special' : ''}`;
      expect(sim.items / exact.expectedItems, `${label} items`).toBeGreaterThan(0.9);
      expect(sim.items / exact.expectedItems, `${label} items`).toBeLessThan(1.1);
      expect(sim.ore / exact.expectedOre, `${label} ore`).toBeGreaterThan(0.9);
      expect(sim.ore / exact.expectedOre, `${label} ore`).toBeLessThan(1.1);
    }
  });

  it('reports the step ladder, not just the total', () => {
    const cost = refineCost('weapon1', 3, false);
    expect(cost.steps.map((s) => s.level)).toEqual([1, 2, 3]);
    expect(cost.steps[0].reach).toBe(100); // every run attempts +1
    expect(cost.steps[1].reach).toBeCloseTo(90, 6);
    expect(cost.steps[2].reach).toBeCloseTo(81, 6);
  });

  it('charges the fee on every attempt, including the failed ones', () => {
    const cost = refineCost('weapon1', 2, false);
    expect(cost.expectedFeeZeny).toBeCloseTo(cost.expectedOre * 1000, 6);
    expect(cost.expectedOreZeny).toBeCloseTo(cost.expectedOre * 200, 6);
  });

  it('leaves the ore bill unpriced where the guide publishes no price', () => {
    // Oridecon has no NPC price on the guide's table. Multiplying by a made-up
    // market price would make the total look researched when it is not.
    expect(refineCost('weapon3', 7, false).expectedOreZeny).toBeNull();
    expect(refineCost('weapon3', 7, false).expectedFeeZeny).toBeGreaterThan(0);
  });

  it('can start from a refine already on the item', () => {
    const fromScratch = refineCost('weapon1', 8, false);
    const fromSeven = refineCost('weapon1', 8, false, 7);
    expect(fromSeven.steps).toHaveLength(1);
    expect(fromSeven.expectedItems).toBeLessThan(fromScratch.expectedItems);
  });

  it('refuses a target that is not above where the item already is', () => {
    expect(() => refineCost('weapon1', 5, false, 5)).toThrow();
    expect(() => refineCost('weapon1', 3, false, 7)).toThrow();
  });
});

describe('itemsForConfidence', () => {
  it('needs one item when the run cannot fail', () => {
    expect(itemsForConfidence(100, 0.9)).toBe(1);
  });

  it('needs more items for more confidence', () => {
    expect(itemsForConfidence(20, 0.9)).toBeGreaterThan(itemsForConfidence(20, 0.5));
  });

  it('rounds up, because half an item buys nothing', () => {
    // 81% per run: one item already clears 50%, two are needed for 90%.
    expect(itemsForConfidence(81, 0.5)).toBe(1);
    expect(itemsForConfidence(81, 0.9)).toBe(2);
  });
});

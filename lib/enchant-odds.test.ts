import { describe, it, expect } from 'vitest';
import { chanceWithin, planFor, triesFor } from './enchant-odds';
import { memorialGear } from './memorial-gear';

describe('chanceWithin', () => {
  it('is the single-try chance after one try', () => {
    expect(chanceWithin(6.03, 1)).toBeCloseTo(6.03, 6);
  });

  it('grows with tries but never reaches certainty', () => {
    const ten = chanceWithin(6.03, 10);
    const hundred = chanceWithin(6.03, 100);
    expect(ten).toBeGreaterThan(6.03);
    expect(hundred).toBeGreaterThan(ten);
    expect(hundred).toBeLessThan(100);
  });

  it('is zero for an outcome the slot cannot roll', () => {
    expect(chanceWithin(0, 500)).toBe(0);
  });
});

describe('triesFor', () => {
  it('matches the chance it is derived from', () => {
    const n = triesFor(6.03, 90);
    expect(chanceWithin(6.03, n)).toBeGreaterThanOrEqual(90);
    expect(chanceWithin(6.03, n - 1)).toBeLessThan(90);
  });

  it('is one try when the roll always succeeds', () => {
    expect(triesFor(100, 90)).toBe(1);
  });
});

describe('planFor', () => {
  it('spends one try of Zeny per expected try', () => {
    const plan = planFor(25, 4, 100_000);
    expect(plan.expectedTries).toBeCloseTo(4, 6);
    expect(plan.expectedZeny).toBeCloseTo(400_000, 6);
  });

  it('reports no finite cost for an impossible roll', () => {
    const plan = planFor(0, 10, 100_000);
    expect(plan.expectedTries).toBe(Number.POSITIVE_INFINITY);
    expect(plan.withinPct).toBe(0);
  });
});

describe('the rates the tool reads', () => {
  // The tool is only as honest as the table under it. If a column stops adding
  // up, the guide's numbers were misread or the game changed, and the page
  // should not keep quoting odds off them.
  const { outcomes } = memorialGear.enchantRules;

  it.each(['armor', 'garment', 'shoes'] as const)('%s rates add up to 100%%', (slot) => {
    const total = outcomes.reduce((sum, row) => sum + (row[slot] ?? 0), 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('never states a rate of exactly zero, which would mean something else', () => {
    for (const row of outcomes) {
      for (const slot of ['armor', 'garment', 'shoes'] as const) {
        expect(row[slot]).not.toBe(0);
      }
    }
  });
});

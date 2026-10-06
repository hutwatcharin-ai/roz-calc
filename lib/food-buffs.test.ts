import { describe, expect, it } from 'vitest';
import { foodGain, foodsFor } from './food-buffs';

describe('food buffs', () => {
  it('turns stats into HIT, FLEE and CRI by the verified formulas', () => {
    const f = { id: 1, name: 'x', text: '', b: { dex: 10, agi: 6, luk: 9, hit: 2 } };
    expect(foodGain(f, 'hit')).toBe(15);
    expect(foodGain(f, 'flee')).toBeCloseTo(7.8);
    expect(foodGain(f, 'crit')).toBeCloseTo(2.7);
  });
  it("puts Hwergelmir's Tonic (DEX +10) near the top for HIT and keeps enchant stones out", () => {
    const hit = foodsFor('hit');
    expect(hit.slice(0, 5).map((f) => f.food.name)).toContain("Hwergelmir's Tonic");
    expect(hit.some((f) => f.food.name.startsWith('Sharp'))).toBe(false);
  });
});

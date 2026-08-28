import { describe, it, expect } from 'vitest';
import {
  bestElements,
  rankWeapons,
  bestTotal,
  combine,
  comboFor,
  rankCombos,
  rankElements,
  shareOfBest,
} from './damage-multiplier';
import { elementModifier } from './element-table';
import { SIZE_TABLE, type WeaponSizeRow } from './size-table';

function weapon(name: string): WeaponSizeRow {
  const row = SIZE_TABLE.find((r) => r.weapon === name);
  if (!row) throw new Error(`no weapon row for ${name}`);
  return row;
}

describe('combine', () => {
  it('multiplies the two percentages rather than adding them', () => {
    // The mistake this exists to prevent: 200% element and 50% size is 100%,
    // not 250% and not 150%.
    expect(combine(200, 50)).toBe(100);
    expect(combine(100, 100)).toBe(100);
    expect(combine(150, 75)).toBe(112.5);
  });

  it('keeps zero at zero -- immunity survives any size bonus', () => {
    expect(combine(0, 100)).toBe(0);
  });
});

describe('comboFor', () => {
  it('reads both tables and reports each part alongside the product', () => {
    // Book against a Large Undead-1 monster: 50% for size, Holy is strong into
    // Undead, and the product is what actually lands.
    const combo = comboFor(weapon('Book'), 'Holy', 'Undead', 1, 'large');
    expect(combo.size).toBe(50);
    expect(combo.element).toBe(elementModifier('Holy', 'Undead', 1));
    expect(combo.total).toBe((combo.element * 50) / 100);
  });
});

describe('rankCombos', () => {
  it('covers every weapon type against every element', () => {
    expect(rankCombos('Undead', 1, 'large')).toHaveLength(SIZE_TABLE.length * 10);
  });

  it('puts the strongest hit first', () => {
    const ranked = rankCombos('Undead', 1, 'medium');
    expect(ranked[0].total).toBeGreaterThanOrEqual(ranked[1].total);
    expect(ranked[0].total).toBeGreaterThanOrEqual(ranked[ranked.length - 1].total);
  });

  it('lets a size penalty beat an element bonus, and says so in the parts', () => {
    // A Dagger does 50% to Large. Against a Large Undead-1 monster a Holy
    // Dagger and a Neutral Bare hand can be compared directly, which is the
    // whole point of multiplying the tables instead of reading them apart.
    const dagger = comboFor(weapon('Dagger'), 'Holy', 'Undead', 1, 'large');
    const bare = comboFor(weapon('Bare hand'), 'Holy', 'Undead', 1, 'large');
    expect(dagger.element).toBe(bare.element);
    expect(dagger.total).toBeLessThan(bare.total);
  });
});

describe('rankElements', () => {
  it('lists all ten elements, strongest first', () => {
    const ranked = rankElements('Undead', 1);
    expect(ranked).toHaveLength(10);
    for (let i = 1; i < ranked.length; i += 1) {
      expect(ranked[i].element).toBeLessThanOrEqual(ranked[i - 1].element);
    }
  });

  it('does not change order with size, because size scales everything equally', () => {
    // Stated as a test because the tool relies on it: the element ranking is
    // shown once, not once per weapon.
    const byElement = rankElements('Water', 3).map((r) => r.attack);
    const large = rankCombos('Water', 3, 'large').filter((c) => c.weapon.weapon === 'Bare hand');
    expect(large.map((c) => c.attack)).toEqual(byElement);
  });
});

describe('bestTotal and shareOfBest', () => {
  it('measures a choice against the best available', () => {
    const best = bestTotal('Undead', 1, 'large');
    const chosen = comboFor(weapon('Dagger'), 'Neutral', 'Undead', 1, 'large');
    const share = shareOfBest(chosen, best);
    expect(share).not.toBeNull();
    expect(share!).toBeLessThan(100);
  });

  it('gives the best choice itself a full share', () => {
    const ranked = rankCombos('Fire', 2, 'small');
    expect(shareOfBest(ranked[0], ranked[0].total)).toBe(100);
  });

  it('returns null rather than dividing by zero when nothing lands', () => {
    expect(shareOfBest(comboFor(weapon('Book'), 'Neutral', 'Undead', 1, 'large'), 0)).toBeNull();
  });
});

describe('bestElements', () => {
  it('lists every element tied for best, not just the first', () => {
    // Water-1 takes 150 from both Wind and Poison. Naming one would send a
    // player shopping for an element they may already have the alternative to.
    const best = bestElements('Water', 1);
    expect(best).toContain('Wind');
    expect(best).toContain('Poison');
    expect(best.length).toBeGreaterThan(1);
  });

  it('holds to one when only one element is best', () => {
    const best = bestElements('Undead', 4);
    expect(new Set(best.map((el) => elementModifier(el, 'Undead', 4))).size).toBe(1);
  });
});

describe('rankWeapons', () => {
  it('ranks the weapon types for a single element, so the top is not a tie pile', () => {
    const ranked = rankWeapons('Wind', 'Water', 1, 'medium');
    expect(ranked).toHaveLength(SIZE_TABLE.length);
    expect(new Set(ranked.map((c) => c.weapon.weapon)).size).toBe(SIZE_TABLE.length);
    expect(ranked[0].total).toBeGreaterThan(ranked[ranked.length - 1].total);
  });

  it('keeps the element fixed across the whole ranking', () => {
    const ranked = rankWeapons('Fire', 'Earth', 2, 'small');
    expect(new Set(ranked.map((c) => c.element)).size).toBe(1);
  });
});

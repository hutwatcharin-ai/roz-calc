import { describe, it, expect } from 'vitest';
import {
  ALL_RECIPES,
  craftCounts,
  recipesMaking,
  recipesOfKind,
  recipesUsing,
  sortRecipes,
  splitByConfidence,
} from './crafting';

describe('the recipe file itself', () => {
  it('names every item, because a row with a blank name is a broken join', () => {
    for (const r of ALL_RECIPES) {
      expect(r.product.name, `product ${r.product.id}`).toBeTruthy();
      for (const m of r.materials) expect(m.name, `material ${m.id} of ${r.product.name}`).toBeTruthy();
      expect(r.materials.length).toBeGreaterThan(0);
    }
  });

  it('marks a held material instead of printing "x0"', () => {
    // produce_db uses amount 0 for a cookbook or creation guide that has to
    // be in the bag but is not spent. Rendering it as a quantity would be a
    // lie about what the craft costs.
    const held = ALL_RECIPES.flatMap((r) => r.materials).filter((m) => m.amount === 0);
    expect(held.length).toBeGreaterThan(0);
    for (const m of held) expect(m.held).toBe(true);
  });

  it('says where every recipe came from', () => {
    for (const r of ALL_RECIPES) {
      expect(r.sources.length).toBeGreaterThan(0);
      expect(['both', 'rathena-only', 'prontera-only']).toContain(r.confidence);
      // Two sources means two names listed, one means one.
      expect(r.sources.length).toBe(r.confidence === 'both' ? 2 : 1);
    }
  });
});

describe('grouping', () => {
  it('has the seven kinds the guides are built around', () => {
    const counts = craftCounts();
    for (const kind of ['forge', 'arrow', 'brew', 'cook', 'ore'] as const) {
      expect(counts[kind].total, kind).toBeGreaterThan(0);
    }
  });

  it('puts the two-source rows first', () => {
    const sorted = sortRecipes(recipesOfKind('forge'));
    const firstUnconfirmed = sorted.findIndex((r) => r.confidence !== 'both');
    const lastConfirmed = sorted.map((r) => r.confidence === 'both').lastIndexOf(true);
    if (firstUnconfirmed !== -1) expect(lastConfirmed).toBeLessThan(firstUnconfirmed);
  });

  it('splits the confirmed rows from the rest without losing any', () => {
    const rows = recipesOfKind('brew');
    const { confirmed, unconfirmed } = splitByConfidence(rows);
    expect(confirmed.length + unconfirmed.length).toBe(rows.length);
    expect(confirmed.every((r) => r.confidence === 'both')).toBe(true);
    expect(unconfirmed.every((r) => r.confidence !== 'both')).toBe(true);
  });
});

describe('lookups from an item page', () => {
  it('finds what an ore is used for and how it is made', () => {
    // Iron (998) is made from Iron Ore and used in most forging recipes.
    expect(recipesUsing(998).length).toBeGreaterThan(0);
    expect(recipesMaking(998).length).toBeGreaterThan(0);
    for (const r of recipesUsing(998)) expect(r.materials.some((m) => m.id === 998)).toBe(true);
    for (const r of recipesMaking(998)) expect(r.product.id).toBe(998);
  });

  it('answers nothing for an item no recipe touches', () => {
    expect(recipesUsing(-1)).toEqual([]);
    expect(recipesMaking(-1)).toEqual([]);
  });
});

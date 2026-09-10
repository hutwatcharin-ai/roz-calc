// The ids come out of the published recipes, so the test checks that the
// extraction still finds them -- a recipe file that changes shape would
// otherwise empty the chips silently.
import { describe, it, expect } from 'vitest';
import { CRAFT_MATERIAL_IDS, CRAFT_PRODUCT_IDS, ROLE_ORDER, ROLE_TH, isItemRole } from '@/lib/item-roles';

describe('crafting ids', () => {
  it('finds the materials and products the recipe file lists', () => {
    // Tree Root is the material of the first arrow recipe; Arrow is what it
    // makes.
    expect(CRAFT_MATERIAL_IDS).toContain(902);
    expect(CRAFT_PRODUCT_IDS).toContain(1750);
  });

  it('has enough of both to be worth a chip', () => {
    expect(CRAFT_MATERIAL_IDS.length).toBeGreaterThan(300);
    expect(CRAFT_PRODUCT_IDS.length).toBeGreaterThan(200);
  });

  it('holds ids only once and in order', () => {
    expect(new Set(CRAFT_MATERIAL_IDS).size).toBe(CRAFT_MATERIAL_IDS.length);
    expect([...CRAFT_MATERIAL_IDS].sort((a, b) => a - b)).toEqual(CRAFT_MATERIAL_IDS);
  });
});

describe('roles', () => {
  it('gives every role a Thai label and a reason', () => {
    for (const role of ROLE_ORDER) {
      expect(ROLE_TH[role].title.length).toBeGreaterThan(0);
      expect(ROLE_TH[role].asks.length).toBeGreaterThan(0);
    }
    expect(Object.keys(ROLE_TH).sort()).toEqual([...ROLE_ORDER].sort());
  });

  it('only accepts a role it knows', () => {
    expect(isItemRole('heal')).toBe(true);
    expect(isItemRole('box')).toBe(false);
    expect(isItemRole(undefined)).toBe(false);
  });
});

// A reader asked where Trunk is crafted. The site said "Rotten Bandage x10 +
// Single Cell x10", which is a Genetic recipe -- a third job this game does
// not have. These tests pin the removal to the specific recipes and to the
// reason, so a future rebuild of the recipe file cannot quietly bring them
// back.
import { describe, it, expect } from 'vitest';
import { ALL_RECIPES, RECIPES_HIDDEN_UNAVAILABLE, recipesMaking } from '@/lib/crafting';
import file from '@/data/crafting-recipes.json';

const raw = (file as unknown as { recipes: { skillId: number | null; product: { id: number } }[] }).recipes;

describe('recipes for skills this game does not have', () => {
  it('drops the Trunk recipe a reader could not perform', () => {
    // It is in the source file, so this is a filter working rather than data
    // that was never there.
    expect(raw.some((r) => r.product.id === 1019 && r.skillId === 2494)).toBe(true);
    expect(recipesMaking(1019)).toEqual([]);
  });

  it('drops every recipe of the three unavailable skills, and only those', () => {
    const unavailable = raw.filter((r) => r.skillId === 2494 || r.skillId === 2039 || r.skillId === 407);
    expect(unavailable.length).toBe(RECIPES_HIDDEN_UNAVAILABLE);
    expect(ALL_RECIPES.some((r) => r.skillId === 2494 || r.skillId === 2039 || r.skillId === 407)).toBe(false);
    expect(ALL_RECIPES.length + RECIPES_HIDDEN_UNAVAILABLE).toBe(raw.length);
  });

  it('keeps the skills the game does have', () => {
    // Prepare Potion (228) and the Blacksmith forging skills are second-job
    // and real here; dropping them would empty the crafting guides.
    expect(ALL_RECIPES.some((r) => r.skillId === 228)).toBe(true);
    expect(ALL_RECIPES.some((r) => r.skillId === 99)).toBe(true);
  });
});

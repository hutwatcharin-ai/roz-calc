// Server side of a guide's crafting calculator: turns the guide's recipes
// into the plain data components/craft-calc/CraftCalc takes, and looks up
// where every material in them comes from.

import type { Recipe } from '@/lib/crafting';
import type { CalcRecipe } from '@/lib/craft-calc';
import type { CraftCalcConfig } from '@/components/craft-calc/CraftCalc';
import { materialSources } from '@/lib/material-sources';
import trees from '@/data/skill-trees.json';

export const toCalcRecipe = (r: Recipe): CalcRecipe => ({
  id: r.id,
  product: { id: r.product.id, name: r.product.name, icon: r.product.icon ?? null, category: r.product.category ?? null, amount: r.product.amount },
  materials: r.materials.map((m) => ({ id: m.id, name: m.name, icon: m.icon ?? null, category: m.category ?? null, amount: m.amount, held: m.held ?? false })),
  skillId: r.skillId,
});

/** "Success Rate: 45%" per level from the client's skill text; [] when absent. */
export function skillRatesOf(slug: string): number[] {
  let found: number[] = [];
  const walk = (o: unknown): void => {
    if (found.length) return;
    if (Array.isArray(o)) o.forEach(walk);
    else if (o && typeof o === 'object') {
      const r = o as { slug?: string; levels?: string[] };
      if (r.slug === slug && Array.isArray(r.levels) && r.levels.length) {
        found = r.levels.map((t) => Number(/Success Rate:\s*(\d+)%/i.exec(t)?.[1] ?? NaN));
        return;
      }
      Object.values(o).forEach(walk);
    }
  };
  walk(trees);
  return found.length && found.every(Number.isFinite) ? found : [];
}

/** Iron Tempering, Steel Tempering, Enchanted Stone Craft: the ore skills. */
export function oreSkillRates() {
  return [
    { skillId: 94, slug: 'iron-tempering', name: 'Iron Tempering' },
    { skillId: 95, slug: 'steel-tempering', name: 'Steel Tempering' },
    { skillId: 96, slug: 'enchanted-stone-craft', name: 'Enchanted Stone Craft' },
  ]
    .map((s) => ({ skillId: s.skillId, name: s.name, rates: skillRatesOf(s.slug) }))
    .filter((s) => s.rates.length > 0);
}

export async function craftCalcConfig(
  base: Omit<CraftCalcConfig, 'recipes' | 'chain' | 'sources'> & { recipes: Recipe[]; chain?: Recipe[] },
): Promise<CraftCalcConfig> {
  const recipes = base.recipes.map(toCalcRecipe);
  const chain = base.chain?.map(toCalcRecipe);
  const ids = [...recipes, ...(chain ?? [])].flatMap((r) => r.materials.filter((m) => !m.held).map((m) => m.id));
  for (const m of base.perTry ?? []) ids.push(m.id);
  return { ...base, recipes, chain, sources: await materialSources(ids) };
}

// The shared engine behind every "how much do I farm" calculator on the
// crafting guides (owner, 9 Oct 2026: one set of parts, each page assembles
// its own calculator from them). Pure: no React, no data files.
//
// Three things every page needs, done once here:
//   - add up the materials of several recipes, merging the ones they share;
//   - keep "must be in the bag" items (cookbooks, creation guides) out of the
//     sums -- they are listed once, never multiplied;
//   - optionally make an intermediate yourself instead of farming it: Steel
//     becomes Iron + Coal, Iron becomes Iron Ore (the ore page's chain).
//
// A failed try still uses its materials, as in every RO crafting skill, so a
// known success rate turns "want 10" into "try 10 / rate" and every material
// of the try is spent that many times. An unknown rate counts as always
// succeeding, and the result says so (unknownRate) for the page to show.

export interface CalcMat {
  id: number;
  name: string;
  icon?: string | null;
  category?: string | null;
  amount: number;
  held?: boolean;
}

export interface CalcRecipe {
  id: string;
  product: CalcMat;
  materials: CalcMat[];
  skillId: number | null;
}

export interface CalcStep {
  recipe: CalcRecipe;
  /** Products wanted from this recipe. */
  want: number;
  /** Attempts to expect at `rate` (want / product amount / rate, rounded up). */
  tries: number;
  /** Success rate in %, or null when unknown (then tries = crafts). */
  rate: number | null;
  /** True when the reader picked it; false when it is an intermediate. */
  picked: boolean;
}

export interface CalcTotal extends CalcMat {
  amount: number;
}

export interface CalcPlan {
  /** What to farm or buy, merged across recipes, largest first. */
  raw: CalcTotal[];
  /** In the bag, not used up. Listed once. */
  held: CalcMat[];
  steps: CalcStep[];
  /** Some step's success rate is unknown, so its tries assume no failure. */
  unknownRate: boolean;
}

export interface CalcOptions {
  /** recipe id -> how many of its product the reader wants. */
  picks: Record<string, number>;
  /** Every recipe a pick can name. */
  recipes: CalcRecipe[];
  /** Recipes for intermediates the reader can make instead of farming. */
  chain?: CalcRecipe[];
  /** Turn chain materials into their own materials. */
  expand?: boolean;
  /** Success rate in % for a recipe, or null when unknown. */
  rateOf?: (r: CalcRecipe) => number | null;
  /** Spent once per try of a picked recipe (Alchemist's Mortar Bowl). */
  perTry?: (r: CalcRecipe) => CalcMat[];
}

export function planCraft({ picks, recipes, chain = [], expand = false, rateOf = () => null, perTry = () => [] }: CalcOptions): CalcPlan {
  const byId = new Map<string, CalcRecipe>();
  for (const r of [...recipes, ...chain]) byId.set(r.id, r);
  const chainByProduct = new Map<number, CalcRecipe>();
  for (const r of chain) if (!chainByProduct.has(r.product.id)) chainByProduct.set(r.product.id, r);

  // Height: how many chain links sit under a recipe. Resolving the tallest
  // first means Steel adds its Iron before Iron is turned into Iron Ore.
  const height = new Map<string, number>();
  const heightOf = (r: CalcRecipe, seen = new Set<string>()): number => {
    const known = height.get(r.id);
    if (known !== undefined) return known;
    if (seen.has(r.id)) return 0;
    seen.add(r.id);
    let h = 0;
    if (expand) {
      for (const m of r.materials) {
        const sub = !m.held ? chainByProduct.get(m.id) : undefined;
        if (sub && sub.id !== r.id) h = Math.max(h, 1 + heightOf(sub, seen));
      }
    }
    height.set(r.id, h);
    return h;
  };

  const pending = new Map<string, number>();
  const picked = new Set<string>();
  for (const [id, n] of Object.entries(picks)) {
    const want = Math.max(0, Math.floor(n));
    if (!want || !byId.has(id)) continue;
    pending.set(id, (pending.get(id) ?? 0) + want);
    picked.add(id);
  }

  const raw = new Map<number, CalcTotal>();
  const held = new Map<number, CalcMat>();
  const steps: CalcStep[] = [];
  let unknownRate = false;
  const addRaw = (m: CalcMat, n: number) => {
    const cur = raw.get(m.id);
    if (cur) cur.amount += n;
    else raw.set(m.id, { ...m, held: false, amount: n });
  };

  while (pending.size) {
    let next: CalcRecipe | null = null;
    for (const id of pending.keys()) {
      const r = byId.get(id)!;
      if (!next || heightOf(r) > heightOf(next)) next = r;
    }
    const r = next!;
    const want = pending.get(r.id)!;
    pending.delete(r.id);

    const crafts = Math.ceil(want / Math.max(1, r.product.amount));
    const rate = rateOf(r);
    if (rate === null) unknownRate = true;
    const tries = rate && rate > 0 ? Math.ceil(crafts / (rate / 100)) : crafts;
    steps.push({ recipe: r, want, tries, rate, picked: picked.has(r.id) });

    for (const m of r.materials) {
      if (m.held || m.amount === 0) {
        if (!held.has(m.id)) held.set(m.id, { ...m, amount: 0, held: true });
        continue;
      }
      const n = m.amount * tries;
      const sub = expand ? chainByProduct.get(m.id) : undefined;
      if (sub && sub.id !== r.id) pending.set(sub.id, (pending.get(sub.id) ?? 0) + n);
      else addRaw(m, n);
    }
    if (picked.has(r.id)) for (const m of perTry(r)) addRaw(m, m.amount * tries);
  }

  return {
    raw: [...raw.values()].sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name)),
    held: [...held.values()],
    steps,
    unknownRate,
  };
}

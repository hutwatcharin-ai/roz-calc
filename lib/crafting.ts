// Reading side of data/crafting-recipes.json.
//
// The file is built by scripts/build-crafting-recipes.mjs from two sources
// that are checked against each other; this module only groups and labels,
// it never decides what is true. See the file's own _meta for provenance.

import file from '@/data/crafting-recipes.json';

export type CraftKind = 'forge' | 'arrow' | 'brew' | 'cook' | 'ore' | 'quest' | 'other';
export type Confidence = 'both' | 'rathena-only' | 'prontera-only';

export interface CraftMaterial {
  id: number;
  name: string;
  /** Sprite path under /public, or null when the item has no mirrored icon. */
  icon?: string | null;
  /** Our own category, for ItemIcon's lettered stand-in and for itemHref. */
  category?: string | null;
  /** 0 means the item must be in the bag but is not used up. */
  amount: number;
  held?: boolean;
}

export interface Recipe {
  id: string;
  kind: CraftKind;
  product: CraftMaterial;
  materials: CraftMaterial[];
  itemLevel: number | null;
  skillId: number | null;
  skillLevel: number | null;
  confidence: Confidence;
  otherRegion?: boolean;
  sources: string[];
}

/**
 * rAthena production tables include recipes for skills this game does not
 * have. Three of them, found on 10 Sep 2026 when a reader asked where Trunk
 * is crafted and the answer was "Rotten Bandage x10 + Single Cell x10":
 *
 *   2494 GN_CHANGEMATERIAL  Genetic, a third job     56 recipes
 *   2039 AB_ANCILLA         Arch Bishop, a third job  1 recipe
 *    407 ASC_CDP            Assassin Cross            1 recipe
 *
 * RO Zero Global opened second jobs on 3 Sep 2026 and has no third job at
 * all. Our own skills table shows it: "Change Material" and "Ancilla" are
 * there as empty shells -- no class, no type, no description -- while a real
 * skill like Prepare Potion carries classes: ["Alchemist"]. 418 of its 851
 * rows are shells like that.
 *
 * These recipes are dropped rather than labelled: a recipe nobody can perform
 * is not a recipe, and leaving it on an item page sends a reader hunting for
 * materials to make something the game will not let them make.
 */
const SKILLS_NOT_IN_THIS_GAME = new Set([2494, 2039, 407]);

const RECIPES = (file as unknown as { recipes: Recipe[] }).recipes.filter(
  (recipe) => recipe.skillId === null || !SKILLS_NOT_IN_THIS_GAME.has(recipe.skillId),
);

/** How many the filter above removes, for a page that wants to say so. */
export const RECIPES_HIDDEN_UNAVAILABLE =
  (file as unknown as { recipes: Recipe[] }).recipes.length - RECIPES.length;

export const KIND_TITLES: Record<CraftKind, string> = {
  forge: 'ตีอาวุธ',
  arrow: 'ทำลูกศร',
  brew: 'ปรุงยา',
  cook: 'ทำอาหาร',
  ore: 'หลอมแร่และหินธาตุ',
  quest: 'เอาของไปแลก',
  other: 'อื่นๆ',
};

// Said in the words a reader can act on, not in the words a database uses.
export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  both: 'ตรงกัน 2 แหล่ง',
  'rathena-only': 'ยังไม่ยืนยันกับ Zero',
  'prontera-only': 'ยังไม่ยืนยันกับ Zero',
};

export const CONFIDENCE_WHY: Record<Confidence, string> = {
  both: 'ทั้งตารางฝั่งเซิร์ฟเวอร์ของ rAthena และฐานข้อมูล Zero ระบุตรงกันว่าใช้วัตถุดิบชุดนี้',
  'rathena-only': 'มีในตารางฝั่งเซิร์ฟเวอร์ของ rAthena (RO คลาสสิก) แต่ยังไม่มีฐานข้อมูล Zero ไหนยืนยัน',
  'prontera-only': 'มีเฉพาะในฐานข้อมูล Zero แหล่งเดียว ยังไม่มีตารางฝั่งเซิร์ฟเวอร์ยืนยัน',
};

export function recipesOfKind(kind: CraftKind): Recipe[] {
  return RECIPES.filter((r) => r.kind === kind);
}

/**
 * Confirmed first, then alphabetical -- by the column the reader is looking
 * things up in. On the arrow guide that is the MATERIAL: every one of the
 * 212 rows produces something called "Arrow", so sorting by product leaves
 * the reader scanning an identical column for the thing they actually have
 * in their bag.
 */
export function sortRecipes(rows: Recipe[], by: 'product' | 'material' = 'product'): Recipe[] {
  const rank = (c: Confidence) => (c === 'both' ? 0 : 1);
  const label = (r: Recipe) =>
    by === 'material' ? (r.materials.find((m) => !m.held) ?? r.materials[0]).name : r.product.name;
  return [...rows].sort(
    (a, b) => rank(a.confidence) - rank(b.confidence) || label(a).localeCompare(label(b)),
  );
}

export function splitByConfidence(
  rows: Recipe[],
  by: 'product' | 'material' = 'product',
): { confirmed: Recipe[]; unconfirmed: Recipe[] } {
  return {
    confirmed: sortRecipes(rows.filter((r) => r.confidence === 'both'), by),
    unconfirmed: sortRecipes(rows.filter((r) => r.confidence !== 'both'), by),
  };
}

/** Every recipe that uses this item, for an item page's "ใช้ทำอะไรได้". */
export function recipesUsing(itemId: number): Recipe[] {
  return sortRecipes(RECIPES.filter((r) => r.materials.some((m) => m.id === itemId)));
}

/** Every way to make this item, for an item page's "ทำเองได้จาก". */
export function recipesMaking(itemId: number): Recipe[] {
  return sortRecipes(RECIPES.filter((r) => r.product.id === itemId));
}

export function craftCounts(): Record<CraftKind, { total: number; confirmed: number }> {
  const out = {} as Record<CraftKind, { total: number; confirmed: number }>;
  for (const r of RECIPES) {
    const slot = out[r.kind] ?? { total: 0, confirmed: 0 };
    slot.total += 1;
    if (r.confidence === 'both') slot.confirmed += 1;
    out[r.kind] = slot;
  }
  return out;
}

export const ALL_RECIPES = RECIPES;

// Reading side of data/item-links.json (scripts/build-item-links.mts):
// item families folded into one page, and the items an item's game text
// names. Server only -- the file is ~70 KB; lib/item-href takes the small
// redirect map from data/item-family-heads.json instead.
import file from '@/data/item-links.json';
import heads from '@/data/item-family-heads.json';

const data = file as unknown as {
  families: Record<string, { name: string; members: number[] }>;
  mentions: Record<string, { ids: number[]; box: boolean }>;
};
const HEAD_OF = heads as unknown as Record<string, number>;

/** The page this item folds into, or null when it has its own. */
export function familyHeadOf(id: number): number | null {
  return HEAD_OF[id] ?? null;
}

/** The ladder this item heads: its name without the level, and every level in order. */
export function familyOf(id: number): { name: string; members: number[] } | null {
  return data.families[id] ?? null;
}

/** Items this item's text names, and whether the text says it holds or gives them. */
export function mentionsOf(id: number): { ids: number[]; box: boolean } | null {
  return data.mentions[id] ?? null;
}

const CONTAINED_IN = new Map<number, number[]>();
const NAMED_BY = new Map<number, number[]>();
for (const [from, m] of Object.entries(data.mentions)) {
  for (const to of m.ids) {
    const map = m.box ? CONTAINED_IN : NAMED_BY;
    map.set(to, [...(map.get(to) ?? []), Number(from)]);
  }
}

/** Boxes and packages whose text says they hold this item. */
export function boxesHolding(id: number): number[] {
  return CONTAINED_IN.get(id) ?? [];
}

/** Other items whose text names this one without holding it (a scroll that needs it). */
export function itemsNaming(id: number): number[] {
  return NAMED_BY.get(id) ?? [];
}

export const FOLDED_ITEM_IDS: ReadonlySet<number> = new Set(Object.keys(HEAD_OF).map(Number));

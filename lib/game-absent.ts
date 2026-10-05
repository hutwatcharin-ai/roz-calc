// Items the live game client has no entry for -- not in the current game
// (see scripts/build-game-absent.mjs for how the list is made).
//
// Owner's call, 22 Sep 2026: such an item keeps its page (links and search
// history keep working, and a later patch may bring it in) but carries a
// label, stays out of lists, search and the drop filters, and asks search
// engines not to index it. Rerun the two build scripts after a patch and an
// item that arrives drops off this list by itself.
import file from '@/data/game-absent-items.json';
import { LEFTOVER_IDS_BY_CATEGORY } from '@/lib/classic-twins';

const raw = file as { _meta: { clientBuilt: string; absent: number }; ids: number[]; idsByCategory: Record<string, number[]> };

// Classic leftovers (lib/classic-twins: 1463 Hallberd, whose real item is
// 630053) are kept out of the same lists, search and sitemap. Their pages
// redirect to the Zero copy rather than show the "not in game" label.
const leftovers = Object.values(LEFTOVER_IDS_BY_CATEGORY).flat();
const data = {
  ...raw,
  ids: [...raw.ids, ...leftovers],
  idsByCategory: Object.fromEntries(
    [...new Set([...Object.keys(raw.idsByCategory), ...Object.keys(LEFTOVER_IDS_BY_CATEGORY)])].map((c) => [
      c,
      [...(raw.idsByCategory[c] ?? []), ...(LEFTOVER_IDS_BY_CATEGORY[c] ?? [])],
    ]),
  ),
};
const ABSENT = new Set(data.ids);

export function isAbsentFromGame(id: number): boolean {
  return ABSENT.has(id);
}

/** Only what the client lacks -- not the classic leftovers, which it has. */
export const ABSENT_ITEM_IDS: readonly number[] = raw.ids;
export const ABSENT_CHECKED = data._meta.clientBuilt;

/**
 * PostgREST `not.in` list for queries that page in the database, holding only
 * the absent ids in the given categories so the URL stays short.
 */
export function absentIdsFilter(categories: readonly string[]): string {
  const ids = categories.flatMap((c) => data.idsByCategory[c] ?? []);
  return `(${ids.length ? ids.join(',') : '0'})`;
}

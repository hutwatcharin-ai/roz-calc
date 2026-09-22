// Items the live game client has no entry for -- not in the current game
// (see scripts/build-game-absent.mjs for how the list is made).
//
// Owner's call, 22 Sep 2026: such an item keeps its page (links and search
// history keep working, and a later patch may bring it in) but carries a
// label, stays out of lists, search and the drop filters, and asks search
// engines not to index it. Rerun the two build scripts after a patch and an
// item that arrives drops off this list by itself.
import file from '@/data/game-absent-items.json';

const data = file as { _meta: { clientBuilt: string; absent: number }; ids: number[]; idsByCategory: Record<string, number[]> };
const ABSENT = new Set(data.ids);

export function isAbsentFromGame(id: number): boolean {
  return ABSENT.has(id);
}

export const ABSENT_ITEM_IDS: readonly number[] = data.ids;
export const ABSENT_CHECKED = data._meta.clientBuilt;

/**
 * PostgREST `not.in` list for queries that page in the database, holding only
 * the absent ids in the given categories so the URL stays short.
 */
export function absentIdsFilter(categories: readonly string[]): string {
  const ids = categories.flatMap((c) => data.idsByCategory[c] ?? []);
  return `(${ids.length ? ids.join(',') : '0'})`;
}

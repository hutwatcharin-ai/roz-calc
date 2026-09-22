// The names items carried on this site before they were renamed to the live
// game's own (scripts/rename-items-to-game.mjs, 22 Sep 2026).
//
// Two jobs, the same as lib/former-names.ts does for monsters:
// - search: "Orc Trophy" still finds what the game calls "Horro of Tribe";
// - lookups keyed by name (card release dates, memorial gear, pet taming
//   items) still match data files written against the old names.
import file from '@/data/item-former-names.json';

interface FormerName { name: string; until: string }
const data = (file as unknown as { items: Record<string, FormerName[]> }).items;

export function itemFormerNames(id: number | string): string[] {
  return (data[String(id)] ?? []).map((n) => n.name);
}

function squash(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Ids whose former name contains every word of the query (or the query whole). */
export function itemFormerNameIdsFor(query: string): number[] {
  const q = squash(query);
  if (q.length < 3) return [];
  const out: number[] = [];
  for (const [id, names] of Object.entries(data)) {
    if (names.some((n) => squash(n.name).includes(q))) out.push(Number(id));
  }
  return out;
}

/** The current name and every former one, for a lookup keyed by name. */
export function itemNamesOf(item: { id: number; name_en: string }): string[] {
  return [item.name_en, ...itemFormerNames(item.id)];
}

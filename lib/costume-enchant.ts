// Costumes the official Costume Enchant guide lists (data/costume-enchant-list.json,
// read 4 Nov 2026): these take an enchant stone and go into the Enchant Stone
// Craft Box. Only the free copy's id is stored; a Bound copy folds into that
// page (lib/costume-twins), and the craft box takes unbound costumes only.
import file from '@/data/costume-enchant-list.json';

const ids = (file as { ids: Record<string, number | null> }).ids;

export const ENCHANTABLE_IDS: ReadonlySet<number> = new Set(
  Object.values(ids).filter((id): id is number => id !== null),
);

export function isEnchantableCostume(id: number): boolean {
  return ENCHANTABLE_IDS.has(id);
}

/** Item id for a name as the official list spells it, or null when no item can be named for sure. */
export function enchantListId(name: string): number | null {
  return ids[name] ?? null;
}

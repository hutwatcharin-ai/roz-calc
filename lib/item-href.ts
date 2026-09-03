// One `items` table, three detail routes: gear, costumes, and everything else.
//
// Gear split off the item route on 3 Sep 2026 because a weapon rendered like a
// Jellopy. Costumes split off gear the same day for the opposite reason: at 940
// of 1,815 wearable rows they were the majority of the equipment list, so a
// player looking for armour scrolled past hats they cannot fight in. Every
// surface that links to a row branches on the row's category, and the routes
// redirect to each other on a mismatch, so the rule lives here once.

export const GEAR_CATEGORIES = ['Armor', 'Weapon'] as const;
export const COSTUME_CATEGORY = 'Costume Equipment';

export function isGearCategory(category: string | null | undefined): boolean {
  return category != null && (GEAR_CATEGORIES as readonly string[]).includes(category);
}

export function isCostumeCategory(category: string | null | undefined): boolean {
  return category === COSTUME_CATEGORY;
}

/** Wearable at all -- gear or costume. */
export function isEquipmentCategory(category: string | null | undefined): boolean {
  return isGearCategory(category) || isCostumeCategory(category);
}

export function itemHref(id: number | string, category: string | null | undefined): string {
  if (isGearCategory(category)) return `/database/equipment/${id}`;
  if (isCostumeCategory(category)) return `/database/costumes/${id}`;
  return `/database/items/${id}`;
}

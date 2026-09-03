// Equipment and plain items share one `items` table but not one page: gear has
// its own detail route so a weapon does not render through the same template as
// a Jellopy. Every surface that links to a row must therefore branch on the
// row's category, and the two routes must agree on where the line is -- so the
// rule lives here once, next to the category list the equipment list page
// already filters by.

import { EQUIPMENT_CATEGORIES } from './equip-filter';

export function isEquipmentCategory(category: string | null | undefined): boolean {
  return category != null && (EQUIPMENT_CATEGORIES as readonly string[]).includes(category);
}

export function itemHref(id: number | string, category: string | null | undefined): string {
  return isEquipmentCategory(category) ? `/database/equipment/${id}` : `/database/items/${id}`;
}

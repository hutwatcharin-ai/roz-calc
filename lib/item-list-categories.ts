// The categories /database/items lists, shared with the item suggestions
// (app/suggest/[kind]).

// Consumables and materials only: equipment and cards moved to their own
// pages (/database/equipment, /database/cards), rozerodb-style. Legacy
// category params for those redirect below instead of 404-ing old links.
export const ITEM_LIST_CATEGORIES = [
  // Ammo was missing until 10 Sep 2026, which left its 14 arrows and bullets
  // reachable by search but on no list at all.
  'Ammo',
  'Consumable / Recovery',
  'Enchant Stone',
  'Enchantment',
  // Material and Package/Box arrived 14 Sep 2026 with the 54 ids a second
  // database (roz.prontera.info) listed that ours never had -- guild event
  // flames, cash-shop bundles. Same rule as the three above: a category
  // nobody can filter to is a category nobody finds.
  'Material',
  'Other',
  'Package/Box',
  'Pet',
  'Special',
];

// "What is this item for" on /database/items, the same question the card list
// answers with its role chips.
//
// The cards could be grouped by reading their effect, because a card's
// description IS its effect. An item's description is flavour text with the
// effect buried in a sentence -- "Purple root vegetable rich in starch and
// sweet in flavor, often used as food. Recovers a small amount of HP." -- so
// only two of the 2,096 items on that page state a number a regex could read.
//
// So every group here rests on something checkable instead:
//
//   the crafting recipes we already publish (data/crafting-recipes.json),
//     which say outright that an item is a material or a product
//   the item's category, which the game assigns
//   a phrase in the game's own description, for the three uses that phrase
//     themselves consistently (recovers/restores, "for N minutes", teleport)
//
// Groups that would need a guess are left out. "Box" in a name does not make
// something a box, and 956 items on that page have no group at all -- the page
// says that number rather than inventing a home for them.
//
// Each role carries the filter it applies, so the list stays server-paginated
// and its count stays exact.

import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';
import { ALL_RECIPES } from '@/lib/crafting';

export type ItemRole = 'craft-material' | 'craft-product' | 'heal' | 'buff' | 'travel' | 'enchant' | 'pet' | 'ammo';

// Read through lib/crafting, not from the JSON: that module drops the 58
// recipes whose skill does not exist in this game, and a chip that counted
// them would send a reader to an item page with no recipe on it.

/** Item ids that appear as a material in a recipe someone can actually do. */
export const CRAFT_MATERIAL_IDS: number[] = [
  ...new Set(ALL_RECIPES.flatMap((r) => r.materials.map((m) => m.id))),
].sort((a, b) => a - b);

/** Item ids that such a recipe makes. */
export const CRAFT_PRODUCT_IDS: number[] = [...new Set(ALL_RECIPES.map((r) => r.product.id))].sort((a, b) => a - b);

export const ROLE_TH: Record<ItemRole, { title: string; asks: string }> = {
  'craft-material': { title: 'ใช้คราฟต์', asks: 'เป็นวัตถุดิบในสูตรคราฟต์ที่เว็บนี้มี' },
  'craft-product': { title: 'คราฟต์เองได้', asks: 'มีสูตรทำเองแทนที่จะต้องหาซื้อหรือรอดรอป' },
  heal: { title: 'ฟื้น HP/SP', asks: 'คำอธิบายในเกมบอกว่าฟื้นฟูให้' },
  buff: { title: 'บัฟมีเวลา', asks: 'คำอธิบายในเกมบอกจำนวนนาทีหรือวินาทีที่ผลอยู่' },
  travel: { title: 'เดินทาง/วาร์ป', asks: 'คำอธิบายในเกมบอกว่าย้ายตัวละคร' },
  enchant: { title: 'เอนแชนต์', asks: 'ของสำหรับใส่เอนแชนต์ให้อุปกรณ์' },
  pet: { title: 'สัตว์เลี้ยง', asks: 'ไข่ ของที่ใช้จับ และของเลี้ยง' },
  ammo: { title: 'ลูกธนู', asks: 'ลูกธนูและกระสุนสำหรับอาวุธยิง' },
};

/** Chip order: what a player is most likely to be hunting for, first. */
export const ROLE_ORDER: ItemRole[] = ['craft-material', 'craft-product', 'heal', 'buff', 'travel', 'enchant', 'pet', 'ammo'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Query = PostgrestFilterBuilder<any, any, any, any, any>;

/**
 * Narrows a query on `items` to one role. The rules live here rather than in
 * the page so the chip counts and the filtered list cannot drift apart: both
 * call this.
 */
export function applyItemRole(query: Query, role: ItemRole): Query {
  switch (role) {
    case 'craft-material':
      return query.in('id', CRAFT_MATERIAL_IDS);
    case 'craft-product':
      return query.in('id', CRAFT_PRODUCT_IDS);
    case 'heal':
      // The two verbs the game uses for it. Kept to those two: "cure" also
      // appears, on items that cure a status rather than restore points.
      return query.or('description.ilike.%recover%,description.ilike.%restore%');
    case 'buff':
      return query.filter('description', 'imatch', 'for [0-9]+ (minute|min|second)');
    case 'travel':
      return query.or('description.ilike.%teleport%,description.ilike.%warp%');
    case 'enchant':
      return query.in('category', ['Enchantment', 'Enchant Stone']);
    case 'pet':
      return query.eq('category', 'Pet');
    case 'ammo':
      return query.eq('category', 'Ammo');
  }
}

export function isItemRole(value: string | undefined): value is ItemRole {
  return !!value && (ROLE_ORDER as string[]).includes(value);
}

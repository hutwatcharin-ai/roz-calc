// Which NPC sells an item.
//
// Built by scripts/build-npc-shops.mjs from rAthena's shop scripts. The site
// could not answer "where do I buy this" at all before, and people ask: Search
// Console has "milk ro ซื้อที่ไหน" landing on our Milk page, which said only
// what it sells for.
//
// What this is NOT: confirmation that the NPC stands there in this game. It is
// classic RO's shop layout. No Zero source we hold lists shop NPCs -- 515 NPC
// pages on prontera and 84 on rozerodb are all quest NPCs -- so the page has
// to say where the claim comes from. The goods are at least filtered to items
// that exist in our own table, which dropped 306 of the 605 rows in the
// source.

import file from '@/data/npc-shops.json';

export interface ShopEntry {
  npc: string;
  /** Map code, which is also what the /navi command takes. */
  map: string;
  x: number;
  y: number;
  /** Zeny, when the shop charges something other than the item's own price. */
  price: number | null;
}

const shops = (file as { items: Record<string, ShopEntry[]> }).items;

export function shopsFor(itemId: number): ShopEntry[] {
  return shops[String(itemId)] ?? [];
}

/** For a sentence about how much of the catalogue this covers. */
export const ITEMS_WITH_A_SELLER = Object.keys(shops).length;

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
// to say where the claim comes from.
//
// Two filters make the rows worth showing anyway: the goods are items our own
// table has, and the shop stands in a region this game has. The second one
// came late -- the first build sent people to Dewata, Malangdo and
// Lighthalzen, which have not opened here.

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

/**
 * The towns a player is actually in, first. Aloe has 21 sellers and the file's
 * order is the order rAthena's script happens to list them in, so without this
 * the first row of a 21-row table can be an Amatsu indoor map while Prontera
 * sits eleventh.
 */
const TOWN_ORDER = ['prontera', 'prt_in', 'izlude', 'izlude_in', 'geffen', 'geffen_in', 'payon', 'payon_in01', 'payon_in02', 'morocc', 'morocc_in', 'moc_ruins', 'alberta', 'alberta_in', 'comodo', 'cmd_in01', 'aldebaran', 'aldeba_in'];

export function shopsFor(itemId: number): ShopEntry[] {
  const rows = shops[String(itemId)] ?? [];
  const rank = (row: ShopEntry) => {
    const i = TOWN_ORDER.indexOf(row.map);
    return i === -1 ? TOWN_ORDER.length : i;
  };
  return [...rows].sort((a, b) => rank(a) - rank(b) || a.map.localeCompare(b.map));
}

/** For a sentence about how much of the catalogue this covers. */
export const ITEMS_WITH_A_SELLER = Object.keys(shops).length;

/** Every row, for the checks that are about the data as a whole. */
export const ALL_SHOPS: [string, ShopEntry[]][] = Object.entries(shops);
export const ALL_SHOP_ROWS: ShopEntry[] = ALL_SHOPS.flatMap(([, rows]) => rows);

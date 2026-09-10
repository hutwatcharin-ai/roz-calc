// Which NPC sells an item, and where that NPC stands.
//
// The site could not answer "where do I buy this" at all. Search Console shows
// people asking it ("milk ro ซื้อที่ไหน"), and it is the missing half of every
// crafting page: /guides/cooking says you need a cookbook, and until now
// nothing said the cookbooks are sold rather than dropped.
//
// Source: rAthena's npc/re/merchants/shops.txt -- the server-side shop
// definitions for classic RO. Each line is
//
//   map,x,y,dir<TAB>shop<TAB>Name#tag<TAB>sprite,item:price,item:price,...
//
// with -1 meaning "the item's own buy price".
//
// The honest limit, and it is a real one: this is classic RO's shop layout,
// not Zero's. Zero moved towns around, and no Zero source we hold lists shop
// NPCs at all -- prontera's 515 NPC pages and rozerodb's 84 are quest NPCs
// only. So every row this writes is labelled as unverified for Zero on the
// page that shows it, and the item ids are filtered against our own items
// table so at least the goods exist in this game.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-npc-shops.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const SOURCE = 'https://raw.githubusercontent.com/rathena/rathena/master/npc/re/merchants/shops.txt';
const DEST = path.join(process.cwd(), 'data', 'npc-shops.json');

/** `prontera,156,212,1\tshop\tChef Assistant#prt\t700,12849:-1,581:-1` */
const SHOP_LINE = /^([a-zA-Z0-9_@]+),(\d+),(\d+),\d+\t(shop|itemshop|pointshop)\t([^\t]+)\t(.+)$/;

function parse(text) {
  const shops = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    const match = SHOP_LINE.exec(line);
    if (!match) continue;
    const [, map, x, y, kind, rawName, goods] = match;
    // "Chef Assistant#prt" -- everything after # is a script-internal tag.
    const name = rawName.split('#')[0].trim();
    const items = [];
    // The first number in the goods list is the NPC sprite id, not an item.
    const parts = goods.split(',').slice(1);
    for (const part of parts) {
      const [id, price] = part.split(':');
      if (!/^\d+$/.test(id ?? '')) continue;
      items.push({ id: Number(id), price: Number(price) });
    }
    if (items.length > 0) shops.push({ name, map, x: Number(x), y: Number(y), kind, items });
  }
  return shops;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const response = await fetch(SOURCE);
  if (!response.ok) throw new Error(`could not read the shop table: HTTP ${response.status}`);
  const shops = parse(await response.text());
  console.log(`${shops.length} shops in the source`);

  // Only goods this game actually has, and only maps it actually has: a row
  // pointing at an item or a town that is not in Zero is worse than no row.
  const items = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('id, name_en').range(from, from + 999);
    if (error) throw error;
    for (const row of data) items.set(row.id, row.name_en);
    if (data.length < 1000) break;
  }
  // No readable map name is attached, on purpose. Every shop stands in a town
  // or a town interior, and this site has no name for those: the map index
  // holds fields and dungeons, and monster_spawns cannot know a town because
  // towns have no monsters. Inventing "Prontera" from the code prontera would
  // be right; inventing one for prt_in or s_atelier would be guessing. The
  // code is what /navi takes anyway, so the code is what gets published.

  const byItem = {};
  let kept = 0;
  let droppedItem = 0;
  const townsSeen = new Set();
  for (const shop of shops) {
    townsSeen.add(shop.map);
    for (const good of shop.items) {
      if (!items.has(good.id)) {
        droppedItem += 1;
        continue;
      }
      const list = (byItem[good.id] ??= []);
      list.push({
        npc: shop.name,
        map: shop.map,
        x: shop.x,
        y: shop.y,
        // -1 means the shop charges the item's own buy price, which our items
        // table already carries; null keeps this file from repeating it.
        price: good.price > 0 ? good.price : null,
      });
      kept += 1;
    }
  }

  const sorted = Object.fromEntries(Object.keys(byItem).sort((a, b) => Number(a) - Number(b)).map((id) => [id, byItem[id]]));
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          built: new Date().toISOString().slice(0, 10),
          source: SOURCE,
          how: 'node scripts/build-npc-shops.mjs',
          caveat:
            "rAthena's classic-RO shop layout. No Zero source we hold lists shop NPCs, so the NPC and its coordinates are unverified for this server; the goods are filtered to items that exist in our own table.",
          shopsInSource: shops.length,
          itemsListed: Object.keys(sorted).length,
          rowsKept: kept,
          rowsDroppedUnknownItem: droppedItem,
          maps: [...townsSeen].sort(),
        },
        items: sorted,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`${Object.keys(sorted).length} items have a seller, ${kept} rows`);
  console.log(`dropped ${droppedItem} rows for items this game does not have`);
  console.log(`${townsSeen.size} maps carry a shop: ${[...townsSeen].sort().join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

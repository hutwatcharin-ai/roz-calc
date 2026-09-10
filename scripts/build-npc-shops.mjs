// Which NPC sells an item, and where that NPC stands.
//
// The site could not answer "where do I buy this" at all. Search Console shows
// people asking it ("milk ro ซื้อที่ไหน"), and it is the missing half of every
// crafting page: /guides/cooking says you need a cookbook, and until now
// nothing said the cookbooks are sold rather than dropped.
//
// Sources, in the order a row is trusted:
//
//   npc/merchants/shops.txt            pre-renewal, 156 shops
//   npc/re/merchants/shops.txt         renewal, 73 shops
//   npc/re/merchants/Dealer_Update.txt renewal, 33 shops
//
// The pre-renewal file leads because Zero is the classic ruleset, and because
// the renewal file alone was missing a seller for 89 items this game has --
// renewal moved those goods to NPCs that do not exist here. The other files in
// npc/re/merchants are refiners, enchanters and coin exchanges, not shops.
//
// Each line is
//
//   map,x,y,dir<TAB>shop<TAB>Name#tag<TAB>sprite,item:price,item:price,...
//
// with -1 meaning "the item's own buy price".
//
// Two filters, and the second one is the point of this rewrite:
//
//   1. goods must be items our own table has;
//   2. the shop must stand in a region this game actually has.
//
// The first build shipped 84 rows -- 28% of the file -- in Dewata, Malangdo,
// Malaya, Lighthalzen, El Dicastes and Mora, and 14 items had their only
// seller there. Those are later episodes: our own map table holds 501 maps and
// not one of them starts with dew, mal, lhz, ein, bra, ra_, dic, mosk or hu_,
// while prt has 45, pay 41, gef 37 and moc 26. A region with no field in it is
// a region that has not opened, and a /navi to it is worse than no answer.
//
// The honest limit that remains: this is classic RO's shop layout, not Zero's.
// No Zero source we hold lists shop NPCs -- prontera's 515 NPC pages and
// rozerodb's 84 are quest NPCs only -- so every row is labelled as unverified
// for Zero on the page that shows it.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-npc-shops.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const RAW = 'https://raw.githubusercontent.com/rathena/rathena/master/';
const SOURCES = [
  'npc/merchants/shops.txt',
  'npc/re/merchants/shops.txt',
  'npc/re/merchants/Dealer_Update.txt',
];
const DEST = path.join(process.cwd(), 'data', 'npc-shops.json');

/** `prontera,156,212,1\tshop\tChef Assistant#prt\t700,12849:-1,581:-1` */
const SHOP_LINE = /^([a-zA-Z0-9_@]+),(\d+),(\d+),\d+\t(shop|itemshop|pointshop)\t([^\t]+)\t(.+)$/;

/**
 * Codes our evidence files spell differently from the shop scripts. Each value
 * is a map code or region we do hold, so an alias still has to be earned:
 * Amatsu is here because our map table holds 13 ama_ maps, and the Sunken Ship
 * approach because it holds treasure01. Everything else resolves by stripping
 * the indoor suffix or by region.
 */
const TOWN_ALIASES = { aldeba: 'aldebaran', amatsu: 'ama', alb2trea: 'treasure01', in: null };

function parse(text, source) {
  const shops = [];
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('//')) continue;
    const match = SHOP_LINE.exec(line);
    if (!match) continue;
    const [, map, x, y, kind, rawName, goods] = match;
    // Only plain `shop` sells for zeny. An itemshop or pointshop charges in
    // another currency, and its first field is that currency, not a good --
    // publishing its numbers as zeny would be a wrong price on every row.
    if (kind !== 'shop') continue;
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
    if (items.length > 0) shops.push({ name, map, x: Number(x), y: Number(y), items, source });
  }
  return shops;
}

/** Map codes and region prefixes this game is known to have. */
function buildEvidence(mapCodes) {
  const codes = new Set(mapCodes);
  const regions = new Set(mapCodes.map((code) => code.split('_')[0]));
  for (const file of ['npc-quests.json', 'rozglobal-guides.json']) {
    const data = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', file), 'utf8'));
    const walk = (node) => {
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === 'object') {
        for (const [key, value] of Object.entries(node)) {
          if ((key === 'map' || key === 'map_code' || key === 'map_id') && typeof value === 'string') {
            codes.add(value);
            regions.add(value.split('_')[0]);
          } else walk(value);
        }
      }
    };
    walk(data);
  }
  return { codes, regions };
}

/** True when a shop's map belongs to a place this game has. */
function mapIsInThisGame(map, evidence) {
  if (evidence.codes.has(map)) return true;
  // prt_in, payon_in01, geffen_in -> the town itself.
  const town = map.replace(/_in\d*$/, '');
  const named = TOWN_ALIASES[town] ?? town;
  if (named && (evidence.codes.has(named) || evidence.regions.has(named))) return true;
  // moc_ruins -> moc, cmd_in01 -> cmd: a region with fields we hold.
  const region = map.split('_')[0];
  const aliased = TOWN_ALIASES[region] ?? region;
  return Boolean(aliased) && (evidence.regions.has(aliased) || evidence.codes.has(aliased));
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const shops = [];
  for (const source of SOURCES) {
    const response = await fetch(RAW + source);
    if (!response.ok) throw new Error(`could not read ${source}: HTTP ${response.status}`);
    const parsed = parse(await response.text(), source);
    console.log(`${parsed.length} shops in ${source}`);
    shops.push(...parsed);
  }

  const items = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('id, name_en').range(from, from + 999);
    if (error) throw error;
    for (const row of data) items.set(row.id, row.name_en);
    if (data.length < 1000) break;
  }

  const mapCodes = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('map_stats').select('map_code').range(from, from + 999);
    if (error) throw error;
    mapCodes.push(...data.map((r) => r.map_code));
    if (data.length < 1000) break;
  }
  const evidence = buildEvidence(mapCodes);
  console.log(`${mapCodes.length} maps with monsters, ${evidence.codes.size} map codes and ${evidence.regions.size} regions of evidence`);

  // No readable map name is attached, on purpose. Every shop stands in a town
  // or a town interior, and this site has no name for those: the map index
  // holds fields and dungeons, and monster_spawns cannot know a town because
  // towns have no monsters. Inventing "Prontera" from the code prontera would
  // be right; inventing one for prt_in or s_atelier would be guessing. The
  // code is what /navi takes anyway, so the code is what gets published.

  const byItem = {};
  // Same NPC in two files is one NPC. First source wins, which is why the
  // pre-renewal file is listed first: where the two disagree on a price, the
  // classic number is the one this ruleset uses.
  const seen = new Set();
  let kept = 0;
  let droppedItem = 0;
  let droppedMap = 0;
  const townsSeen = new Set();
  const townsDropped = new Map();
  for (const shop of shops) {
    if (!mapIsInThisGame(shop.map, evidence)) {
      droppedMap += shop.items.length;
      townsDropped.set(shop.map, (townsDropped.get(shop.map) ?? 0) + shop.items.length);
      continue;
    }
    townsSeen.add(shop.map);
    for (const good of shop.items) {
      if (!items.has(good.id)) {
        droppedItem += 1;
        continue;
      }
      const fingerprint = `${good.id}|${shop.name}|${shop.map}|${shop.x}|${shop.y}`;
      if (seen.has(fingerprint)) continue;
      seen.add(fingerprint);
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
          sources: SOURCES.map((s) => RAW + s),
          how: 'node scripts/build-npc-shops.mjs',
          caveat:
            "rAthena's classic-RO shop layout. No Zero source we hold lists shop NPCs, so the NPC and its coordinates are unverified for this server; the goods are filtered to items that exist in our own table, and the shops to regions this game has.",
          shopsInSource: shops.length,
          itemsListed: Object.keys(sorted).length,
          rowsKept: kept,
          rowsDroppedUnknownItem: droppedItem,
          rowsDroppedMapNotInThisGame: droppedMap,
          mapsDropped: Object.fromEntries([...townsDropped].sort((a, b) => b[1] - a[1])),
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
  console.log(`dropped ${droppedMap} rows in ${townsDropped.size} places this game does not have: ${[...townsDropped.keys()].sort().join(', ')}`);
  console.log(`${townsSeen.size} maps carry a shop: ${[...townsSeen].sort().join(', ')}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

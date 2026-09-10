// Zero's NPCs: who they are, where they stand, and which quests they give.
//
// The quest table has 766 rows, 602 of them with a map and 591 with
// coordinates -- and no column for the person you actually talk to. "Go to
// prt_fild05 351,220" is half an instruction; the other half is "and speak to
// Ann". Nothing on this site could say that.
//
// Source: the 514 NPC pages crawled from roz.prontera.info on 3 Sep 2026
// (docs/prontera-export/data/npcs.jsonl, gitignored -- this script re-reads
// that crawl, it does not fetch anything). Those pages are Zero's own NPC
// list, which is why they carry Nordfeld, a place classic RO has never had.
//
// Each page ships its data as a Nuxt "flat" payload: one array where every
// value inside an object is an INDEX into that same array. So a resolve is
// exactly one hop -- arr[i] -- and what comes back is either a scalar, which
// is the value, or a container whose own members are indices to resolve in
// turn. Resolving a scalar twice is the trap: x: 46 points at 255, and 255
// happens to be a valid index too, so a naive resolver turns a coordinate into
// whatever sits at arr[255]. An earlier read of this file produced exactly
// that -- an NPC whose x was a language object.
//
// What the crawl gives, and what it does not: 241 of the 514 carry a real name
// and at least one quest (Ann, Alibas, Blacksmith Guildsman). The rest are
// sprite-derived labels -- "1 M Innkeeper", "4 Cook" -- for NPCs the source
// has no name for. Both are published, because a nameless innkeeper still
// tells a reader who is standing in that spot, but only the named ones are
// worth a page of their own; hasName marks the difference.
//
// Run:  node scripts/build-npcs.mjs

import fs from 'node:fs';
import path from 'node:path';

const CRAWL = path.join(process.cwd(), 'docs', 'prontera-export', 'data', 'npcs.jsonl');
const SHOPS = path.join(process.cwd(), 'data', 'npc-shops.json');
const SPRITES = path.join(process.cwd(), 'data', 'npc-sprites.json');
const TOWNINFO = path.join(process.cwd(), 'docs', 'client-tables', 'Towninfo.lub');
const QUEST_SPRITES = path.join(process.cwd(), 'data', 'npc-quests.json');
const SPRITE_DIR = path.join(process.cwd(), 'public', 'images', 'npcs');
const DEST = path.join(process.cwd(), 'data', 'npcs.json');
const SOURCE = 'https://roz.prontera.info/npcs';

/**
 * One hop into the flat payload, then interpret what came back.
 *
 * `depth` guards against a payload that points at itself; the real data nests
 * three levels (npc -> quests_given -> quest), so anything deeper is a loop.
 */
function resolver(arr) {
  const hop = (index, depth) => {
    if (depth > 6) return null;
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0 || index >= arr.length) return null;
    const value = arr[index];
    if (value === null || typeof value !== 'object') return value;
    if (Array.isArray(value)) return value.map((member) => hop(member, depth + 1));
    return Object.fromEntries(Object.entries(value).map(([key, member]) => [key, hop(member, depth + 1)]));
  };
  return (index) => hop(index, 0);
}

/** The `{ npc: <index> }` record every NPC page carries. */
function npcFrom(payloadText) {
  const arr = JSON.parse(payloadText);
  const resolve = resolver(arr);
  for (const element of arr) {
    if (element && typeof element === 'object' && !Array.isArray(element) && Object.keys(element).length === 1 && 'npc' in element) {
      return resolve(element.npc);
    }
  }
  return null;
}

/**
 * Is this string a person's name, or something the source put in the name
 * field that is not one?
 *
 * Two kinds of non-name occur. Sprite labels all start with the sprite's
 * leading digit -- "1 M Innkeeper", "4 Cook", "4W M 01", "2 Board1". And 13
 * rows carry a fragment of quest text instead of a name -- "the building",
 * "for me", "that way", "place where we first met" -- every one of them
 * starting lowercase, while every real name and title in this crawl starts
 * with a capital. A third case is caught by the caller: a row whose name is
 * its own map's name is a place, not a person.
 */
function looksLikeAName(name) {
  return /^[A-Z]/.test(name);
}

function main() {
  if (!fs.existsSync(CRAWL)) throw new Error(`${CRAWL} is missing -- this needs the prontera export`);
  const npcs = [];
  const mapNames = {};
  let skipped = 0;
  for (const line of fs.readFileSync(CRAWL, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const page = JSON.parse(line);
    // The listing page itself carries no npc record.
    if (page.slug === 'npcs') continue;
    const npc = npcFrom(page.nuxt_data);
    if (!npc || !npc.slug) {
      skipped += 1;
      continue;
    }
    const map = npc.map ?? {};
    const code = typeof npc.map_navi_code === 'string' ? npc.map_navi_code : null;
    if (code && typeof map.name === 'string') mapNames[code] = map.name;
    const quests = (Array.isArray(npc.quests_given) ? npc.quests_given : [])
      .filter((q) => q && typeof q.name === 'string')
      // The same quest is listed twice on a few pages (Barbe Q shows
      // "Coceracera" for both of its steps).
      .filter((q, i, all) => all.findIndex((other) => other.slug === q.slug) === i)
      .map((q) => ({ slug: q.slug ?? null, name: q.name, type: q.quest_type ?? null }));
    npcs.push({
      slug: npc.slug,
      name: typeof npc.name === 'string' ? npc.name : npc.slug,
      hasName:
        typeof npc.name === 'string' &&
        looksLikeAName(npc.name) &&
        // "East Field of the Goblin Settlement" is where the quest happens,
        // not who you speak to.
        npc.name !== map.name,
      types: Array.isArray(npc.types ?? npc.npc_types) ? (npc.types ?? npc.npc_types).filter((t) => typeof t === 'string') : [],
      map: code,
      mapName: typeof map.name === 'string' ? map.name : null,
      x: Number.isInteger(npc.x) ? npc.x : null,
      y: Number.isInteger(npc.y) ? npc.y : null,
      quests,
      sells: [],
      sprite: null,
      source: 'prontera',
      description: typeof npc.description === 'string' ? npc.description : null,
    });
  }

  // Named first: the index shows people before it shows "1 M Innkeeper", and
  // the first page of a list of 514 should not be all sprite labels.
  // A sprite, for the few we can prove one for. The 84 images under
  // public/images/npcs were mirrored from rozerodb, which has 84 NPC pages;
  // the prontera crawl this file is built from carries no image at all. So a
  // sprite exists only where the two sources describe the same NPC -- same
  // spot, or the same quest. That is 42 of 514, and the honest answer for the
  // rest is no picture rather than someone else's.
  const spriteAt = new Map();
  const spriteForQuest = new Map();
  for (const entry of JSON.parse(fs.readFileSync(QUEST_SPRITES, 'utf8'))) {
    for (const link of entry.links ?? []) {
      spriteAt.set(`${link.map}|${link.x}|${link.y}`, entry.code);
      spriteForQuest.set(link.quest_name.toLowerCase(), entry.code);
    }
  }
  const haveImage = new Map(fs.readdirSync(SPRITE_DIR).map((file) => [file.replace(/\.(gif|png)$/, '').toLowerCase(), file]));
  let sprites = 0;
  for (const npc of npcs) {
    const code =
      spriteAt.get(`${npc.map}|${npc.x}|${npc.y}`) ??
      npc.quests.map((quest) => spriteForQuest.get(quest.name.toLowerCase())).find(Boolean) ??
      null;
    // The file name, extension included: the mirrored quest sprites are GIFs
    // and the ones decoded out of a client GRF are PNGs, so the page cannot
    // assume either.
    // A row the source could not name is named after its sprite ("4 F Kafra3"),
    // so the label itself is the file to look for.
    const fromLabel = npc.hasName ? null : npc.name.trim().replace(/\s+/g, '_').toLowerCase();
    const file =
      (code && haveImage.get(code.toLowerCase())) ?? (fromLabel && haveImage.get(fromLabel)) ?? null;
    npc.sprite = file;
    if (npc.sprite) sprites += 1;
  }

  // The shopkeepers, from data/npc-shops.json. They come from rAthena's
  // classic scripts rather than from Zero's own pages, so they carry
  // source: 'rathena' and every surface that shows one says so. Without them
  // a shop row on an item page has nobody to link to: the two datasets share
  // no name and no coordinate.
  const shopFile = JSON.parse(fs.readFileSync(SHOPS, 'utf8'));
  // Shopkeepers get their picture the other way round: rAthena's script gives
  // the NPC a sprite id, and a client GRF turns that id into a file
  // (scripts/extract-npc-sprites-from-grf.mjs).
  const bySpriteId = fs.existsSync(SPRITES) ? JSON.parse(fs.readFileSync(SPRITES, 'utf8')).bySpriteId ?? {} : {};
  let shopNpcs = 0;
  for (const seller of shopFile.sellers ?? []) {
    const constant = bySpriteId[String(seller.sprite)];
    const shopSprite = constant && haveImage.has(constant) ? haveImage.get(constant) : null;
    if (shopSprite) sprites += 1;
    npcs.push({
      slug: `shop-${seller.slug}`,
      name: seller.name,
      hasName: true,
      types: ['shop'],
      source: 'rathena',
      map: seller.map,
      mapName: mapNames[seller.map] ?? null,
      x: seller.x,
      y: seller.y,
      quests: [],
      sells: seller.sells,
      sprite: shopSprite,
      description: null,
    });
    shopNpcs += 1;
  }

  // The town directory the client itself draws on its town map: Kafra, guides,
  // inns and the dealers, with coordinates. It is the only source we hold that
  // knows where a Kafra stands -- rAthena's shop scripts do not list them, and
  // the Zero crawl is quest NPCs only. Same caveat as the shopkeepers: it is a
  // non-Zero client, so only towns this game has are kept, and a spot we
  // already publish a shopkeeper for is left alone.
  const ROLE_SPRITE_FILES = {
    'Kafra Employee': '4_f_kafra1',
    Guide: '1_m_jobguider',
    Blacksmith: '1_m_smith',
  };
  const TOWN_ROLES = {
    0: 'Tool Dealer',
    1: 'Weapon Dealer',
    2: 'Armor Dealer',
    3: 'Blacksmith',
    4: 'Guide',
    5: 'Inn',
    6: 'Kafra Employee',
  };
  let townNpcs = 0;
  if (fs.existsSync(TOWNINFO)) {
    const townText = fs.readFileSync(TOWNINFO, 'utf8');
    const known = new Set(npcs.map((npc) => npc.map).filter(Boolean));
    const taken = new Set(npcs.filter((npc) => npc.source === 'rathena').map((npc) => `${npc.map}|${npc.x}|${npc.y}`));
    for (const block of townText.matchAll(/(\w+)\s*=\s*\{([\s\S]*?)\n\t\},/g)) {
      const map = block[1];
      if (!known.has(map)) continue;
      for (const row of block[2].matchAll(/name\s*=\s*\[=\[(.*?)\]=\]\s*,\s*X\s*=\s*(\d+)\s*,\s*Y\s*=\s*(\d+)\s*,\s*TYPE\s*=\s*(\d+)/g)) {
        const [, name, x, y, type] = row;
        const role = TOWN_ROLES[Number(type)];
        // An unknown type code is a role this file has and we cannot name; it
        // is skipped rather than published as a number.
        if (!role) continue;
        const place = `${map}|${x}|${y}`;
        if (taken.has(place)) continue;
        taken.add(place);
        // The role's own sprite, not this counter's: the directory lists a job,
        // not a sprite id, so a Kafra page shows a Kafra and claims no more.
        const roleSprite = ROLE_SPRITE_FILES[role] ?? null;
        npcs.push({
          slug: `town-${`${name} ${map} ${x} ${y}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
          name,
          hasName: true,
          types: ['town', role],
          source: 'client',
          map,
          mapName: mapNames[map] ?? null,
          x: Number(x),
          y: Number(y),
          quests: [],
          sells: [],
          sprite: roleSprite && haveImage.has(roleSprite) ? haveImage.get(roleSprite) : null,
          description: null,
        });
        if (roleSprite && haveImage.has(roleSprite)) sprites += 1;
        townNpcs += 1;
      }
    }
  }

  npcs.sort((a, b) => Number(b.hasName) - Number(a.hasName) || a.name.localeCompare(b.name) || a.slug.localeCompare(b.slug));

  // A coordinate that failed to resolve is the failure this parser exists to
  // avoid, so it stops the build rather than shipping a broken /navi.
  const placed = npcs.filter((n) => n.map && n.x !== null && n.y !== null);
  if (placed.length < npcs.length * 0.9) {
    throw new Error(`only ${placed.length} of ${npcs.length} NPCs resolved a place -- the payload shape changed`);
  }

  const withQuests = npcs.filter((n) => n.quests.length > 0);
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          built: new Date().toISOString().slice(0, 10),
          source: SOURCE,
          crawled: '2026-09-03',
          how: 'node scripts/build-npcs.mjs',
          note: 'Zero\'s own NPC list, from the 3 Sep 2026 crawl. Names the source derived from a sprite id are marked hasName: false.',
          npcs: npcs.length,
          named: npcs.filter((n) => n.hasName).length,
          withQuests: withQuests.length,
          questLinks: withQuests.reduce((sum, n) => sum + n.quests.length, 0),
          placed: placed.length,
          pagesWithoutARecord: skipped,
          maps: Object.keys(mapNames).length,
          withSprite: sprites,
          shopNpcs,
          townNpcs,
          shopSource: shopFile._meta?.sources ?? null,
        },
        mapNames,
        npcs,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`${npcs.length} NPCs, ${npcs.filter((n) => n.hasName).length} with a real name, ${withQuests.length} give quests`);
  console.log(`${placed.length} have a map and coordinates, ${Object.keys(mapNames).length} map codes named`);
  console.log(`${sprites} have a sprite, ${shopNpcs} are shopkeepers from rAthena, ${townNpcs} come from the client's town directory`);
  if (skipped > 0) console.log(`${skipped} pages carried no NPC record`);
}

main();

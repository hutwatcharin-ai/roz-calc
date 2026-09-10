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
      description: typeof npc.description === 'string' ? npc.description : null,
    });
  }

  // Named first: the index shows people before it shows "1 M Innkeeper", and
  // the first page of a list of 514 should not be all sprite labels.
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
  if (skipped > 0) console.log(`${skipped} pages carried no NPC record`);
}

main();

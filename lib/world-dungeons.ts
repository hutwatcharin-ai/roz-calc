// Which dungeons open from each world-map tile, and their floors in order,
// worked out from the game's own warp table (data/map-links.json, built by
// scripts/build-map-links.py from the client's navigation data).
//
// Replaces a hand-kept list of 8 dungeons drawn as labels over the atlas: the
// labels sat on top of field tiles and swallowed clicks, and a dungeon listed
// as one code (Pyramids) showed one floor (owner, 22 Sep 2026). Now a tile
// carries a badge and its panel lists every dungeon it opens into, floor by
// floor.
//
// Rules, all pure so they can be tested without the database:
// - Channel copies fold into the floor they are built on (pry_d01_z and
//   pry_d01_a are Pyramid 1F); the channels stay listed on that floor.
// - A dungeon floor is a map we have monsters for that is neither an atlas
//   tile nor a field; a field off the atlas is not a dungeon of its neighbour.
// - The way in may pass through up to three maps with no monsters of their
//   own -- a town, a ruin, a tower lobby (Geffen -> Geffen Tower -> Geffen
//   Dungeon) -- but only by walking. A warp NPC counts only straight off the
//   tile, straight into the dungeon, or into a dead-end lobby (Izlude's
//   boatman to the Byalan dock): town warp NPCs reach other towns, and
//   through them every dungeon in the game would open from every field.
//   The entrance shown is the last portal, the one into the dungeon.
// - Floors are listed in code order, the game's own numbering.

/** kind 200 is a portal you walk through, 201 a warp NPC (a guard, a boatman). */
export type MapLink = [from: string, x: number, y: number, to: string, kind: number];
export interface MapLinksFile {
  links: MapLink[];
  channelOf: Record<string, string>;
}

export interface DungeonFloor {
  code: string;
  depth: number;
  /** Channel copies of this floor (_a / _b / _z) that exist on the site. */
  channels: string[];
}

export interface TileDungeon {
  /** First floor's code; stable key. */
  key: string;
  floors: DungeonFloor[];
  /** The portal into the first floor: map and cell, for a /navi line. */
  entrance: { map: string; x: number; y: number };
  /**
   * Maps walked through between the tile and the first floor, in order
   * (a town, a dock, a tower lobby). Empty when the tile opens straight in.
   */
  via: string[];
}

const FIELD = /fild|_f\d/i;
// Tiles you can walk out of into a town. A tile that is itself a dungeon floor
// (a guild dungeon, a Clock Tower basement) only counts its direct warps:
// otherwise its exit to town hands it that town's dungeons too.
const OPEN_TILE = /fild|_f\d|mjolnir/i;
const MAX_PASSAGE = 3;

export function dungeonsByTile(
  file: MapLinksFile,
  tiles: Set<string>,
  mapsWithMonsters: Set<string>,
  canonical: (code: string) => string = (code) => code,
): Map<string, TileDungeon[]> {
  // Floors fold channels first, then whatever the site's own channel rule says.
  const fold = (code: string) => canonical(file.channelOf[code] ?? code);
  const floorsOnSite = new Set<string>();
  const channelsOf = new Map<string, Set<string>>();
  for (const code of mapsWithMonsters) {
    const floor = fold(code);
    floorsOnSite.add(floor);
    if (floor !== code) {
      if (!channelsOf.has(floor)) channelsOf.set(floor, new Set());
      channelsOf.get(floor)!.add(code);
    }
  }
  const isTile = (code: string) => tiles.has(code);
  const isFloor = (code: string) => floorsOnSite.has(code) && !isTile(code) && !FIELD.test(code);
  const isPassage = (code: string) => !isTile(code) && !floorsOnSite.has(code);

  const next = new Map<string, { to: string; x: number; y: number; walk: boolean }[]>();
  for (const [rawFrom, x, y, rawTo, kind] of file.links) {
    const from = fold(rawFrom);
    const to = fold(rawTo);
    if (from === to) continue;
    if (!next.has(from)) next.set(from, []);
    next.get(from)!.push({ to, x, y, walk: kind === 200 });
  }
  const isLobby = (code: string) => isPassage(code) && !(next.get(code) ?? []).some((edge) => isTile(edge.to));

  const result = new Map<string, TileDungeon[]>();
  for (const tile of tiles) {
    // Walk out through passage maps, noting each portal into a floor.
    const starts = new Map<string, { map: string; x: number; y: number }>();
    const visited = new Set<string>([tile]);
    const cameFrom = new Map<string, string>();
    let frontier = [tile];
    for (let hop = 0; hop <= MAX_PASSAGE && frontier.length; hop++) {
      const nextFrontier: string[] = [];
      for (const at of frontier) {
        for (const edge of next.get(at) ?? []) {
          if (isFloor(edge.to)) {
            if (!starts.has(edge.to)) starts.set(edge.to, { map: at, x: edge.x, y: edge.y });
          } else if (isPassage(edge.to) && !visited.has(edge.to) && (edge.walk || at === tile || isLobby(edge.to)) && OPEN_TILE.test(tile)) {
            visited.add(edge.to);
            cameFrom.set(edge.to, at);
            nextFrontier.push(edge.to);
          }
        }
      }
      frontier = nextFrontier;
    }

    const seen = new Set<string>();
    const dungeons: TileDungeon[] = [];
    for (const [start, entrance] of [...starts].sort((a, b) => a[0].localeCompare(b[0]))) {
      if (seen.has(start)) continue;
      // Floors connect through a lobby now and then (Pyramid 1F -> moc_prydb1
      // -> Pyramid B1). A monster-less map counts as a lobby only if it has
      // no warp onto an atlas tile; a town or a ruin that opens onto a field
      // would lead the walk out into every other dungeon.
      const depth = new Map<string, number>([[start, 1]]);
      const queue = [start];
      const lobbies = new Set<string>();
      while (queue.length) {
        const code = queue.shift()!;
        for (const edge of next.get(code) ?? []) {
          if (isFloor(edge.to) && !depth.has(edge.to)) {
            depth.set(edge.to, depth.get(code)! + 1);
            queue.push(edge.to);
          } else if (isLobby(edge.to) && !lobbies.has(edge.to) && isFloor(code)) {
            lobbies.add(edge.to);
            depth.set(edge.to, depth.get(code)!);
            queue.push(edge.to);
          }
        }
      }
      for (const lobby of lobbies) depth.delete(lobby);
      for (const code of depth.keys()) seen.add(code);
      const floors = [...depth]
        .map(([code, d]) => ({ code, depth: d, channels: [...(channelsOf.get(code) ?? [])].sort() }))
        // Listed in code order (moc_pryd01..06), which is how the game numbers
        // floors; warp distance would put a basement between 1F and 3F.
        .sort((a, b) => a.code.localeCompare(b.code, 'en', { numeric: true }));
      const via: string[] = [];
      for (let at = entrance.map; at !== tile && at; at = cameFrom.get(at)!) via.unshift(at);
      dungeons.push({ key: floors[0].code, floors, entrance, via });
    }
    if (dungeons.length) result.set(tile, dungeons);
  }
  return result;
}

/** "Pyramid 3F" -> "Pyramid": the dungeon's name from its first floor's. */
export function dungeonName(floorName: string): string {
  return floorName
    .replace(/\s*[-–]?\s*(B?\d+F|\d+(st|nd|rd|th)?\s*Floor|Level\s*\d+|Lv\.?\s*\d+|\d+)\s*$/i, '')
    .trim() || floorName;
}

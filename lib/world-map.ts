import layout from '@/data/world-map-layout.json';

export interface WorldMapMonster {
  id: number;
  nameEn: string;
  level: number;
  imageUrl: string | null;
  isAggressive: boolean;
}

export interface WorldMapEntry {
  key: string;
  mapCode: string;
  mapCodes: string[];
  nameEn: string;
  regionId: string;
  kind: 'tile' | 'dungeon';
  x: number;
  y: number;
  width: number;
  height: number;
  parentX?: number;
  parentY?: number;
  monsters: WorldMapMonster[];
  minLevel: number | null;
  maxLevel: number | null;
  aggressiveCount: number;
  /** Map picture for the hover card and the panel; absent when none is mirrored. */
  image?: string | null;
  /** Dungeons that open from this tile (lib/world-dungeons), floor by floor. */
  dungeons?: WorldDungeon[];
  /** Grid view only: what the cell is, and for a floor, its dungeon. */
  cellKind?: 'field' | 'town' | 'floor' | 'passage';
  dungeonKey?: string;
  dungeonName?: string;
  /** Grid view: how to get there, when the warp table cannot say (Nordfeld). */
  note?: string;
}

export interface WorldDungeonFloor {
  code: string;
  name: string;
  image: string | null;
  minLevel: number | null;
  maxLevel: number | null;
  monsters: WorldMapMonster[];
  /** Set when the floor is not open yet (lib/map-availability), as display text. */
  closed: string | null;
}

export interface WorldDungeon {
  key: string;
  name: string;
  entrance: { map: string; x: number; y: number };
  floors: WorldDungeonFloor[];
}

export interface WorldMapRegion {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
}

export interface WorldMapSpawnRow {
  map_code: string;
  map_display_name: string | null;
  monsters: {
    id: number;
    name_en: string;
    level: number;
    image_url: string | null;
    is_aggressive: boolean | null;
  } | null;
}

type RawTile = { x: number; y: number; region: string; w: number; h: number };

export const WORLD_MAP_REGIONS: WorldMapRegion[] = Object.entries(layout.regions).map(([id, region]) => ({ id, ...region }));

const rawTiles = layout.tiles as Record<string, RawTile>;

// Atlas tiles only. Dungeons are no longer drawn on the atlas: they hang off
// the tile they open from (lib/world-dungeons), found from the game's warps.
// The layout also placed some dungeon floors as tiles (Prontera Sewer, Ant
// Hell, Byalan...), on top of the fields around them. Those now reach the
// atlas the same way every other dungeon does, through their entrance tile.
export const WORLD_TILE_PATTERN = /fild|_f\d|mjolnir/i;
const atlasTiles = Object.fromEntries(Object.entries(rawTiles).filter(([code]) => WORLD_TILE_PATTERN.test(code)));
export const WORLD_MAP_CODES = Object.keys(atlasTiles);

export function monstersFor(codes: string[], rows: WorldMapSpawnRow[]): WorldMapMonster[] {
  const unique = new Map<number, WorldMapMonster>();
  for (const row of rows) {
    if (!codes.includes(row.map_code) || !row.monsters) continue;
    unique.set(row.monsters.id, {
      id: row.monsters.id,
      nameEn: row.monsters.name_en,
      level: row.monsters.level,
      imageUrl: row.monsters.image_url,
      isAggressive: Boolean(row.monsters.is_aggressive),
    });
  }
  return [...unique.values()].sort((a, b) => a.level - b.level || a.nameEn.localeCompare(b.nameEn));
}

export function stats(monsters: WorldMapMonster[]) {
  return {
    monsters,
    minLevel: monsters.length ? Math.min(...monsters.map((monster) => monster.level)) : null,
    maxLevel: monsters.length ? Math.max(...monsters.map((monster) => monster.level)) : null,
    aggressiveCount: monsters.filter((monster) => monster.isAggressive).length,
  };
}

export function buildWorldMapEntries(rows: WorldMapSpawnRow[]) {
  const tiles: WorldMapEntry[] = Object.entries(atlasTiles).map(([mapCode, tile]) => {
    const mapRows = rows.filter((row) => row.map_code === mapCode);
    const monsters = monstersFor([mapCode], mapRows);
    return {
      key: mapCode,
      mapCode,
      mapCodes: [mapCode],
      nameEn: mapRows.find((row) => row.map_display_name)?.map_display_name ?? mapCode,
      regionId: tile.region,
      kind: 'tile',
      x: tile.x,
      y: tile.y,
      width: tile.w,
      height: tile.h,
      ...stats(monsters),
    };
  });

  const dungeons: WorldMapEntry[] = [];

  return { tiles, dungeons };
}

export function searchWorldMap(entries: WorldMapEntry[], query: string): string[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return entries.map((entry) => entry.key);
  return entries
    // Dungeon names and floor codes count too, so "pyramid" finds the tile
    // the Pyramids open from.
    .filter((entry) => [entry.nameEn, ...entry.mapCodes, ...entry.monsters.map((monster) => monster.nameEn),
      ...(entry.dungeons ?? []).flatMap((d) => [d.name, ...d.floors.map((f) => f.code)])]
      .some((value) => value.toLocaleLowerCase().includes(needle)))
    .map((entry) => entry.key);
}

export function regionBounds(regionId: string, entries: WorldMapEntry[]) {
  const points = entries.filter((entry) => entry.kind === 'tile' && entry.regionId === regionId);
  if (!points.length) {
    const region = WORLD_MAP_REGIONS.find((item) => item.id === regionId);
    if (!region) return null;
    // Alberta is a city label on this atlas but has no dedicated field tile.
    return { x: region.x - 40, y: region.y - 40, width: 80, height: 80 };
  }
  const left = Math.min(...points.map((entry) => entry.x - entry.width / 2));
  const top = Math.min(...points.map((entry) => entry.y - entry.height / 2));
  const right = Math.max(...points.map((entry) => entry.x + entry.width / 2));
  const bottom = Math.max(...points.map((entry) => entry.y + entry.height / 2));
  return { x: left, y: top, width: right - left, height: bottom - top };
}

export function validateWorldMapLayout() {
  const errors: string[] = [];
  const regionIds = new Set(WORLD_MAP_REGIONS.map((region) => region.id));
  if (Object.keys(rawTiles).length !== 102) errors.push(`expected 102 tiles, got ${Object.keys(rawTiles).length}`);
  for (const [code, tile] of Object.entries(rawTiles)) {
    if (!regionIds.has(tile.region)) errors.push(`${code}: unknown region ${tile.region}`);
    if (tile.x - tile.w / 2 < 0 || tile.y - tile.h / 2 < 0 || tile.x + tile.w / 2 > 1280 || tile.y + tile.h / 2 > 1024) errors.push(`${code}: outside atlas`);
  }
  return errors;
}

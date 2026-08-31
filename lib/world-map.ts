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
type RawDungeon = { slug: string; name: string; parent: string; parentX: number; parentY: number; x: number; y: number };

export const WORLD_MAP_REGIONS: WorldMapRegion[] = Object.entries(layout.regions).map(([id, region]) => ({ id, ...region }));

const rawTiles = layout.tiles as Record<string, RawTile>;
const rawDungeons = layout.dungeons as RawDungeon[];

export const DUNGEON_MAP_CODES: Record<string, string[]> = {
  gef_dun00: ['gef_dun00', 'gef_dun01', 'gef_dun02', 'gef_dun03'],
  orcsdun01: ['orcsdun01', 'orcsdun02'],
  c_tower1: ['c_tower1', 'c_tower2', 'c_tower3', 'c_tower4'],
  prt_maze01: ['prt_maze01', 'prt_maze02', 'prt_maze03'],
  mjo_dun01: ['mjo_dun01', 'mjo_dun02', 'mjo_dun03'],
  in_sphinx1: ['in_sphinx1', 'in_sphinx2', 'in_sphinx3', 'in_sphinx4', 'in_sphinx5'],
  moc_pryd01: ['moc_pryd01', 'moc_pryd02', 'moc_pryd03', 'moc_pryd04', 'moc_pryd05', 'moc_pryd06'],
  pay_dun00: ['pay_dun00', 'pay_dun01', 'pay_dun02', 'pay_dun03', 'pay_dun04'],
};

export const WORLD_MAP_CODES = [...new Set([
  ...Object.keys(rawTiles),
  ...Object.values(DUNGEON_MAP_CODES).flat(),
])];

function monstersFor(codes: string[], rows: WorldMapSpawnRow[]): WorldMapMonster[] {
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

function stats(monsters: WorldMapMonster[]) {
  return {
    monsters,
    minLevel: monsters.length ? Math.min(...monsters.map((monster) => monster.level)) : null,
    maxLevel: monsters.length ? Math.max(...monsters.map((monster) => monster.level)) : null,
    aggressiveCount: monsters.filter((monster) => monster.isAggressive).length,
  };
}

export function buildWorldMapEntries(rows: WorldMapSpawnRow[]) {
  const tiles: WorldMapEntry[] = Object.entries(rawTiles).map(([mapCode, tile]) => {
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

  const dungeons: WorldMapEntry[] = rawDungeons.map((dungeon) => {
    const mapCodes = DUNGEON_MAP_CODES[dungeon.slug] ?? [dungeon.slug];
    return {
      key: dungeon.slug,
      mapCode: dungeon.slug,
      mapCodes,
      nameEn: dungeon.name,
      regionId: rawTiles[dungeon.parent]?.region ?? dungeon.parent,
      kind: 'dungeon',
      x: dungeon.x,
      y: dungeon.y,
      width: 1,
      height: 1,
      parentX: dungeon.parentX,
      parentY: dungeon.parentY,
      ...stats(monstersFor(mapCodes, rows)),
    };
  });

  return { tiles, dungeons };
}

export function searchWorldMap(entries: WorldMapEntry[], query: string): string[] {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return entries.map((entry) => entry.key);
  return entries
    .filter((entry) => [entry.nameEn, ...entry.mapCodes, ...entry.monsters.map((monster) => monster.nameEn)]
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

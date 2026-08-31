export type MapKind = 'city' | 'dungeon' | 'field' | 'special';

export interface MapRegion {
  slug: string;
  nameEn: string;
  nameTh?: string;
  kind: MapKind;
  x: number;
  y: number;
  width: number;
  height: number;
  hasKafra: boolean;
  mapCodes: string[];
  monsterNames: string[];
  monsterCount: number;
  minLevel: number | null;
  maxLevel: number | null;
  aggressiveCount: number;
}

export interface RegionSeed {
  slug: string;
  nameEn: string;
  nameTh?: string;
  kind: MapKind;
  x: number;
  y: number;
  width: number;
  height: number;
  hasKafra?: boolean;
  mapCodes: string[];
}

export interface SpawnRow {
  map_code: string;
  monsters: { name_en: string; level: number; is_aggressive: boolean | null } | null;
}

export function buildMapRegions(seeds: RegionSeed[], spawns: SpawnRow[]): MapRegion[] {
  return seeds.map((seed) => {
    const rows = spawns.filter((row) => seed.mapCodes.includes(row.map_code) && row.monsters);
    const monsters = rows.flatMap((row) => row.monsters ? [row.monsters] : []);
    const levels = monsters.map((monster) => monster.level).filter((level) => Number.isFinite(level));
    return {
      ...seed,
      hasKafra: seed.hasKafra ?? false,
      monsterNames: [...new Set(monsters.map((monster) => monster.name_en))],
      monsterCount: monsters.length,
      minLevel: levels.length ? Math.min(...levels) : null,
      maxLevel: levels.length ? Math.max(...levels) : null,
      aggressiveCount: new Set(rows.filter((row) => row.monsters?.is_aggressive).map((row) => row.monsters?.name_en)).size,
    };
  });
}

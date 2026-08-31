import { describe, expect, it } from 'vitest';
import { buildWorldMapEntries, regionBounds, searchWorldMap, validateWorldMapLayout, WORLD_MAP_REGIONS } from './world-map';

describe('world map layout', () => {
  it('contains 102 valid atlas tiles', () => expect(validateWorldMapLayout()).toEqual([]));
  it('has a non-empty bounding box for every region', () => {
    const { tiles } = buildWorldMapEntries([]);
    for (const region of WORLD_MAP_REGIONS) expect(regionBounds(region.id, tiles)).not.toBeNull();
  });
});

describe('world map entries', () => {
  const rows = [
    { map_code: 'prt_fild00', map_display_name: 'Prontera Field', monsters: { id: 1002, name_en: 'Poring', level: 1, image_url: '/images/monsters/1002.gif', is_aggressive: false } },
    { map_code: 'prt_fild00', map_display_name: 'Prontera Field', monsters: { id: 1005, name_en: 'Familiar', level: 8, image_url: '/images/monsters/1005.gif', is_aggressive: true } },
  ];
  it('aggregates English name, monster icons, level range, and aggression per tile', () => {
    const { tiles } = buildWorldMapEntries(rows);
    const tile = tiles.find((entry) => entry.mapCode === 'prt_fild00');
    expect(tile).toMatchObject({ nameEn: 'Prontera Field', minLevel: 1, maxLevel: 8, aggressiveCount: 1 });
    expect(tile?.monsters.map((monster) => monster.nameEn)).toEqual(['Poring', 'Familiar']);
  });
  it('searches by map id, English name, and monster', () => {
    const entries = buildWorldMapEntries(rows).tiles;
    expect(searchWorldMap(entries, 'prt_fild00')).toContain('prt_fild00');
    expect(searchWorldMap(entries, 'Prontera Field')).toContain('prt_fild00');
    expect(searchWorldMap(entries, 'Familiar')).toContain('prt_fild00');
  });
});

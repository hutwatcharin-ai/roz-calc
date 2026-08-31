import { describe, expect, it } from 'vitest';
import { buildMapRegions, type RegionSeed } from './map-regions';

const seed: RegionSeed = { slug: 'city', nameEn: 'City', kind: 'city', x: 1, y: 2, width: 44, height: 44, mapCodes: ['city', 'field'] };

describe('buildMapRegions', () => {
  it('keeps a city with no monsters and represents its level as null', () => {
    const [region] = buildMapRegions([seed], []);
    expect(region).toMatchObject({ monsterCount: 0, minLevel: null, maxLevel: null, aggressiveCount: 0 });
  });
  it('aggregates levels, names, and unique aggressive monsters across maps', () => {
    const [region] = buildMapRegions([seed], [
      { map_code: 'field', monsters: { name_en: 'Poring', level: 1, is_aggressive: false } },
      { map_code: 'field', monsters: { name_en: 'Hunter Fly', level: 42, is_aggressive: true } },
      { map_code: 'city', monsters: { name_en: 'Hunter Fly', level: 42, is_aggressive: true } },
    ]);
    expect(region.minLevel).toBe(1);
    expect(region.maxLevel).toBe(42);
    expect(region.aggressiveCount).toBe(1);
    expect(region.monsterNames).toEqual(['Poring', 'Hunter Fly']);
  });
});

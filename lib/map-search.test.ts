import { describe, expect, it } from 'vitest';
import { searchMapRegions } from './map-search';
import type { MapRegion } from './map-regions';

const regions = [{ slug: 'payon-cave', nameEn: 'Payon Cave', nameTh: 'ถ้ำพะยอน', kind: 'dungeon', x: 0, y: 0, width: 44, height: 44, hasKafra: false, mapCodes: ['pay_dun00'], monsterNames: ['Skeleton'], monsterCount: 1, minLevel: 12, maxLevel: 12, aggressiveCount: 0 }] as MapRegion[];

describe('searchMapRegions', () => {
  it('searches by map code, monster, and Thai name', () => {
    expect(searchMapRegions(regions, 'pay_dun')).toEqual(['payon-cave']);
    expect(searchMapRegions(regions, 'skeleton')).toEqual(['payon-cave']);
    expect(searchMapRegions(regions, 'พะยอน')).toEqual(['payon-cave']);
  });
  it('returns no result for an unknown query', () => expect(searchMapRegions(regions, 'clock tower')).toEqual([]));
});

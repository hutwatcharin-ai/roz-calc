import type { MapRegion } from './map-regions';

function normalise(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function searchMapRegions(regions: MapRegion[], query: string): string[] {
  const needle = normalise(query);
  if (!needle) return regions.map((region) => region.slug);
  return regions
    .filter((region) => [region.nameEn, region.nameTh ?? '', ...region.mapCodes, ...region.monsterNames]
      .some((value) => normalise(value).includes(needle)))
    .map((region) => region.slug);
}

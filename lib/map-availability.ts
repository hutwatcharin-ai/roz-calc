// Which maps are not open on the Global server yet. Built by
// scripts/build-map-availability.mjs from the publisher's roadmap and
// rozerodb's UPCOMING banners; a map is closed if either source says so.
//
// Only closed maps are stored, so null means "nothing says it is closed",
// never "confirmed open".

import file from '@/data/map-availability.json';

export interface MapRelease {
  /** The patch month a source names, e.g. "OCT 2026". */
  when: string;
  area: string;
  sources: string[];
}

const maps = (file as { maps: Record<string, MapRelease> }).maps;

export function mapRelease(code: string): MapRelease | null {
  return maps[code] ?? null;
}

export const CLOSED_MAP_COUNT = Object.keys(maps).length;

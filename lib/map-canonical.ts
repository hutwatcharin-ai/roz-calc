// Which map code owns the page, computed from the data rather than stored.
//
// The grouping rule is in lib/map-variants.ts and keys on the monster set, so
// it cannot go stale against an import: the day a channel stops matching its
// siblings it gets its own page again, without anyone editing a list.
//
// cache() so the three callers on one request -- the list page, a detail page
// and the sitemap -- pay for the two queries once.

import * as React from 'react';
import { supabaseBrowser } from './supabase';
import { fetchAllRows } from './fetch-all-rows';
import { canonicalByCode, groupMapVariants, type MapGroup, type MapRow } from './map-variants';

export interface MapCanonical {
  groups: MapGroup[];
  /** variant code -> canonical code. A code absent from this map is canonical. */
  byCode: Record<string, string>;
  /** canonical code -> the other channels folded into it. */
  variantsOf: Map<string, string[]>;
  failed: boolean;
}

// react's cache() only exists in the server-component runtime; under vitest
// the import is undefined and calling it throws before a single test runs.
// Dedupe where it is available, plain function where it is not.
const dedupe =
  (React as unknown as { cache?: <T extends (...args: never[]) => unknown>(fn: T) => T }).cache ??
  (<T extends (...args: never[]) => unknown>(fn: T) => fn);

export const getMapCanonical = dedupe(async (): Promise<MapCanonical> => {
  const db = supabaseBrowser();

  const { data: maps, error: mapsError } = await fetchAllRows<MapRow>((from, to) =>
    db.from('map_stats').select('map_code, map_display_name').order('map_code').range(from, to),
  );
  const { data: spawns, error: spawnsError } = await fetchAllRows<{ map_code: string; monster_id: number; amount: number | null }>(
    (from, to) => db.from('monster_spawns').select('map_code, monster_id, amount').order('map_code').order('monster_id').range(from, to),
  );

  // A failed read must not fold every map into one group (an empty monster set
  // for everything would do exactly that). It reports failure and every map
  // keeps its own page.
  if (mapsError || spawnsError) {
    console.error('map canonical query failed', mapsError ?? spawnsError);
    return { groups: [], byCode: {}, variantsOf: new Map(), failed: true };
  }

  // Monster -> spawn count per map: the counts are what tell a channel copy
  // under another name (iz_d02_a) from a different floor (lib/map-variants).
  const monstersByMap = new Map<string, Map<number, number>>();
  for (const spawn of spawns ?? []) {
    const counts = monstersByMap.get(spawn.map_code) ?? new Map<number, number>();
    counts.set(spawn.monster_id, (counts.get(spawn.monster_id) ?? 0) + (spawn.amount ?? 0));
    monstersByMap.set(spawn.map_code, counts);
  }

  const groups = groupMapVariants(maps ?? [], monstersByMap);
  return {
    groups,
    byCode: canonicalByCode(groups),
    variantsOf: new Map(groups.map((g) => [g.canonical, g.variants])),
    failed: false,
  };
});

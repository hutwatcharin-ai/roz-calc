// Towns: a page at /database/maps/<code> although nothing spawns there
// (owner, 6 Oct 2026: "the main town maps like Geffen have no page"). The
// map route served only maps with monsters, so the world map's own town
// links -- /database/maps/geffen -- were 404s.
//
// What a town page shows is what the site already holds about the place:
// the client minimap with its warps (lib/map-warps), the NPCs standing in the
// town and in the buildings its doors lead to (lib/npcs), and its quests.

import file from '@/data/towns.json';
import { mapWarps, warpMapName } from '@/lib/map-warps';
import { ALL_NPCS, type Npc } from '@/lib/npcs';

export interface Town {
  code: string;
  nameEn: string;
  /** Only where the site already uses a Thai name; null otherwise. */
  nameTh: string | null;
}

export const TOWNS: Town[] = (file as { towns: { code: string; nameEn: string; nameTh?: string }[] }).towns.map((t) => ({
  code: t.code,
  nameEn: t.nameEn,
  nameTh: t.nameTh ?? null,
}));

const byCode = new Map(TOWNS.map((t) => [t.code, t]));

export function townByCode(code: string): Town | null {
  return byCode.get(code) ?? null;
}

export interface TownPlace {
  code: string;
  name: string;
  npcs: Npc[];
}

/**
 * The town's NPCs: the street first, then each building a warp of the town
 * leads into (prt_in, geffen_in), in the order the warp list names them. A
 * destination with a page of its own is a field or another town, not a
 * building, and is left out; so is a building nobody named stands in.
 */
export function townPlaces(code: string): TownPlace[] {
  const named = (map: string) => ALL_NPCS.filter((npc) => npc.map === map && npc.hasName);
  const places: TownPlace[] = [{ code, name: '', npcs: named(code) }];
  const warps = mapWarps(code);
  const seen = new Set([code]);
  for (const exit of [...(warps?.exits ?? []), ...(warps?.doors ?? [])]) {
    if (exit.page || seen.has(exit.to)) continue;
    seen.add(exit.to);
    const npcs = named(exit.to);
    if (npcs.length > 0) places.push({ code: exit.to, name: warpMapName(exit.to), npcs });
  }
  return places;
}

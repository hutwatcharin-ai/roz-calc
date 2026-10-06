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
  /** 'passage': a map walked through on the way into a dungeon (a dock, a
   *  lobby, a castle hall) -- the round cells of the world map grid. */
  kind: 'town' | 'passage';
  code: string;
  nameEn: string;
  /** Only where the site already uses a Thai name; null otherwise. */
  nameTh: string | null;
}

type Row = { code: string; nameEn: string; nameTh?: string };
const raw = file as { towns: Row[]; passages: Row[] };
const read = (kind: Town['kind']) => (t: Row): Town => ({ kind, code: t.code, nameEn: t.nameEn, nameTh: t.nameTh ?? null });

export const TOWNS: Town[] = raw.towns.map(read('town'));
export const PASSAGES: Town[] = raw.passages.map(read('passage'));

const byCode = new Map([...TOWNS, ...PASSAGES].map((t) => [t.code, t]));

/** A town or a passage map: a place with a page and no monsters. */
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

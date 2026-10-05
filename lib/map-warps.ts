// Warp points on a map page (owner, 5 Oct 2026: "show the warps that connect
// the maps"). Data from scripts/build-map-warps.py: every walkable warp in
// the client's navigation table, the map's size in cells, and which minimap
// to draw them on.
//
// Placing a warp: the client's minimap is 512 px square with the map scaled
// to fit its long side and centred, and RO counts cell rows from the bottom.

import file from '@/data/map-warps.json';

export interface WarpExit {
  to: string;
  /** 200 a portal you walk through, 201 a warp NPC (a guard, a boatman). */
  kind: number;
  pts: [number, number][];
  /** The map code /navi knows this warp by. */
  navi: string;
  /** Whether the destination has a page on this site. */
  page: boolean;
}

interface WarpMap {
  w: number;
  h: number;
  pic: string;
  exits: WarpExit[];
  from: [string, boolean][];
}

const data = file as unknown as { maps: Record<string, WarpMap>; names: Record<string, string> };

/** Exits with this many cells to the same place are building doors: drawn small, listed once. */
export const DOOR_MIN = 3;

/** Where cell (x, y) falls on the minimap, in percent of its width and height. */
export function warpPosition(x: number, y: number, w: number, h: number): { left: number; top: number } {
  const scale = 512 / Math.max(w, h);
  const offX = (512 - w * scale) / 2;
  const offY = (512 - h * scale) / 2;
  return {
    left: ((x + 0.5) * scale + offX) / 5.12,
    top: ((h - y - 0.5) * scale + offY) / 5.12,
  };
}

/** The game's own English name for a map, or its code when the client has none. */
export function warpMapName(code: string): string {
  return data.names[code] ?? code;
}

export interface MapWarps {
  picture: string;
  w: number;
  h: number;
  /** Numbered on the minimap, in list order. */
  exits: WarpExit[];
  /** Many-door destinations (Prontera's houses), small marks without numbers. */
  doors: WarpExit[];
  from: { code: string; page: boolean }[];
}

export function mapWarps(code: string): MapWarps | null {
  const m = data.maps[code];
  if (!m) return null;
  const byName = (a: WarpExit, b: WarpExit) => warpMapName(a.to).localeCompare(warpMapName(b.to));
  return {
    picture: `/images/maps/navi/${m.pic}.webp`,
    w: m.w,
    h: m.h,
    exits: m.exits.filter((e) => e.pts.length < DOOR_MIN).sort(byName),
    doors: m.exits.filter((e) => e.pts.length >= DOOR_MIN).sort(byName),
    from: m.from.map(([c, page]) => ({ code: c, page })),
  };
}

// Two guides mirrored from roz-global.info and joined to our own tables.
//
// Both answer questions no table here can: an egg's stat bonus is not in the
// item description, and nothing here stores an NPC's coordinates. Where our
// data does overlap -- the egg item, the taming item, the monster that drops
// it -- the ids are resolved so the page links instead of just naming.
//
// Built by scripts/build-rozglobal-guides.mjs, which also reports how much of
// the guide our own tables could confirm.

import file from '@/data/rozglobal-guides.json';

export interface QpetSource {
  monster: string;
  rate: number;
  monsterId: number | null;
}

export interface Qpet {
  pet: string;
  /** What the pet gives at loyalty level 1 and 2, as the guide states them. */
  level1: string;
  level2: string;
  taming: string;
  sources: QpetSource[];
  eggId: number | null;
  tamingId: number | null;
}

export interface JobChangeNpc {
  job: string;
  place: string;
  /** The map code the /navi command uses. */
  map: string | null;
  x: number | null;
  y: number | null;
  requirement: string | null;
}

export interface QpetTown {
  town: string;
  map: string | null;
  x: number | null;
  y: number | null;
}

export interface CraftMaterial {
  item: string;
  amount: number;
  /** Null when the name does not match anything in our items table, or when
   *  the "material" is Zeny. The page prints it as plain text rather than
   *  guessing which item was meant. */
  itemId: number | null;
}

export interface Cosmetic {
  item: string;
  map: string | null;
  x: number | null;
  y: number | null;
  materials: CraftMaterial[];
  itemId: number | null;
}

type Raw = {
  _meta: Record<string, string>;
  qpetTowns: QpetTown[];
  qpets: Qpet[];
  cosmetics: Cosmetic[];
  jobChange: JobChangeNpc[];
};

export const rozglobalGuides = file as unknown as Raw;

/** The in-game command a player pastes into chat to walk there. */
export function naviCommand(map: string | null, x: number | null, y: number | null): string | null {
  if (!map || x === null || y === null) return null;
  return `/navi ${map} ${x}/${y}`;
}

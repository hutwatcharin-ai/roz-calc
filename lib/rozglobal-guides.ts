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
import { formerNames } from '@/lib/former-names';

const squash = (text: string): string => text.toLowerCase().replace(/[^a-z0-9]/g, '');

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

/**
 * The guide entry for an egg, matched on more than the egg's own name.
 *
 * Two of the 28 eggs missed a plain name match, and neither was missing data:
 *
 *   "Drops Egg" -- the guide files that pet as "Drop" but names its source
 *     monster "Drops", so the monster name bridges the two.
 *   "Savage Babe Egg" -- monster 1167 was renamed Savage Babe -> Savage Bebe
 *     on 7 Sep 2026 on the evidence of its own card. The guide uses the new
 *     spelling; the egg ITEM still carries the old one.
 *
 * So the lookup tries the pet's name, then the monster the guide says drops
 * its taming item, then that monster's recorded former names. Each step is a
 * fact already written down somewhere -- none of it is near-spelling guessing.
 */
export function qpetFor(petName: string): Qpet | null {
  const wanted = squash(petName);
  const pets = rozglobalGuides.qpets;
  const direct = pets.find((pet) => squash(pet.pet) === wanted);
  if (direct) return direct;
  return (
    pets.find((pet) =>
      pet.sources.some(
        (source) =>
          squash(source.monster) === wanted ||
          (source.monsterId !== null && formerNames(source.monsterId).some((old) => squash(old.name) === wanted)),
      ),
    ) ?? null
  );
}

/** The in-game command a player pastes into chat to walk there. */
export function naviCommand(map: string | null, x: number | null, y: number | null): string | null {
  if (!map || x === null || y === null) return null;
  return `/navi ${map} ${x}/${y}`;
}

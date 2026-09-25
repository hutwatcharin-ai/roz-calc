// Behaviour flags the monsters table has no column for -- see
// scripts/build-monster-modes.mjs for where they come from and what
// known:false means.

import file from '@/data/monster-modes.json';

export type MonsterModes = { known: true; canMove: boolean; mini: boolean } | { known: false };

const MODES = (file as unknown as { modes: Record<string, MonsterModes> }).modes;

/** null when the id is not in the export at all (e.g. a Nordfeld row). */
export function monsterModes(id: number): MonsterModes | null {
  return MODES[String(id)] ?? null;
}

// The list of monsters a player is planning to farm (spec 3.6).
//
// Only ids are stored. Keeping a copy of each monster's HP and EXP in the
// browser would mean a plan saved today quietly disagreeing with the database
// after the next import -- the planner page reads the live rows instead, so a
// saved plan is a list of pointers, never a snapshot of numbers.
//
// No React and no browser globals here, so these run under plain vitest.

export const FARM_PLAN_STORAGE_KEY = 'roz-calc:farm-plan';

// Enough for any real plan and small enough that a corrupted or hostile value
// cannot make the planner page fetch thousands of rows.
export const MAX_PLAN_SIZE = 50;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isMonsterId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

// Validates rather than casts, for the same reason character-context does: a
// stored payload can be stale, hand-edited, or written by a different app on
// the same origin.
export function parseFarmPlan(raw: string | null): number[] {
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const seen = new Set<number>();
  for (const value of parsed) {
    if (!isMonsterId(value) || seen.has(value)) continue;
    seen.add(value);
    if (seen.size >= MAX_PLAN_SIZE) break;
  }
  return [...seen];
}

export function readFarmPlan(storage: StorageLike | null): number[] {
  if (!storage) return [];
  try {
    return parseFarmPlan(storage.getItem(FARM_PLAN_STORAGE_KEY));
  } catch {
    return [];
  }
}

// Returns whether the write landed, so the UI can say "this browser will not
// remember your plan" rather than silently forgetting it.
export function writeFarmPlan(storage: StorageLike | null, ids: number[]): boolean {
  if (!storage) return false;
  try {
    storage.setItem(FARM_PLAN_STORAGE_KEY, JSON.stringify(ids.slice(0, MAX_PLAN_SIZE)));
    return true;
  } catch {
    return false;
  }
}

// Adding is capped rather than silently dropping the oldest entry: a plan that
// quietly loses a monster the player added is worse than one that says it is
// full.
export function addToPlan(ids: number[], monsterId: number): number[] {
  if (!isMonsterId(monsterId)) return ids;
  if (ids.includes(monsterId)) return ids;
  if (ids.length >= MAX_PLAN_SIZE) return ids;
  return [...ids, monsterId];
}

export function removeFromPlan(ids: number[], monsterId: number): number[] {
  return ids.filter((id) => id !== monsterId);
}

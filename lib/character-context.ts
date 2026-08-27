// The character context is the one place the site remembers who the player is.
// Every tool reads it, so no tool has to ask again -- the thing competing sites
// do not do (spec 3.15.2).
//
// No React and no browser globals in this file. Callers pass storage in, which
// is what lets these run under plain vitest with no DOM.

import { JOB_PROFILES, type JobKey } from './formulas';

export interface CharacterContext {
  level: number;
  job: JobKey;
  damagePerHit: number;
  attacksPerSecond: number;
  vit: number;
}

export const CHARACTER_STORAGE_KEY = 'roz-calc:character';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// Validates rather than casts. A stored payload can be stale (written by an
// older build), hand-edited, or from a different app on the same origin --
// trusting its shape would put NaN and undefined into every calculation
// downstream.
export function parseCharacterContext(raw: string | null): CharacterContext | null {
  if (raw === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null;

  const { level, job, damagePerHit, attacksPerSecond, vit } = parsed as Record<string, unknown>;

  if (!isPositiveNumber(level)) return null;
  if (!isPositiveNumber(damagePerHit)) return null;
  if (!isPositiveNumber(attacksPerSecond)) return null;
  if (!isPositiveNumber(vit)) return null;
  if (typeof job !== 'string' || !Object.prototype.hasOwnProperty.call(JOB_PROFILES, job)) return null;

  return { level, job: job as JobKey, damagePerHit, attacksPerSecond, vit };
}

// The same rules applied to what a person typed rather than to what storage
// held. The form used to carry its own copy of them, which is how a value the
// form accepted could be rejected on the next page load and silently vanish.
// One set of rules, two entry points.
export function characterFromInput(input: {
  level: string;
  job: string;
  vit: string;
  damagePerHit: string;
  attacksPerSecond: string;
}): CharacterContext | null {
  // No separate blank check: Number('') and Number('   ') are both 0, and
  // parseCharacterContext already rejects a non-positive number. One was
  // written here and deleted again when removing it changed no test.
  return parseCharacterContext(
    JSON.stringify({
      level: Number(input.level),
      job: input.job,
      vit: Number(input.vit),
      damagePerHit: Number(input.damagePerHit),
      attacksPerSecond: Number(input.attacksPerSecond),
    }),
  );
}

// Storage access itself throws in some browsers (Safari private mode, blocked
// site data), not just returns null. Reading must never take a page down.
export function readCharacterContext(storage: StorageLike | null): CharacterContext | null {
  if (!storage) return null;
  try {
    return parseCharacterContext(storage.getItem(CHARACTER_STORAGE_KEY));
  } catch {
    return null;
  }
}

// Returns whether the write actually landed, so the UI can say "this browser
// will not remember your settings" instead of silently forgetting them.
export function writeCharacterContext(storage: StorageLike | null, ctx: CharacterContext): boolean {
  if (!storage) return false;
  try {
    storage.setItem(CHARACTER_STORAGE_KEY, JSON.stringify(ctx));
    return true;
  } catch {
    return false;
  }
}

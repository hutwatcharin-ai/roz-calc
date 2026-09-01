// The character context is the one place the site remembers who the player is.
// Every tool reads it, so no tool has to ask again -- the thing competing sites
// do not do (spec 3.15.2).
//
// No React and no browser globals in this file. Callers pass storage in, which
// is what lets these run under plain vitest with no DOM.

import { JOB_PROFILES, maxHp as maxHpFormula, type JobKey } from './formulas';
import { playerFlee, playerHit } from './hit-flee';

// v2 (2026-09-01): the player enters numbers the game already shows on the
// status window -- Max HP, HIT, FLEE -- instead of VIT/job/DEX/AGI/LUK that we
// then pushed through formulas of our own. Direct numbers include gear and
// buffs, work for every job, and remove two guessed formulas from under the
// site's danger badge. v1 payloads are migrated in the parser below.
export interface CharacterContext {
  level: number;
  damagePerHit: number;
  attacksPerSecond: number;
  maxHp: number;
  // Optional: null means "not filled in".
  hit: number | null;
  flee: number | null;
}

export const CHARACTER_STORAGE_KEY = 'roz-calc:character';

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function isPositiveNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

// For the optional stats: absent or junk degrades to null rather than
// invalidating the whole context -- these arrived later than the required
// fields and must never break an existing save.
function optionalPositive(value: unknown): number | null {
  return isPositiveNumber(value) ? value : null;
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

  const { level, job, damagePerHit, attacksPerSecond, vit, dex, agi, luk, maxHp, hit, flee } =
    parsed as Record<string, unknown>;

  if (!isPositiveNumber(level)) return null;
  if (!isPositiveNumber(damagePerHit)) return null;
  if (!isPositiveNumber(attacksPerSecond)) return null;

  // v2 payload: maxHp present.
  if (isPositiveNumber(maxHp)) {
    return {
      level,
      damagePerHit,
      attacksPerSecond,
      maxHp,
      hit: optionalPositive(hit),
      flee: optionalPositive(flee),
    };
  }

  // v1 migration: derive the direct numbers once from the old fields via the
  // same formulas v1 applied on every read. A later save writes v2.
  if (
    isPositiveNumber(vit) &&
    typeof job === 'string' &&
    Object.prototype.hasOwnProperty.call(JOB_PROFILES, job)
  ) {
    const dexN = optionalPositive(dex);
    const agiN = optionalPositive(agi);
    const lukN = optionalPositive(luk) ?? 0;
    return {
      level,
      damagePerHit,
      attacksPerSecond,
      maxHp: maxHpFormula(level, vit, job as JobKey),
      hit: dexN !== null ? playerHit(level, dexN, lukN) : null,
      flee: agiN !== null ? playerFlee(level, agiN, lukN) : null,
    };
  }

  return null;
}

// The same rules applied to what a person typed rather than to what storage
// held. The form used to carry its own copy of them, which is how a value the
// form accepted could be rejected on the next page load and silently vanish.
// One set of rules, two entry points.
export function characterFromInput(input: {
  level: string;
  maxHp: string;
  damagePerHit: string;
  attacksPerSecond: string;
  hit?: string;
  flee?: string;
}): CharacterContext | null {
  // No separate blank check: Number('') and Number('   ') are both 0, and
  // parseCharacterContext already rejects a non-positive number. One was
  // written here and deleted again when removing it changed no test.
  return parseCharacterContext(
    JSON.stringify({
      level: Number(input.level),
      maxHp: Number(input.maxHp),
      damagePerHit: Number(input.damagePerHit),
      attacksPerSecond: Number(input.attacksPerSecond),
      hit: input.hit ? Number(input.hit) : null,
      flee: input.flee ? Number(input.flee) : null,
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

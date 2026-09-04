// The numbers a calculator needs from the player, remembered per browser.
//
// This replaces the character bar that used to sit on top of every page
// (removed 4 Sep 2026). Players told us the same thing twice: they came to
// look at a monster and were met with four boxes to fill in first
// ("ต้องมากดใส่เลขอะไรเยอะแยะ ... เขาแค่ต้องการดูข้อมูลมอนเฉยๆ").
//
// So: database pages ask for nothing at all, and each tool asks only for the
// fields it actually reads. What is stored here is a convenience, not a
// profile -- it exists so moving between two tools does not mean typing the
// same damage figure twice. Nothing reads it outside /tools.
//
// Every field is independently optional. A tool with one of its two numbers
// shows the half it can compute and stays quiet about the rest, rather than
// refusing to work until the form is complete.

export const PLAYER_NUMBERS_KEY = 'roz-calc:tool-numbers';

export type PlayerField = 'level' | 'damagePerHit' | 'aspd' | 'hit' | 'flee' | 'maxHp';

export type PlayerNumbers = Partial<Record<PlayerField, number>>;

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const FIELDS: PlayerField[] = ['level', 'damagePerHit', 'aspd', 'hit', 'flee', 'maxHp'];

function usable(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/** ASPD over 199 would divide by zero or flip the sign in 50 / (200 - aspd). */
export function attacksPerSecond(aspd: number | undefined): number | null {
  if (!usable(aspd) || aspd >= 200) return null;
  return 50 / (200 - aspd);
}

/** Validates rather than casts: storage can hold anything an older build or another tab wrote. */
export function parsePlayerNumbers(raw: string | null): PlayerNumbers {
  if (raw === null) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};

  const out: PlayerNumbers = {};
  for (const field of FIELDS) {
    const value = (parsed as Record<string, unknown>)[field];
    if (usable(value)) out[field] = value;
  }
  // ASPD out of range is dropped rather than kept and guarded at every use.
  if (out.aspd !== undefined && out.aspd >= 200) delete out.aspd;
  return out;
}

/** What a form's text inputs mean. A blank box is "not answered", never 0. */
export function playerNumbersFromInput(input: Partial<Record<PlayerField, string>>): PlayerNumbers {
  const out: PlayerNumbers = {};
  for (const field of FIELDS) {
    const raw = input[field];
    if (raw === undefined || raw.trim() === '') continue;
    const value = Number(raw);
    if (usable(value)) out[field] = value;
  }
  if (out.aspd !== undefined && out.aspd >= 200) delete out.aspd;
  return out;
}

export function readPlayerNumbers(storage: StorageLike | null): PlayerNumbers {
  if (!storage) return {};
  try {
    return parsePlayerNumbers(storage.getItem(PLAYER_NUMBERS_KEY));
  } catch {
    // Access itself throws in private mode and with site data blocked.
    return {};
  }
}

export function writePlayerNumbers(storage: StorageLike | null, numbers: PlayerNumbers): boolean {
  if (!storage) return false;
  try {
    storage.setItem(PLAYER_NUMBERS_KEY, JSON.stringify(numbers));
    return true;
  } catch {
    return false;
  }
}

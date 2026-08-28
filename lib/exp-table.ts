// EXP per level, from the official guide's คู่มือผู้เชี่ยวชาญ > เลเวลตัวละคร page.
//
// Two things about this data are worth knowing before using it.
//
// 1. The page stops at base level 50. The game does not. Nothing here should be
//    extrapolated past the last row -- the curve is roughly x1.2 per level and
//    an extrapolation would look authoritative while being invented.
//
// 2. The guide labels the columns "LV" and "exp" and never says which direction
//    a row means. It is settled now, and by two facts together: the site owner
//    confirms the EXP bar resets to 0 on every level-up, so each row is one
//    bar's worth rather than a running total; and row 1 is 0, so row 1 cannot
//    be the bar a level-1 character fills or that character would level
//    instantly.
//
//    So row N is the bar filled to REACH level N. A level-1 character is
//    working on row 2 -- 2,500 EXP -- and on reaching level 2 starts again at
//    zero against row 3. expToLevelUpFrom() is the function that says this.

/** The base EXP column, index 0 = level 1. Value is the guide's number for that row. */
export const BASE_EXP_ROWS: number[] = [
  0, 2_500, 3_000, 3_600, 4_300, 5_100, 6_100, 7_300, 8_700, 10_400,
  12_400, 14_800, 17_700, 21_200, 25_400, 30_400, 36_400, 43_600, 52_300, 62_700,
  75_200, 90_200, 108_200, 129_800, 155_700, 186_800, 224_100, 268_900, 322_600, 387_100,
  464_500, 557_400, 668_800, 802_500, 963_000, 1_155_600, 1_386_700, 1_664_000, 1_996_800, 2_396_100,
  2_875_300, 3_450_300, 4_140_300, 4_968_300, 5_961_900, 7_154_200, 8_585_000, 10_302_000, 12_362_400,
  14_834_800,
];

/** Novice job EXP, index 0 = job level 1. Novice caps at job level 10. */
export const NOVICE_JOB_EXP_ROWS: number[] = [5, 12, 22, 35, 50, 113, 188, 256, 335, 425];

/** First-class job EXP, index 0 = job level 1. */
export const FIRST_JOB_EXP_ROWS: number[] = [
  150, 340, 550, 760, 990, 1_250, 1_600, 1_980, 2_340, 2_740,
  3_140, 3_950, 4_510, 5_210, 5_950, 7_000, 8_150, 9_130, 10_220, 11_480,
  12_780, 14_090, 15_560, 16_980, 18_620, 20_280, 21_780, 24_510, 27_000, 29_000,
  31_000, 36_000, 39_000, 41_000, 45_000, 49_000, 51_900, 55_000, 59_450, 64_630,
  70_030, 74_940, 79_800, 84_630, 89_610, 95_170, 100_420, 107_250, 112_070, 118_120,
];

export const MAX_PUBLISHED_BASE_LEVEL = BASE_EXP_ROWS.length;

/**
 * The bar filled to arrive at this level, which a character one level below is
 * currently working on. Returns null past the last row the guide publishes
 * rather than extrapolating a number nobody has seen.
 */
export function expToReach(level: number): number | null {
  if (!Number.isInteger(level) || level < 1) return null;
  const value = BASE_EXP_ROWS[level - 1];
  return value === undefined ? null : value;
}

/** Total base EXP to get from level 1 to the given level, or null past the published rows. */
export function totalExpToReach(level: number): number | null {
  if (!Number.isInteger(level) || level < 1 || level > MAX_PUBLISHED_BASE_LEVEL) return null;
  let total = 0;
  for (let n = 1; n <= level; n += 1) total += BASE_EXP_ROWS[n - 1];
  return total;
}

/**
 * The bar a character at this level is filling right now. Null once the guide
 * runs out -- a level-50 character's next bar is simply not published.
 */
export function expToLevelUpFrom(level: number): number | null {
  if (!Number.isInteger(level) || level < 1) return null;
  return expToReach(level + 1);
}

/**
 * Total base EXP to climb from one level to another. Null if either end is off
 * the published table, rather than a total that quietly omits the missing rows.
 */
export function totalExpBetween(from: number, to: number): number | null {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return null;
  if (from < 1 || to <= from || to > MAX_PUBLISHED_BASE_LEVEL) return null;
  let total = 0;
  for (let level = from + 1; level <= to; level += 1) total += BASE_EXP_ROWS[level - 1];
  return total;
}

/** How much of the current bar is left to fill, and how many of one monster that is. */
export type LevelProgress = { need: number; kills: number };

/**
 * Kills of a monster worth expPerKill needed to go from level to level+1,
 * starting from an empty bar. Null when the guide has no row for the next
 * level, or when the monster's EXP is missing or zero -- a monster that gives
 * nothing never levels anyone, and "Infinity kills" is not an answer.
 */
export function killsToLevelUp(level: number, expPerKill: number): LevelProgress | null {
  const need = expToLevelUpFrom(level);
  if (need === null) return null;
  if (!Number.isFinite(expPerKill) || expPerKill <= 0) return null;
  return { need, kills: Math.ceil(need / expPerKill) };
}

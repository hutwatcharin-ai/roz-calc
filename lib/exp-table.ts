// EXP per level, from the official guide's คู่มือผู้เชี่ยวชาญ > เลเวลตัวละคร page.
//
// Two things about this data are worth knowing before using it.
//
// 1. The page stops at base level 50. The game does not. Nothing here should be
//    extrapolated past the last row -- the curve is roughly x1.2 per level and
//    an extrapolation would look authoritative while being invented.
//
// 2. The guide labels the columns "LV" and "exp" and never says which direction
//    a row means: the EXP needed to REACH that level, or the EXP needed to
//    LEAVE it. The base table's first row is 0, which only makes sense as
//    "reaching level 1 costs nothing", so that is the reading encoded below.
//    It is not confirmed against the game yet, and one glance at a level-2
//    character settles it: if the bar fills at 2,500 this reading is right, if
//    it fills at 3,000 every row is off by one.
//
//    Until that is confirmed, EXP_ROWS is exported raw and the site prints the
//    table as the guide prints it. expToReach() carries the assumption, alone,
//    so confirming it is a one-line change with a test already pinned to it.

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
 * EXP needed to go from level-1 to level, on the reading described at the top
 * of this file. Returns null past the last row the guide publishes rather than
 * extrapolating a number nobody has seen.
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

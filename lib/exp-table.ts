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
 * Base EXP for levels 51-70 from roztoday.com/th/tools/exp (Emperium Weekly,
 * a fan site; read 15 Oct 2026 as the page shows it; owner asked for 60-70,
 * then 51-59 too, and for the range calculator to reach 70).
 * A second source, kept apart from the guide's rows above so the range
 * calculator never mixes them. Same row meaning as ours: its rows 2-50 equal
 * the guide's exactly. Caution: every row it has, 1 to 100, is the row before
 * x 1.2 rounded down to 100 -- including 71-100, which it marks estimated --
 * so these cannot be told apart from an extrapolation, and Taiwan's notes
 * (docs/GAME_MODEL.md) speak of a steeper 51-60 and an EXP cut near 70.
 * Not checked in game. Index 0 = level 51.
 */
export const SECOND_SOURCE_FIRST_LEVEL = 51;
export const SECOND_SOURCE_BASE_EXP_ROWS: number[] = [
  17_801_700, 21_362_000, 25_634_400, 30_761_200, 36_913_400, 44_296_000, 53_155_200,
  63_786_200, 76_543_400,
  91_852_000, 110_222_400, 132_266_800, 158_720_100, 190_464_100, 228_556_900,
  274_268_200, 329_121_800, 394_946_100, 473_935_300, 568_722_300,
];

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

/** Highest level the range calculator offers: the guide's rows, then the second source's. */
export const MAX_ANY_SOURCE_LEVEL = MAX_PUBLISHED_BASE_LEVEL + SECOND_SOURCE_BASE_EXP_ROWS.length;

/**
 * Like totalExpBetween, but past level 50 it adds the second source's rows,
 * and says so (secondSource) so the page can label the figure.
 */
export function totalExpBetweenAnySource(from: number, to: number): { total: number; secondSource: boolean } | null {
  if (!Number.isInteger(from) || !Number.isInteger(to)) return null;
  if (from < 1 || to <= from || to > MAX_ANY_SOURCE_LEVEL) return null;
  let total = 0;
  for (let level = from + 1; level <= to; level += 1) {
    total += level <= MAX_PUBLISHED_BASE_LEVEL ? BASE_EXP_ROWS[level - 1] : SECOND_SOURCE_BASE_EXP_ROWS[level - SECOND_SOURCE_FIRST_LEVEL];
  }
  return { total, secondSource: to > MAX_PUBLISHED_BASE_LEVEL };
}

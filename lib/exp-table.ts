// EXP per level, from the official guide's คู่มือผู้เชี่ยวชาญ > เลเวลตัวละคร page.
//
// Two things about this data are worth knowing before using it.
//
// 1. Until 12 Nov 2026 the page stopped at base level 50; it now runs 1-80
//    (the cap). Nothing here should be extrapolated past the last row.
//
// 2. Each row is one bar's worth (the bar resets to 0 on level-up, owner).
//    Internally row N is the bar filled to REACH level N, so a level-1
//    character is working on row 2. The 12 Nov official page writes the same
//    bars one row earlier (its row 1 is the 1 -> 2 bar); BASE_EXP_ROWS below
//    shifts it. expToLevelUpFrom() is the function that says which bar a
//    character is filling.

/**
 * The base EXP column in "bar to reach level N" form, index 0 = level 1.
 *
 * Source: the official Game Guide > Character Level page as updated for the
 * 12 Nov 2026 patch (read 12 Nov 2026), which now runs 1-80. That page lists
 * row N as the EXP to go from level N to N+1 -- row 1 is 2,100, not 0, and it
 * has a row for 80 even though 80 is the cap -- so it is shifted by one here:
 * reach[N] = official[N - 1], and reach[1] = 0. The official row 80 (80 -> 81,
 * 896,248,000) does not apply until the cap moves again and is left out.
 * The same numbers appeared on roz.prontera.info the day before.
 * The table before this patch (official 1-50, roztoday 51-70) is gone: the
 * patch lowered levels 2-70.
 */
export const BASE_EXP_ROWS: number[] = [
  0, 2_100, 2_400, 2_700, 3_100, 3_500, 4_000, 4_600, 5_200, 5_900,
  6_700, 7_700, 8_800, 10_100, 11_600, 13_300, 15_200, 17_400, 20_000, 23_000,
  26_400, 30_300, 34_800, 40_000, 46_000, 52_900, 60_800, 69_900, 80_300, 92_300,
  106_100, 122_000, 140_300, 161_300, 185_400, 213_200, 245_100, 281_800, 324_000, 372_600,
  428_400, 492_600, 566_400, 651_300, 748_900, 861_200, 990_300, 1_138_800, 1_309_600, 1_506_000,
  1_731_900, 8_659_500, 9_525_400, 10_477_900, 11_525_600, 12_678_100, 13_945_900, 15_340_400, 16_874_400, 18_561_800,
  20_417_900, 81_671_600, 89_838_700, 98_822_500, 108_704_700, 119_575_100, 131_532_600, 144_685_800, 159_154_300, 175_069_700,
  192_576_600, 577_729_800, 606_616_200, 636_947_000, 668_794_300, 702_234_000, 737_345_700, 774_212_900, 812_923_500, 853_569_600,
];

/** The official row for 80 -> 81, kept for the note on the page only. */
export const EXP_PAST_CAP = 896_248_000;

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

/** Second-class job EXP, index 0 = job level 1 (official guide, 12 Nov 2026). Job caps at 70. */
export const SECOND_JOB_EXP_ROWS: number[] = [
  1_600, 2_500, 4_200, 7_000, 10_300, 15_900, 18_900, 20_900, 22_600, 24_900,
  28_800, 31_500, 32_000, 33_300, 35_100, 40_500, 44_100, 46_300, 48_500, 50_700,
  56_000, 59_400, 63_500, 68_100, 76_000, 87_700, 94_500, 104_600, 114_600, 126_600,
  143_700, 158_000, 172_300, 188_600, 208_100, 233_500, 259_600, 280_400, 300_300, 326_800,
  384_900, 445_200, 492_000, 575_700, 655_900, 769_300, 894_000, 1_058_700, 1_207_000, 1_335_400,
  1_669_250, 2_086_562, 2_608_202, 3_260_252, 4_075_315, 5_094_143, 6_367_678, 7_959_597, 9_949_496, 12_436_870,
  15_546_087, 19_432_608, 24_290_760, 30_363_450, 37_954_312, 47_442_890, 59_303_612, 74_129_515, 92_661_893, 115_827_366,
];

export const MAX_PUBLISHED_BASE_LEVEL = BASE_EXP_ROWS.length;

/**
 * A second source for levels past the official table. Empty since the
 * 12 Nov 2026 official table covers 1-80; roztoday's 51-70 rows (15 Oct 2026)
 * were retired with it. Kept so the calculator's labelling still works if the
 * cap outruns the official table again.
 */
export const SECOND_SOURCE_FIRST_LEVEL = BASE_EXP_ROWS.length + 1;
export const SECOND_SOURCE_BASE_EXP_ROWS: number[] = [];

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

export interface ExpRow {
  level: number;
  exp: number;
  /** The guide's table, or the second source (roztoday) past level 50. */
  source: 'guide' | 'second';
}

/** Base EXP rows 1-70 in one list, each marked with where it comes from. */
export function baseRowsAllSources(): ExpRow[] {
  return [
    ...BASE_EXP_ROWS.map((exp, i) => ({ level: i + 1, exp, source: 'guide' as const })),
    ...SECOND_SOURCE_BASE_EXP_ROWS.map((exp, i) => ({ level: SECOND_SOURCE_FIRST_LEVEL + i, exp, source: 'second' as const })),
  ];
}

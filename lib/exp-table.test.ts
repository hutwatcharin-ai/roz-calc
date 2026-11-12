import { describe, it, expect } from 'vitest';
import {
  BASE_EXP_ROWS,
  expToLevelUpFrom,
  killsToLevelUp,
  totalExpBetween,
  FIRST_JOB_EXP_ROWS,
  SECOND_JOB_EXP_ROWS,
  MAX_PUBLISHED_BASE_LEVEL,
  NOVICE_JOB_EXP_ROWS,
  expToReach,
  totalExpToReach,
  totalExpBetweenAnySource,
  MAX_ANY_SOURCE_LEVEL,
} from './exp-table';
import { BASE_LEVEL_CAP } from './level-cap';

// The official Character Level table as updated for the 12 Nov 2026 patch.
// The curve is geometric inside each ten levels with a wall at 50, 60 and 70;
// the ratio band catches a misread digit and names the level.

describe('the base EXP table', () => {
  it('covers levels 1 to the cap', () => {
    expect(BASE_EXP_ROWS).toHaveLength(80);
    expect(MAX_PUBLISHED_BASE_LEVEL).toBe(BASE_LEVEL_CAP);
  });

  it('starts at zero: nobody fills a bar to reach level 1', () => {
    expect(BASE_EXP_ROWS[0]).toBe(0);
  });

  it('grows 5-20% a level, except the walls into 52, 62 and 72', () => {
    const walls: Record<number, number> = { 52: 5, 62: 4, 72: 3 };
    for (let level = 3; level <= 80; level += 1) {
      const ratio = BASE_EXP_ROWS[level - 1] / BASE_EXP_ROWS[level - 2];
      if (walls[level]) {
        expect(ratio, `level ${level}`).toBeCloseTo(walls[level], 2);
      } else {
        expect(ratio, `level ${level}`).toBeGreaterThan(1.04);
        expect(ratio, `level ${level}`).toBeLessThan(1.2);
      }
    }
  });

  it('never asks for less EXP than the level before', () => {
    for (let i = 1; i < BASE_EXP_ROWS.length; i += 1) {
      expect(BASE_EXP_ROWS[i], `level ${i + 1}`).toBeGreaterThan(BASE_EXP_ROWS[i - 1]);
    }
  });
});

describe('the job EXP tables', () => {
  it('stops the novice table at job level 10', () => {
    expect(NOVICE_JOB_EXP_ROWS).toHaveLength(10);
  });

  it('runs the first-class table to job level 50', () => {
    expect(FIRST_JOB_EXP_ROWS).toHaveLength(50);
  });

  it('runs the second-class table to job level 70', () => {
    expect(SECOND_JOB_EXP_ROWS).toHaveLength(70);
    expect(SECOND_JOB_EXP_ROWS[69]).toBe(115_827_366);
  });

  it('climbs without a dip in any table', () => {
    for (const rows of [NOVICE_JOB_EXP_ROWS, FIRST_JOB_EXP_ROWS, SECOND_JOB_EXP_ROWS]) {
      for (let i = 1; i < rows.length; i += 1) {
        expect(rows[i]).toBeGreaterThan(rows[i - 1]);
      }
    }
  });
});

describe('lookups', () => {
  it('reads a level off the table, one row after the official page', () => {
    // Official row 1 (1 -> 2) is 2,100; official row 79 (79 -> 80) is 853,569,600.
    expect(expToReach(2)).toBe(2_100);
    expect(expToReach(51)).toBe(1_731_900);
    expect(expToReach(80)).toBe(853_569_600);
  });

  it('returns null past the cap instead of extrapolating', () => {
    expect(expToReach(81)).toBeNull();
    expect(totalExpToReach(81)).toBeNull();
  });

  it('rejects a level that is not a whole number above zero', () => {
    expect(expToReach(0)).toBeNull();
    expect(expToReach(-3)).toBeNull();
    expect(expToReach(2.5)).toBeNull();
  });

  it('adds up the whole climb, not just the last step', () => {
    expect(totalExpToReach(1)).toBe(0);
    expect(totalExpToReach(3)).toBe(4_500);
    expect(totalExpToReach(80)).toBe(BASE_EXP_ROWS.reduce((a, b) => a + b, 0));
  });
});

describe('expToLevelUpFrom', () => {
  it('gives a level-1 character the 2,100 bar, not the 0 one', () => {
    expect(expToLevelUpFrom(1)).toBe(2_100);
    expect(expToLevelUpFrom(2)).toBe(2_400);
  });

  it('runs out at the cap', () => {
    expect(expToLevelUpFrom(79)).toBe(853_569_600);
    expect(expToLevelUpFrom(80)).toBeNull();
    expect(expToLevelUpFrom(0)).toBeNull();
  });
});

describe('totalExpBetween', () => {
  it('adds only the levels actually climbed', () => {
    expect(totalExpBetween(1, 3)).toBe(2_100 + 2_400);
  });

  it('agrees with the running total when starting from level 1', () => {
    expect(totalExpBetween(1, 20)).toBe(totalExpToReach(20));
  });

  it('sums 70 to 80 to the official rows 70-79', () => {
    expect(totalExpBetween(70, 80)).toBe(6_562_949_600);
  });

  it('refuses a range it cannot cover in full', () => {
    expect(totalExpBetween(70, 90)).toBeNull();
    expect(totalExpBetween(10, 10)).toBeNull();
    expect(totalExpBetween(30, 20)).toBeNull();
  });
});

describe('killsToLevelUp', () => {
  it('rounds up, because a part-killed monster gives nothing', () => {
    // Level 1 needs 2,100. At 300 EXP a kill that is exactly 7.
    expect(killsToLevelUp(1, 300)).toEqual({ need: 2_100, kills: 7 });
    expect(killsToLevelUp(1, 299)).toEqual({ need: 2_100, kills: 8 });
  });

  it('says nothing rather than Infinity for a monster worth no EXP', () => {
    expect(killsToLevelUp(10, 0)).toBeNull();
    expect(killsToLevelUp(10, -5)).toBeNull();
  });

  it('says nothing at the cap', () => {
    expect(killsToLevelUp(80, 1_000)).toBeNull();
  });
});

describe('the range calculator', () => {
  it('reaches the cap on the official table alone', () => {
    expect(MAX_ANY_SOURCE_LEVEL).toBe(80);
    expect(totalExpBetweenAnySource(70, 80)).toEqual({ total: 6_562_949_600, secondSource: false });
    expect(totalExpBetweenAnySource(1, 81)).toBeNull();
  });
});

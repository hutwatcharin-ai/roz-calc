import { describe, it, expect } from 'vitest';
import {
  BASE_EXP_ROWS,
  FIRST_JOB_EXP_ROWS,
  MAX_PUBLISHED_BASE_LEVEL,
  NOVICE_JOB_EXP_ROWS,
  expToReach,
  totalExpToReach,
} from './exp-table';

// Fifty numbers read off a screenshot, with no second source to compare
// against. The base curve turns out to be almost exactly geometric, which is
// the cross-check: a misread digit throws the ratio off its narrow band and
// the failure message names the level.

describe('the base EXP table', () => {
  it('covers levels 1 to 50, which is where the guide stops', () => {
    expect(BASE_EXP_ROWS).toHaveLength(50);
    expect(MAX_PUBLISHED_BASE_LEVEL).toBe(50);
  });

  it('starts at zero, the only reading that makes the first row sensible', () => {
    expect(BASE_EXP_ROWS[0]).toBe(0);
  });

  it('grows by almost exactly a fifth every level', () => {
    // Levels 3 upward. Level 2 is excluded because its predecessor is 0.
    for (let level = 3; level <= 50; level += 1) {
      const ratio = BASE_EXP_ROWS[level - 1] / BASE_EXP_ROWS[level - 2];
      expect(ratio, `level ${level}`).toBeGreaterThan(1.15);
      expect(ratio, `level ${level}`).toBeLessThan(1.25);
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

  it('climbs without a dip in either table', () => {
    // The job curves are not geometric -- the novice one jumps from 50 to 113
    // at level 6 -- so monotonicity is the only shape check they support.
    for (const rows of [NOVICE_JOB_EXP_ROWS, FIRST_JOB_EXP_ROWS]) {
      for (let i = 1; i < rows.length; i += 1) {
        expect(rows[i]).toBeGreaterThan(rows[i - 1]);
      }
    }
  });
});

describe('lookups', () => {
  it('reads a level off the table', () => {
    expect(expToReach(2)).toBe(2_500);
    expect(expToReach(50)).toBe(14_834_800);
  });

  it('returns null past the last published level instead of extrapolating', () => {
    // The game goes above 50; the guide's table does not. Continuing the x1.2
    // curve would produce a confident-looking number nobody has seen.
    expect(expToReach(51)).toBeNull();
    expect(totalExpToReach(51)).toBeNull();
  });

  it('rejects a level that is not a whole number above zero', () => {
    expect(expToReach(0)).toBeNull();
    expect(expToReach(-3)).toBeNull();
    expect(expToReach(2.5)).toBeNull();
  });

  it('adds up the whole climb, not just the last step', () => {
    expect(totalExpToReach(1)).toBe(0);
    expect(totalExpToReach(3)).toBe(5_500);
    expect(totalExpToReach(50)).toBe(BASE_EXP_ROWS.reduce((a, b) => a + b, 0));
  });
});

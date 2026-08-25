import { describe, it, expect } from 'vitest';
import { statusAtk, totalAtk, maxHp, statusMatk, aspd, JOB_PROFILES } from './formulas';

describe('statusAtk', () => {
  it('sums STR plus DEX/5 and LUK/3 floored', () => {
    expect(statusAtk(90, 60, 10)).toBe(90 + 12 + 3); // 105
  });

  it('is zero when all stats are zero', () => {
    expect(statusAtk(0, 0, 0)).toBe(0);
  });

  it('increases monotonically with STR', () => {
    expect(statusAtk(50, 0, 0)).toBeLessThan(statusAtk(51, 0, 0));
  });
});

describe('totalAtk', () => {
  it('adds weapon ATK to status ATK', () => {
    expect(totalAtk(100, 90, 60, 10)).toBe(100 + 105);
  });
});

describe('maxHp', () => {
  it('scales with base level and job HP factor, boosted by VIT', () => {
    const knightHp = maxHp(60, 70, 'knight');
    const wizardHp = maxHp(60, 70, 'wizard');
    expect(knightHp).toBeGreaterThan(wizardHp);
  });

  it('is higher with more VIT at the same level and job', () => {
    expect(maxHp(60, 100, 'knight')).toBeGreaterThan(maxHp(60, 10, 'knight'));
  });
});

describe('statusMatk', () => {
  it('returns a min <= max range', () => {
    const { min, max } = statusMatk(90, 40, 10);
    expect(min).toBeLessThanOrEqual(max);
  });

  it('is zero-ish range when INT is zero', () => {
    const { min, max } = statusMatk(0, 0, 0);
    expect(min).toBe(0);
    expect(max).toBe(0);
  });
});

describe('aspd', () => {
  it('is capped at 193', () => {
    expect(aspd(999, 999)).toBeLessThanOrEqual(193);
  });

  it('increases with AGI', () => {
    expect(aspd(50, 0)).toBeLessThan(aspd(150, 0));
  });
});

describe('JOB_PROFILES', () => {
  it('has exactly the 4 v1 job keys', () => {
    expect(Object.keys(JOB_PROFILES).sort()).toEqual(['archer', 'knight', 'swordsman', 'wizard']);
  });
});

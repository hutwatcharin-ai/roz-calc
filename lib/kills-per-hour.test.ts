import { describe, it, expect } from 'vitest';
import { killRate, expPerHour, KILL_RATE_DISCLAIMER } from './kills-per-hour';

describe('killRate', () => {
  it('computes a whole-number hit count, rounding a partial hit up', () => {
    // 250 HP at 100 damage is 2.5 hits, which is 3 swings, not 2.
    const r = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2 });
    expect(r!.hitsToKill).toBe(3);
    expect(r!.secondsToKill).toBe(1.5);
    expect(r!.killsPerHour).toBe(2400);
  });

  it('needs one hit, not zero, when damage exceeds monster HP', () => {
    const r = killRate({ monsterHp: 50, damagePerHit: 9999, attacksPerSecond: 1 });
    expect(r!.hitsToKill).toBe(1);
    expect(r!.killsPerHour).toBe(3600);
  });

  it('needs one hit when damage exactly equals monster HP', () => {
    const r = killRate({ monsterHp: 100, damagePerHit: 100, attacksPerSecond: 1 });
    expect(r!.hitsToKill).toBe(1);
  });

  it('returns null for zero damage rather than dividing by zero', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: 0, attacksPerSecond: 2 })).toBeNull();
  });

  it('returns null for negative damage', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: -5, attacksPerSecond: 2 })).toBeNull();
  });

  it('returns null for zero attack speed rather than dividing by zero', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: 50, attacksPerSecond: 0 })).toBeNull();
  });

  it('returns null when monster HP is zero, which is the unknown-HP marker', () => {
    // transformMonster stores 0 for monsters whose raw HP is "???" -- treating
    // that as a real HP of zero would report an infinite kill rate.
    expect(killRate({ monsterHp: 0, damagePerHit: 50, attacksPerSecond: 2 })).toBeNull();
  });

  it('returns null for a non-finite input instead of producing NaN', () => {
    expect(killRate({ monsterHp: 100, damagePerHit: Number.NaN, attacksPerSecond: 2 })).toBeNull();
  });
});

describe('expPerHour', () => {
  it('multiplies kills by experience per kill', () => {
    expect(expPerHour(2400, 50)).toBe(120000);
  });

  it('returns null when EXP per kill is zero, which is the unknown-EXP marker, not a real zero', () => {
    // transformMonster stores 0 for monsters whose raw base_exp is "" or
    // "???" -- 202 of 524 monsters, none of them a literal 0 in the feed.
    // Reporting "0 EXP/hour" for one of those would invent a game value.
    expect(expPerHour(2400, 0)).toBeNull();
  });

  it('returns null for negative EXP per kill', () => {
    expect(expPerHour(2400, -50)).toBeNull();
  });

  it('returns null for non-finite EXP per kill instead of producing NaN', () => {
    expect(expPerHour(2400, Number.NaN)).toBeNull();
  });

  it('stays in the expected range for a server-average monster', () => {
    // Spec 3.9: EXP/HP across the server averages about 0.6, so a 1,000 HP
    // monster gives roughly 600 EXP. At 100 damage and 2 attacks/sec that is
    // 10 hits, 5 seconds, 720 kills/hour, about 432,000 EXP/hour. An answer off
    // by an order of magnitude means the units are wrong somewhere.
    const r = killRate({ monsterHp: 1000, damagePerHit: 100, attacksPerSecond: 2 })!;
    const exp = expPerHour(r.killsPerHour, 600);
    expect(exp).toBeGreaterThan(100_000);
    expect(exp).toBeLessThan(1_000_000);
  });
});

describe('KILL_RATE_DISCLAIMER', () => {
  it('is non-empty, because the figure must never ship unlabelled', () => {
    expect(KILL_RATE_DISCLAIMER.length).toBeGreaterThan(0);
  });

  it('states the figure is an upper bound, not just that a disclaimer exists', () => {
    // Non-empty alone would stay green even if this were replaced with
    // unrelated Thai text -- shipping the number without the "upper bound,
    // the real figure is always lower" framing is the thing this constant
    // exists to prevent.
    expect(KILL_RATE_DISCLAIMER).toContain('เพดานบน');
  });
});

describe('killRate with a hit chance', () => {
  it('counts the swings that miss', () => {
    // 3 landed hits at 50% means 6 swings, so the kill takes twice as long as
    // the old model said. This is the whole point of the 4 Sep 2026 fix.
    const r = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2, hitChancePercent: 50 });
    expect(r!.hitsToKill).toBe(3);
    expect(r!.attacksToKill).toBe(6);
    expect(r!.secondsToKill).toBe(3);
    expect(r!.killsPerHour).toBe(1200);
  });

  it('rounds a partial swing up, the way a partial hit already was', () => {
    // 3 hits at 80% is 3.75 swings: you cannot take three quarters of a swing.
    const r = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 1, hitChancePercent: 80 });
    expect(r!.attacksToKill).toBe(4);
  });

  it('changes nothing at 100%', () => {
    const perfect = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2, hitChancePercent: 100 });
    const omitted = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2 });
    expect(perfect).toEqual(omitted);
  });

  it('falls back to every-swing-lands when the chance is unknown', () => {
    // null is "we have no hit_100 for this mob, or no HIT for the player".
    // Guessing a penalty there would invent a number; the old behaviour is the
    // honest ceiling, and the disclaimer already says it is a ceiling.
    const unknown = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2, hitChancePercent: null });
    expect(unknown!.attacksToKill).toBe(3);
  });

  it('treats a chance above 100 as 100 rather than speeding the kill up', () => {
    const r = killRate({ monsterHp: 250, damagePerHit: 100, attacksPerSecond: 2, hitChancePercent: 150 });
    expect(r!.attacksToKill).toBe(3);
  });
});

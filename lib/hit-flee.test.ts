import { describe, expect, it } from 'vitest';
import { hitChanceVsMob, mobHitChance, playerFlee, playerHit } from './hit-flee';

describe('player formulas (rAthena renewal, verified 2026-09-01)', () => {
  it('HIT = 175 + Lv + DEX + floor(LUK/3)', () => {
    // Pinned from the character-context v1 migration: knight Lv50 dex60 luk20.
    expect(playerHit(50, 60, 20)).toBe(291);
    expect(playerHit(1, 1, 0)).toBe(177);
  });

  it('FLEE = 100 + Lv + AGI + floor(LUK/5)', () => {
    expect(playerFlee(50, 40, 20)).toBe(194);
    expect(playerFlee(1, 1, 0)).toBe(102);
  });
});

describe('threshold-based mob math (midgardhub hit_100 / flee_95 columns)', () => {
  // The stored values are PLAYER-side targets (discovered 2026-09-01 after a
  // day of treating them as raw mob stats): hit_100 = HIT for a 100% hit,
  // flee_95 = FLEE for the 95% dodge cap. Chance moves 1% per point.

  it('hitting the mob: 100% exactly at hit_100, -1%/point below, floor 5%', () => {
    // Poring hit_100 = 203 (midgardhub CSV, pinned).
    expect(hitChanceVsMob(203, 203)).toBe(100);
    expect(hitChanceVsMob(300, 203)).toBe(100); // over-cap stays 100
    expect(hitChanceVsMob(183, 203)).toBe(80);
    expect(hitChanceVsMob(0, 203)).toBe(5); // floor
  });

  it('mob hitting you: 5% exactly at flee_95, +1%/point below, cap 100%', () => {
    // Poring flee_95 = 178 (midgardhub CSV, pinned).
    expect(mobHitChance(178, 178)).toBe(5);
    expect(mobHitChance(178, 300)).toBe(5); // over-cap stays 5
    expect(mobHitChance(178, 100)).toBe(83);
    expect(mobHitChance(178, 0)).toBe(100); // cap
  });

  it('the old +20/+75 bug cannot come back: thresholds display as-is', () => {
    // Mummy: flee_95 = 293, hit_100 = 259 (midgardhub CSV). The old code
    // showed HIT target flee+20=313 and FLEE target hit+75=334 — both wrong.
    // The correct targets ARE the stored values.
    const mummy = { hit_100: 259, flee_95: 293 };
    expect(hitChanceVsMob(mummy.hit_100, mummy.hit_100)).toBe(100);
    expect(mobHitChance(mummy.flee_95, mummy.flee_95)).toBe(5);
  });
});

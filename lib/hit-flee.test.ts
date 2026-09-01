import { describe, expect, it } from 'vitest';
import {
  fleeToCapDodge,
  hitChancePct,
  hitToNeverMiss,
  mobFlee,
  mobHit,
  playerFlee,
  playerHit,
} from './hit-flee';

describe('player formulas', () => {
  it('matches the rAthena renewal base values', () => {
    // Lv1 all-1s naked novice: 175+1+1+0 hit, 100+1+1+0 flee.
    expect(playerHit(1, 1, 1)).toBe(177);
    expect(playerFlee(1, 1, 1)).toBe(102);
    // LUK breakpoints: /3 for hit, /5 for flee, floored.
    expect(playerHit(50, 30, 29)).toBe(175 + 50 + 30 + 9);
    expect(playerFlee(50, 40, 29)).toBe(100 + 50 + 40 + 5);
  });
});

describe('mob formulas', () => {
  it('computes from level+stat and refuses unknowns', () => {
    // Wolf: Lv 54, AGI 24, DEX 33.
    expect(mobFlee(54, 24)).toBe(178);
    expect(mobHit(54, 33)).toBe(237);
    expect(mobFlee(null, 24)).toBeNull();
    expect(mobFlee(54, null)).toBeNull();
    expect(mobHit(null, 33)).toBeNull();
  });
});

describe('hit chance', () => {
  it('is 80 + hit - flee clamped to [5, 100]', () => {
    expect(hitChancePct(200, 200)).toBe(80);
    expect(hitChancePct(220, 200)).toBe(100); // exactly flee+20
    expect(hitChancePct(219, 200)).toBe(99);
    expect(hitChancePct(100, 300)).toBe(5); // floor
    expect(hitChancePct(999, 0)).toBe(100); // ceiling
  });

  it('thresholds agree with the chance function', () => {
    const flee = 178;
    expect(hitChancePct(hitToNeverMiss(flee), flee)).toBe(100);
    expect(hitChancePct(hitToNeverMiss(flee) - 1, flee)).toBe(99);
    const hit = 237;
    expect(hitChancePct(hit, fleeToCapDodge(hit))).toBe(5);
    expect(hitChancePct(hit, fleeToCapDodge(hit) - 1)).toBe(6);
  });
});

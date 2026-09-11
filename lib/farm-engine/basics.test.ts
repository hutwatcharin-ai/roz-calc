import { describe, expect, it } from 'vitest';
import {
  canGate,
  canRate,
  collapseChannels,
  dropFactor,
  dropTag,
  farmedOn,
  headcount,
  levelWeight,
  metOn,
  playerFromNumbers,
  secondsPerKill,
  steadyPerKill,
} from './basics';
import { mob } from './fixtures';
import type { FarmMap, PlayerInput } from './types';

const player = (over: Partial<PlayerInput> = {}): PlayerInput => ({
  style: 'melee',
  level: null,
  damage: 500,
  perSecond: 2,
  hit: 200,
  flee: null,
  ...over,
});

describe('population', () => {
  const monsters = {
    1: mob(1),
    2: mob(2, { isMvp: true }),
    3: mob(3, { solo: true }),
    4: mob(4, { hp: null }),
    5: mob(5),
  };
  const map: FarmMap = {
    code: 'a',
    name: 'A',
    image: null,
    spawns: [
      { id: 1, amount: 20 },
      { id: 2, amount: 1 },
      { id: 3, amount: 1 },
      { id: 4, amount: 5 },
      { id: 5, amount: null },
      { id: 99, amount: 3 },
    ],
  };

  it('farms only what a bot can count on', () => {
    // MVP, one-at-a-time spawns, unknown HP and unknown counts all stay out.
    expect(farmedOn(map, monsters).map((r) => r.m.id)).toEqual([1]);
  });

  it('still meets everything standing there, for the safety gate', () => {
    const met = metOn(map, monsters);
    expect(met.map((r) => r.m.id)).toEqual([1, 2, 3, 4, 5]);
    expect(met.find((r) => r.m.id === 5)?.amount).toBe(0);
    expect(headcount(met)).toBe(27);
  });
});

describe('levelWeight', () => {
  it('is 1 at the player level, 0 at the span edge, never negative', () => {
    expect(levelWeight(50, 50)).toBe(1);
    expect(levelWeight(65, 50)).toBe(0);
    expect(levelWeight(1, 50)).toBe(0);
    expect(levelWeight(55, 50)).toBeCloseTo(levelWeight(45, 50));
  });
});

describe('player readiness', () => {
  it('rates with damage and a speed, gates with FLEE', () => {
    expect(canRate(player())).toBe(true);
    expect(canRate(player({ damage: null }))).toBe(false);
    expect(canRate(player({ perSecond: null }))).toBe(false);
    expect(canGate(player())).toBe(false);
    expect(canGate(player({ flee: 200 }))).toBe(true);
  });

  it('reads melee speed from ASPD and caster speed from seconds per cast', () => {
    // ASPD 150 is exactly one swing a second: 50 / (200 - 150).
    const melee = playerFromNumbers({ damagePerHit: 400, aspd: 150, hit: 290, flee: 260, level: 45 }, 'melee');
    expect(melee).toEqual({ style: 'melee', level: 45, damage: 400, perSecond: 1, hit: 290, flee: 260 });
    const magic = playerFromNumbers({ damagePerHit: 900, castSeconds: 2, hit: 290 }, 'magic');
    expect(magic).toEqual({ style: 'magic', level: null, damage: 900, perSecond: 0.5, hit: null, flee: null });
  });
});

describe('secondsPerKill', () => {
  it('counts misses', () => {
    // hit_100 220 against HIT 200 is 80%: a long fight costs a quarter more time.
    const easy = secondsPerKill(mob(1, { hp: 100000, hit100: 200 }), player())!;
    const hard = secondsPerKill(mob(2, { hp: 100000, hit100: 220 }), player())!;
    expect(easy / hard).toBeCloseTo(0.8, 2);
  });

  it('rounds a partial swing up on a monster that dies fast', () => {
    const easy = secondsPerKill(mob(1, { hp: 1000, hit100: 200 }), player())!;
    const hard = secondsPerKill(mob(2, { hp: 1000, hit100: 220 }), player())!;
    expect(easy / hard).toBeCloseTo(2 / 3, 5);
  });

  it('is null without a rate or without HP', () => {
    expect(secondsPerKill(mob(1), player({ damage: null }))).toBeNull();
    expect(secondsPerKill(mob(1, { hp: null }), player())).toBeNull();
  });

  it('never misses for a caster', () => {
    expect(secondsPerKill(mob(1, { hp: 1000, hit100: 999 }), player({ style: 'magic', hit: null }))).toBe(1);
  });
});

describe('drop factor', () => {
  it('halves only the gap the game confirms', () => {
    expect(dropFactor(60, 18)).toBe(0.5);
    expect(dropFactor(45, 20)).toBe(1);
    expect(dropFactor(45, 40)).toBe(1);
    expect(dropFactor(null, 1)).toBe(1);
  });

  it('tags the halved and the unconfirmed gaps', () => {
    expect(dropTag(60, 18)).toBe('halved');
    expect(dropTag(45, 20)).toBe('unconfirmed');
    expect(dropTag(45, 40)).toBeNull();
    expect(dropTag(null, 1)).toBeNull();
  });
});

describe('steadyPerKill', () => {
  const lucky = mob(1, { drops: [{ rate: 50, sell: 10 }, { rate: 0.01, sell: 1_000_000 }] });

  it('leaves out a drop a night would not see three times', () => {
    // 14,400 kills at 0.01% is 1.44 of the big one: luck.
    expect(steadyPerKill(lucky, 14400, 1)).toBeCloseTo(5, 5);
    // 40,000 kills sees it 4 times: income.
    expect(steadyPerKill(lucky, 40000, 1)).toBeCloseTo(105, 5);
  });

  it('applies the level factor to both the count and the value', () => {
    // Halved, 40,000 kills sees the big one twice: out again.
    expect(steadyPerKill(lucky, 40000, 0.5)).toBeCloseTo(2.5, 5);
  });
});

describe('collapseChannels', () => {
  it('folds equal fingerprints, keeps the shortest code, counts the doors', () => {
    const out = collapseChannels([
      { code: 'gef_fild10_x', fingerprint: 'x', channels: 1 },
      { code: 'other', fingerprint: 'y', channels: 1 },
      { code: 'gef_fild10', fingerprint: 'x', channels: 1 },
    ]);
    expect(out.map((m) => [m.code, m.channels])).toEqual([
      ['gef_fild10', 2],
      ['other', 1],
    ]);
  });
});

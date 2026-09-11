import { describe, expect, it } from 'vitest';
import { comparePlan, topEarners } from './plan';
import { caster, mob, nobody, place, world } from './fixtures';

describe('comparePlan', () => {
  it('keeps the order the player built and names what is gone', () => {
    const { rows, missing } = comparePlan([2, 99, 1], world([mob(1), mob(2)], []), nobody);
    expect(rows.map((r) => r.m.id)).toEqual([2, 1]);
    expect(missing).toEqual([99]);
  });

  it('shows zeny per kill without numbers, after the level factor', () => {
    const plain = comparePlan([1], world([mob(1)], []), nobody).rows[0];
    expect(plain.expPerHour).toBeNull();
    expect(plain.zenyPerHour).toBeNull();
    expect(plain.zenyPerKill).toBeCloseTo(5, 5);

    const far = comparePlan([1], world([mob(1, { level: 18 })], []), { ...nobody, level: 60 }).rows[0];
    expect(far.zenyPerKill).toBeCloseTo(2.5, 5);
    expect(far.dropTag).toBe('halved');
  });

  it('rates one monster at a time with numbers', () => {
    // Two-second kills: 100 EXP and 5z each.
    const row = comparePlan([1], world([mob(1)], []), caster()).rows[0];
    expect(row.expPerHour).toBeCloseTo(180000, 3);
    expect(row.zenyPerHour).toBeCloseTo(9000, 3);
    expect(row.theirHitPct).toBe(5);
  });

  it('points at the walk-in map holding most of it, the calmer one on a tie', () => {
    const data = world(
      [mob(1), mob(3, { isAggressive: true })],
      [place('x', [[1, 5]]), place('y', [[1, 20], [3, 5]]), place('z', [[1, 20]])],
    );
    expect(comparePlan([1], data, nobody).rows[0].homeMap).toEqual({ code: 'z', name: 'z', aggressiveKinds: 0 });
  });

  it('picks the best EXP and the best zeny separately, never a sum', () => {
    const data = world([mob(1), mob(2, { baseExp: 1000, drops: [], perKill: 0 })], []);
    const { bestExp, bestZeny } = comparePlan([1, 2], data, caster());
    expect(bestExp?.m.id).toBe(2);
    expect(bestZeny?.m.id).toBe(1);
  });
});

describe('topEarners', () => {
  it('lists only monsters a bot can farm on a walk-in map, best first', () => {
    const data = world(
      [
        mob(1, { perKill: 5 }),
        mob(2, { perKill: 50, level: 18 }),
        mob(3, { isMvp: true, perKill: 900 }),
        mob(4, { solo: true, perKill: 2700 }),
        mob(5, { perKill: 80 }),
      ],
      [place('a', [[1, 20], [2, 20], [3, 1], [4, 1]])],
    );
    expect(topEarners(data, 10, null).map((e) => [e.m.id, e.value])).toEqual([
      [2, 50],
      [1, 5],
    ]);
    expect(topEarners(data, 10, 60)[0].value).toBeCloseTo(25, 5);
  });
});

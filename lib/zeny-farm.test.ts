import { describe, expect, it } from 'vitest';
import { rankMaps, walkInReason, zenyPerKill, type MonsterValue } from './zeny-farm';

describe('zenyPerKill', () => {
  it('weighs each drop by its chance', () => {
    // 5% of a 100z item plus 50% of a 10z one.
    const { perKill } = zenyPerKill([
      { itemId: 1, rate: 500, sellPrice: 100 },
      { itemId: 2, rate: 5000, sellPrice: 10 },
    ]);
    expect(perKill).toBeCloseTo(10, 5);
  });

  it('counts what it could not price instead of guessing', () => {
    // 3,000 of our items carry no sell price and 410 drop rows no rate. A
    // page that says "at least" needs to know how much it left out.
    const { perKill, unpriced } = zenyPerKill([
      { itemId: 1, rate: 500, sellPrice: 100 },
      { itemId: 2, rate: null, sellPrice: 50 },
      { itemId: 3, rate: 1000, sellPrice: null },
    ]);
    expect(perKill).toBeCloseTo(5, 5);
    expect(unpriced).toBe(2);
  });

  it('is zero for a monster that drops nothing sellable', () => {
    expect(zenyPerKill([]).perKill).toBe(0);
  });
});

describe('walkInReason', () => {
  it('names the places a reader cannot simply walk into', () => {
    // The WoE treasure rooms score five times any real field, so leaving them
    // in makes the top of the list unreachable advice.
    expect(walkInReason('treasure_n1')).toBeTruthy();
    expect(walkInReason('prt_gld')).toBeTruthy();
    expect(walkInReason('1@orcs')).toBeTruthy();
    expect(walkInReason('job_knight')).toBeTruthy();
  });

  it('lets an ordinary field through', () => {
    expect(walkInReason('prt_fild08')).toBeNull();
    expect(walkInReason('moc_fild12')).toBeNull();
    expect(walkInReason('iz_dun02')).toBeNull();
  });
});

const monster = (id: number, perKill: number, hp: number): MonsterValue => ({
  id,
  name: `mob ${id}`,
  level: 10,
  hp,
  perKill,
  unpriced: 0,
});

describe('rankMaps', () => {
  const values = new Map([
    [1, monster(1, 10, 100)],
    [2, monster(2, 1, 100)],
  ]);

  it('ranks by value per HP times how many stand there', () => {
    const picks = rankMaps(
      [
        { mapCode: 'a', monsterId: 1, amount: 20 },
        { mapCode: 'b', monsterId: 2, amount: 20 },
      ],
      values,
    );
    expect(picks.map((p) => p.mapCode)).toEqual(['a', 'b']);
    expect(picks[0].score).toBeCloseTo((10 / 100) * 20, 5);
  });

  it('folds the channel copies into one map', () => {
    // gef_f10_a, _b and _z are one field with three doors; without folding,
    // the top ten is the same place repeated.
    const picks = rankMaps(
      [
        { mapCode: 'gef_f10_a', monsterId: 1, amount: 20 },
        { mapCode: 'gef_f10_b', monsterId: 1, amount: 20 },
      ],
      values,
      { canonicalOf: (code) => (code.startsWith('gef_f10') ? 'gef_fild10' : code) },
    );
    expect(picks).toHaveLength(1);
    expect(picks[0].mapCode).toBe('gef_fild10');
    // The largest count, not the sum: the two doors lead to the same 20
    // monsters, and adding them made a field look twice as busy as it is.
    expect(picks[0].mobs).toBe(20);
  });

  it('drops the places a walk-in cannot reach', () => {
    const picks = rankMaps([{ mapCode: 'treasure_n1', monsterId: 1, amount: 99 }], values);
    expect(picks).toEqual([]);
  });

  it('ignores a map too empty to farm', () => {
    const picks = rankMaps([{ mapCode: 'a', monsterId: 1, amount: 3 }], values, { minMobs: 10 });
    expect(picks).toEqual([]);
  });

  it('names the monsters that carry the score', () => {
    const picks = rankMaps(
      [
        { mapCode: 'a', monsterId: 1, amount: 5 },
        { mapCode: 'a', monsterId: 2, amount: 40 },
      ],
      values,
    );
    expect(picks[0].top[0].id).toBe(1);
    expect(picks[0].top.map((t) => t.id)).toEqual([1, 2]);
  });
});

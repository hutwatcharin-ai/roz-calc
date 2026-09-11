import { describe, expect, it } from 'vitest';
import { walkInReason, zenyPerKill } from './zeny-farm';

describe('zenyPerKill', () => {
  it('weighs each drop by its chance', () => {
    // 5% of a 100z item plus 50% of a 10z one. The rate column is a percent.
    const { perKill } = zenyPerKill([
      { itemId: 1, rate: 5, sellPrice: 100 },
      { itemId: 2, rate: 50, sellPrice: 10 },
    ]);
    expect(perKill).toBeCloseTo(10, 5);
  });

  it('reads the rate as the site stores it: a percent', () => {
    // The real Poring row is about 10.7z a kill. Read on rAthena's per-10,000
    // scale it is 0.1z, which is what the first draft of the zeny page published.
    const { perKill } = zenyPerKill([
      { itemId: 909, rate: 70, sellPrice: 3 },
      { itemId: 938, rate: 4, sellPrice: 35 },
      { itemId: 512, rate: 10, sellPrice: 7 },
      { itemId: 601, rate: 5, sellPrice: 125 },
      { itemId: 1201, rate: 1, sellPrice: 25 },
    ]);
    expect(perKill).toBeCloseTo(10.7, 1);
  });

  it('counts what it could not price instead of guessing', () => {
    const { perKill, unpriced } = zenyPerKill([
      { itemId: 1, rate: 5, sellPrice: 100 },
      { itemId: 2, rate: null, sellPrice: 50 },
      { itemId: 3, rate: 10, sellPrice: null },
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

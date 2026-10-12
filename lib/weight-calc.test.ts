import { describe, expect, it } from 'vitest';
import { load, roomUnder, weightCap } from './weight-calc';

describe('weightCap', () => {
  it("matches the owner's Blacksmith: STR 1, Enlarge Weight Limit 10 reads 5,030", () => {
    expect(weightCap({ cls: 'blacksmith', str: 1, ewl: 10, gym: 0 })).toBe(5030);
  });
  it('gives Enlarge Weight Limit only to the Merchant line, and adds the Gym card', () => {
    expect(weightCap({ cls: 'knight', str: 1, ewl: 10, gym: 0 })).toBe(2000 + 30 + 800);
    expect(weightCap({ cls: 'knight', str: 1, ewl: 0, gym: 10 })).toBe(2000 + 30 + 800 + 2000);
  });
});

describe('load', () => {
  it('sums in tenths so arrows do not drift', () => {
    const l = load(1000, [{ weight: 0.1, qty: 3 }, { weight: 7, qty: 10 }]);
    expect(l.total).toBe(70.3);
    expect(l.left).toBe(929.7);
  });
  it('stops regen at 70% and attacks at 90%', () => {
    expect(load(1000, [{ weight: 1, qty: 699 }]).regen).toBe(true);
    expect(load(1000, [{ weight: 1, qty: 700 }]).regen).toBe(false);
    expect(load(1000, [{ weight: 1, qty: 899 }]).attack).toBe(true);
    expect(load(1000, [{ weight: 1, qty: 900 }]).attack).toBe(false);
  });
});

describe('roomUnder', () => {
  it('counts what still fits below the line', () => {
    // 700 is the line; 693 + 7 would touch it.
    expect(roomUnder(1000, 0, 7, 70)).toBe(99);
    expect(roomUnder(1000, 695, 7, 70)).toBe(0);
    expect(roomUnder(1000, 800, 7, 70)).toBe(0);
    expect(roomUnder(1000, 0, 0.1, 90)).toBe(8999);
  });
});

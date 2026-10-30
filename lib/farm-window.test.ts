import { describe, expect, it } from 'vitest';
import { calcBuild, encodeBuild, EMPTY_BUILD, SAVED_BUILDS_KEY, type Build } from '@/lib/build-calc';
import { buildNumbers, EMPTY_WINDOW, readSavedBuilds, sanitizeWindow, windowNumbers, type FarmWindow } from '@/lib/farm-window';

const knight: FarmWindow = {
  ...EMPTY_WINDOW,
  cls: 'knight',
  lv: 72,
  job: 38,
  wt: 'sword_2h',
  st: { str: 80, agi: 70, vit: 30, int: 1, dex: 45, luk: 1 },
  xb: { str: 12, agi: 9, vit: 4, int: 0, dex: 7, luk: 3 },
};

describe('windowNumbers', () => {
  it('reads HIT and FLEE straight off the two numbers of each stat', () => {
    const n = windowNumbers(knight);
    // HIT = 175 + Lv + DEX + LUK/3; FLEE = 100 + Lv + AGI + LUK/5.
    expect(n.hit).toBe(175 + 72 + 52 + Math.floor(4 / 3));
    expect(n.flee).toBe(100 + 72 + 79 + Math.floor(4 / 5));
    expect(n.level).toBe(72);
    expect(n.vit).toBe(34);
  });

  it('uses the typed bonus instead of the job bonus', () => {
    const none = windowNumbers({ ...knight, xb: { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 } });
    expect(none.flee).toBe(100 + 72 + 70);
  });

  it('gets ASPD from the weapon type, and none for a type the class cannot hold', () => {
    expect(windowNumbers(knight).aspd).toBeGreaterThan(100);
    const bow = windowNumbers({ ...knight, wt: 'bow' });
    expect(bow.aspd).toBeUndefined();
  });

  it('adds buffs on top', () => {
    const blessed = windowNumbers({ ...knight, bf: { blessing: 10 } });
    expect(blessed.hit).toBeGreaterThan(windowNumbers(knight).hit!);
  });
});

describe('sanitizeWindow', () => {
  it('drops a weapon type the class has no ASPD for', () => {
    expect(sanitizeWindow({ ...knight, wt: 'bow' })?.wt).toBe('bare_hand');
  });
  it('refuses an unknown class', () => {
    expect(sanitizeWindow({ ...knight, cls: 'nope' })).toBeNull();
  });
});

describe('buildNumbers', () => {
  it('matches /tools/build for HIT, FLEE and ASPD', () => {
    const b: Build = { ...EMPTY_BUILD, cls: 'knight', lv: 60, job: 30, st: { str: 70, agi: 50, vit: 20, int: 1, dex: 30, luk: 1 } };
    const r = calcBuild(b);
    const n = buildNumbers(b);
    expect(n.hit).toBe(r.hit);
    expect(n.flee).toBe(r.flee);
    expect(n.aspd).toBe(r.aspd ?? undefined);
  });
});

describe('readSavedBuilds', () => {
  it('reads the list /tools/build saves', () => {
    const b: Build = { ...EMPTY_BUILD, cls: 'knight', lv: 60 };
    const store = new Map([[SAVED_BUILDS_KEY, JSON.stringify([{ name: 'ฟาร์ม', b: encodeBuild(b) }, { name: 'พัง', b: '%%%' }])]]);
    const list = readSavedBuilds({ getItem: (k) => store.get(k) ?? null, setItem: () => {} });
    expect(list.map((x) => x.name)).toEqual(['ฟาร์ม']);
    expect(list[0].build.cls).toBe('knight');
  });
});

describe('buildNumbers damage', () => {
  it('gives a damage figure against the dummy', () => {
    const b: Build = { ...EMPTY_BUILD, cls: 'knight', lv: 60, job: 30, st: { str: 70, agi: 50, vit: 20, int: 1, dex: 30, luk: 1 } };
    expect(buildNumbers(b).damagePerHit).toBeGreaterThan(0);
  });
});

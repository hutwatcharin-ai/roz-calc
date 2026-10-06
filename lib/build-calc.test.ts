import { describe, expect, it } from 'vitest';
import { ALL_GEAR, calcBuild, decodeBuild, encodeBuild, fitsSlot, gearById, classFits, type Build, type Target } from './build-calc';

const first = (test: (g: (typeof ALL_GEAR)[string]) => boolean) => Number(Object.entries(ALL_GEAR).find(([, g]) => test(g))![0]);
// Hood: a garment with a card slot and no effects of its own.
const GARMENT = 480414;

const base: Build = {
  cls: 'thief',
  lv: 50,
  job: 1,
  st: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
  g: {},
  f: [],
};

describe('calcBuild status window', () => {
  it('follows the measured formulas with bare stats', () => {
    const r = calcBuild({ ...base, st: { str: 1, agi: 50, vit: 1, int: 1, dex: 40, luk: 30 } });
    // Job 1 adds nothing for a Thief.
    expect(r.hit).toBe(175 + 50 + 40 + 10);
    expect(r.flee).toBe(100 + 50 + 50 + 6);
    expect(r.crit).toBe(10.5);
    expect(r.pd).toBe(4);
    expect(r.used).toBeGreaterThan(0);
    expect(r.budget).toBeGreaterThan(r.used);
  });

  it('counts a weapon, its refine and cards', () => {
    const r = calcBuild({ ...base, g: { weapon: { id: 1201, r: 4, c: [4029, 4006, 0] } } });
    // Knife 17 ATK + weapon level 1 at +4 = 8.
    expect(r.atk.equip).toBe(17 + 8);
    // Wolf crit +1, Lunatic crit +1 and LUK +1.
    expect(r.total.luk).toBe(2);
    expect(r.crit).toBe(Math.floor((1 + 2 * 0.3 + 0.5) * 10) / 10 + 2);
    expect(r.counted.some((l) => l.from === 'Wolf Card')).toBe(true);
  });

  it('adds armour refine DEF', () => {
    const r = calcBuild({ ...base, g: { armor: { id: 2301, r: 4, c: [] } } });
    expect(r.def.hard).toBe(10 + 16);
  });

  it('skips lines whose refine is not reached, with the reason', () => {
    const r = calcBuild({ ...base, cls: 'priest', lv: 60, g: { weapon: { id: 26148, r: 6, c: [0] } } });
    expect(r.skipped.find((l) => l.why === 'ต้องตีบวก +7 ขึ้นไป')).toBeTruthy();
    // The −10% cast line always holds.
    expect(r.vct).toBeCloseTo(Math.max(0, 1 - Math.sqrt((2 * r.total.dex + r.total.int) / 530)) * 0.9);
    // A Priest wears Acolyte gear.
    expect(r.warnings.filter((w) => w.includes('อาชีพนี้ใส่ไม่ได้'))).toEqual([]);
  });

  it('never adds a text-only condition, and counts the combo once both cards are worn', () => {
    const one = calcBuild({ ...base, g: { garment: { id: GARMENT, r: 0, c: [4183] } } });
    expect(one.flee).toBe(100 + 50 + 1 + 0);
    expect(one.skipped.some((l) => l.from === 'Vagabond Wolf Card')).toBe(true);
    const both = calcBuild({ ...base, g: { weapon: { id: 1201, r: 0, c: [4029, 0, 0] }, garment: { id: GARMENT, r: 0, c: [4183] } } });
    expect(both.counted.some((l) => l.from.startsWith('เซ็ต '))).toBe(true);
  });

  it('counts only the larger of two foods for the same stat', () => {
    const r = calcBuild({ ...base, f: [12062, 12065] });
    expect(r.total.dex).toBe(1 + 5);
    expect(r.warnings.some((w) => w.includes('นับแค่อันที่มากกว่า'))).toBe(true);
  });

  it('warns past the stat budget', () => {
    const r = calcBuild({ ...base, lv: 1, st: { str: 99, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 } });
    expect(r.warnings.some((w) => w.startsWith('ใช้แต้มเกิน'))).toBe(true);
  });
});

describe('against a monster', () => {
  const mob: Target = {
    name: 'Test', level: 40, vit: 20, def: 30, size: 'Medium', element: 'Water', element_level: 1, race: 'Fish', boss: false,
    hit_100: 300, flee_95: 280,
  };

  it('says how much HIT and FLEE are missing', () => {
    const r = calcBuild({ ...base, st: { str: 1, agi: 1, vit: 1, int: 1, dex: 40, luk: 1 } }, mob);
    expect(r.vs?.hitShort).toBe(300 - r.hit);
    expect(r.vs?.hitChance).toBe(100 + r.hit - 300);
    expect(r.vs?.fleeShort).toBe(280 - r.flee);
    expect(r.vs?.damage).toBeGreaterThan(0);
  });

  it('raises damage only for a matching race line', () => {
    const plain = calcBuild({ ...base, g: { weapon: { id: 1201, r: 0, c: [0, 0, 0] } } }, mob);
    expect(plain.vs?.multiplier).toBe(1);
  });
});

describe('gear rules', () => {
  it('lets second classes wear first-class gear', () => {
    expect(classFits('knight', ['swordsman'])).toBe(true);
    expect(classFits('wizard', ['swordsman'])).toBe(false);
    expect(classFits('novice', undefined)).toBe(true);
  });

  it('puts a two-slot accessory in either slot', () => {
    const mitten = gearById(2617)!;
    expect(fitsSlot(mitten, 'accessory_1')).toBe(true);
    expect(fitsSlot(mitten, 'accessory_2')).toBe(true);
    expect(fitsSlot(mitten, 'armor')).toBe(false);
  });

  it('warns about a shield with a two-handed weapon', () => {
    const bow = first((g) => g.wt === 'bow');
    const shield = first((g) => g.on[0] === 'shield');
    const r = calcBuild({ ...base, cls: 'archer', g: { weapon: { id: bow, r: 0, c: [] }, shield: { id: shield, r: 0, c: [] } } });
    expect(r.warnings).toContain('อาวุธสองมือใส่คู่กับโล่ไม่ได้');
  });
});

describe('share link', () => {
  it('round-trips a build', () => {
    const b: Build = { ...base, g: { weapon: { id: 1201, r: 7, c: [4029, 0, 0] } }, f: [12065] };
    expect(decodeBuild(encodeBuild(b))).toEqual({ ...b, siege: undefined });
  });

  it('drops what it cannot read', () => {
    expect(decodeBuild('not-a-build')).toBeNull();
    const b = decodeBuild(encodeBuild({ ...base, st: { ...base.st, str: 500 }, g: { weapon: { id: 99999999, r: 3, c: [] } } }));
    expect(b?.st.str).toBe(99);
    expect(b?.g.weapon).toBeUndefined();
  });
});

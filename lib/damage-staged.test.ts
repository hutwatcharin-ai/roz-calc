import { describe, expect, it } from 'vitest';
import { castSeconds, magicStaged, mulOper, physicalStaged, trapStaged, usesPerSecond, type PhysicalInput } from './damage-staged';

// The eight cases captured from Landgris's live calculator in ROZ Global mode
// on 15 Oct 2026 (C:\Users\ASUS\landgris-research\evidence\scenarios.json):
// BLv 80, STR 80 AGI 60 VIT 40 INT 70 DEX 80 LUK 20, a weapon level 3 with
// ATK 150 / MATK 120 at +0, no cards or buffs, against a Lv 10 Neutral 1
// Medium target with soft DEF 5 and soft MDEF 2. Status ATK 122, status MATK 147.
const base: PhysicalInput = {
  weaponAtk: 150,
  weaponLevel: 3,
  weaponStat: 80,
  refineAtk: 0,
  sizePct: 100,
  equipAtk: 0,
  kinds: [],
  atkPercent: 0,
  elementPct: 100,
  statusAtk: 122,
  statusTimes: 2,
  neutralPct: 100,
  mastery: 0,
  rangedPct: 0,
  skillPercent: null,
  skillDamagePct: 0,
  hardDef: 0,
  softDef: 5,
};

describe('mulOper', () => {
  it('rounds up under 1 when a fraction is left, down otherwise', () => {
    expect(mulOper(101, 0.75)).toBe(76);
    expect(mulOper(101, 1.5)).toBe(151);
    expect(mulOper(431, 1.9)).toBe(818);
  });
});

describe('physicalStaged against the live captures', () => {
  it('auto-attack with a katar: 426-471, crit 659', () => {
    expect(physicalStaged(base)).toEqual({ min: 426, max: 471 });
    expect(physicalStaged({ ...base, crit: true })).toEqual({ min: 659, max: 659 });
  });
  it('Sonic Blow Lv 10 (Global 1,100%, total shown as 8 hits): 4,736-5,224', () => {
    expect(physicalStaged({ ...base, skillPercent: 1100, hits: -8 })).toEqual({ min: 4736, max: 5224 });
  });
  it('Double Strafe Lv 10 with a bow: 190% x 2 = 1,626-1,798', () => {
    expect(physicalStaged({ ...base, skillPercent: 190, hits: 2 })).toEqual({ min: 1626, max: 1798 });
  });
  it('a two-handed sword on Medium (75%): auto 379-413, Bowling Bash Lv 10 x 4 = 8,888-9,676', () => {
    const sword = { ...base, sizePct: 75 };
    expect(physicalStaged(sword)).toEqual({ min: 379, max: 413 });
    expect(physicalStaged({ ...sword, skillPercent: 100 + 40 * 10 + 80, hits: 4 })).toEqual({ min: 8888, max: 9676 });
  });
  it('Back Stab Lv 10 with a dagger: 700% x 2 = 5,366-5,842', () => {
    expect(physicalStaged({ ...base, sizePct: 75, skillPercent: 700, hits: 2 })).toEqual({ min: 5366, max: 5842 });
  });
  it('Axe Tornado Lv 5 (Global formula, total as 6 hits): 18,042-19,638', () => {
    expect(physicalStaged({ ...base, sizePct: 75, skillPercent: 800 + 700 * 5 + 40 * 10, hits: -6 })).toEqual({ min: 18042, max: 19638 });
  });
  it('weapon ATK grows with STR: STR 0 drops the weapon part by STR/200', () => {
    expect(physicalStaged({ ...base, weaponStat: 0 }).max).toBeLessThan(physicalStaged(base).max);
  });
});

describe('magic, trap and timing against the live captures', () => {
  it('Fire Bolt Lv 10 at INT 70 (135% x 10): 3,090 at the bottom', () => {
    const r = magicStaged({ statusMatk: 147, weaponMatk: 120, weaponLevel: 3, equipMatk: 0, matkPercent: 0, kinds: [], skillPercent: 135, hardMdef: 0, softMdef: 2, skillDamagePct: 0, elementPct: 100, hits: 10 });
    expect(r.min).toBe(3090);
  });
  it('Land Mine Lv 5: 4,560-5,016', () => {
    expect(trapStaged(5, 80, 80, 70, 100, 0)).toEqual({ min: 4560, max: 5016 });
  });
  it('Fire Bolt cast 2.2919 s and 0.33 uses a second', () => {
    const cast = castSeconds(3.2, 1.2, 80, 70, 0, 0);
    expect(cast).toBe(2.2919);
    expect(usesPerSecond(cast, 0.7, 156)).toBe(0.33);
  });
  it('Sonic Blow: no cast, 1 s cooldown, one use a second', () => {
    expect(usesPerSecond(0, 1, 167)).toBe(1);
  });
});

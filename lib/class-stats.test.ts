import { describe, expect, it } from 'vitest';
import { aspdFor, baseHpSp, jobBonusAt, minLevelFor, rowMinLevel, statBudget, statCost, statFromText } from './class-stats';

describe('stat points', () => {
  it('matches the Blacksmith builds given on 6 Oct 2026 (Lv60 555 points, Lv70 710)', () => {
    expect(statBudget(60)).toBe(555);
    expect(statBudget(70)).toBe(710);
    const spent = (s: number[]) => s.reduce((t, v) => t + statCost(v), 0);
    expect(spent([63, 1, 31, 42, 15, 1])).toBe(554);
    expect(spent([72, 1, 36, 51, 15, 1])).toBe(706);
  });
  it('costs 2 a point to 11, then 3', () => {
    expect(statCost(1)).toBe(0);
    expect(statCost(11)).toBe(20);
    expect(statCost(12)).toBe(23);
  });
  it('finds the lowest level for a budget', () => {
    expect(minLevelFor(48)).toBe(1);
    expect(minLevelFor(555)).toBe(60);
    expect(minLevelFor(99999)).toBeNull();
  });
});

describe('guide stat rows', () => {
  it('reads the numbers players write', () => {
    expect(statFromText('63')).toBe(63);
    expect(statFromText('~15 ตั้งแต่ต้น')).toBe(15);
    expect(statFromText('90-99')).toBe(90);
    expect(statFromText('หลัก')).toBeNull();
    expect(statFromText(undefined)).toBeNull();
  });
  it('says what level a row needs', () => {
    // midgardhub's Knight: STR 99, INT 70, DEX 50 from the low ends.
    const r = rowMinLevel({ str: '99', int: '70-80', dex: '50-60', vit: 'ที่เหลือ' })!;
    expect(r.complete).toBe(false);
    expect(r.level).toBeGreaterThan(70);
    expect(rowMinLevel({ str: 'หลัก', dex: '20' })).toBeNull();
  });
});

describe('class numbers', () => {
  it('counts Job bonuses', () => {
    const b = jobBonusAt('blacksmith', 60);
    expect(Object.values(b).reduce((a, v) => a + v, 0)).toBe(38);
  });
  it('flags HP/SP that prontera only estimates', () => {
    expect(baseHpSp('acolyte', 50)?.measured).toBe(true);
    expect(baseHpSp('knight', 60)?.measured).toBe(false);
    expect(baseHpSp('knight', 60)?.calibrated).toBe(false);
  });
  it('scales a class to a status window read in game', () => {
    // prontera's table says 1984 / 250 at Lv 60; the owner's naked Blacksmith
    // (VIT 6, INT 6) shows 1840 / 231, so the base is 1736 / 218.
    expect(baseHpSp('blacksmith', 60)).toEqual({ hp: 1736, sp: 218, measured: false, calibrated: true });
    expect(baseHpSp('blacksmith', 30)!.hp).toBeLessThan(1736);
  });
  it('gives base ASPD by weapon, with the shield penalty', () => {
    // 150 + sqrt(1/2 + 225/5)/4 = 151.69
    expect(aspdFor('blacksmith', 'axe_1h', 1, 15)).toBe(151.6);
    expect(aspdFor('blacksmith', 'axe_1h', 1, 15, { shield: true })).toBe(146.6);
    expect(aspdFor('blacksmith', 'bow', 1, 15)).toBeNull();
  });
});

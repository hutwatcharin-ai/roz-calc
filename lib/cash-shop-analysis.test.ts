import { describe, expect, it } from 'vitest';
import { CATEGORY_LABELS, categorize, durationDays, pairBaseName, thbPerDay, topUpPlan } from './cash-shop-analysis';

// Strings below are verbatim from the captured cash_shop_items rows.
describe('durationDays', () => {
  it('reads the name suffix first', () => {
    expect(durationDays({ name_en: 'Account Death Penalty Buff Box - 7 Days' })).toBe(7);
    expect(durationDays({ name_en: 'Boarding Halter Box - 30 Days' })).toBe(30);
  });
  it('falls back to the Thai description', () => {
    expect(durationDays({ name_en: 'Account EXP Buff Box', description_th: '[อายุใช้งาน] 30 วันหลังใช้ [มีผลกับ] ทุกตัวละคร' })).toBe(30);
    expect(durationDays({ name_en: 'Kafra Storage Bell Box', description_th: 'กล่องบรรจุ Kafra Storage Bell ใช้ได้ 30 วัน' })).toBe(30);
  });
  it('permanent goods have none', () => {
    expect(durationDays({ name_en: 'Zelstar 40ea Box', description_th: 'กล่องบรรจุ Zelstar 40 เม็ด' })).toBeNull();
  });
});

describe('pairing and per-day cost', () => {
  it('7d and 30d variants share a base name', () => {
    expect(pairBaseName('Essential Package - 7 Days')).toBe('Essential Package');
    expect(pairBaseName('Essential Package')).toBe('Essential Package');
  });
  it('pinned: Death Penalty 30d is ฿3.73/วัน, 7d is ฿5.94/วัน', () => {
    const d30 = thbPerDay(3500, { name_en: 'Account Death Penalty Buff Box', description_th: '[อายุใช้งาน] 30 วันหลังใช้' })!;
    const d7 = thbPerDay(1300, { name_en: 'Account Death Penalty Buff Box - 7 Days' })!;
    expect(d30).toBeCloseTo(3.7333, 3);
    expect(d7).toBeCloseTo(5.9428, 3);
    expect(Math.round((1 - d30 / d7) * 100)).toBe(37); // the badge percentage
  });
});

describe('categorize', () => {
  it.each([
    ['Account EXP Buff Box', 'บัฟ'],
    ['Growth Elixir 5ea Box', 'บัฟ'],
    ['Costume Mystery Wing Box', 'คอสตูม'],
    ['Baby Shark Doll Package', 'คอสตูม'],
    ['HD Bradium 10ea Box', 'ตีบวก'],
    ['Enriched Abrasive 10ea Box', 'ตีบวก'],
    ['Shining Sword Box', 'ชุดเริ่มต้น'],
    ['Launch Celebration Consumables Package', 'แพ็กเกจ'],
    ['Kafra Storage Bell Box', 'ของใช้'],
    ['STR Reduction Potion', 'ของใช้'],
  ])('%s -> %s', (name, label) => {
    expect(CATEGORY_LABELS[categorize({ name_en: name })]).toBe(label);
  });
});

describe('topUpPlan', () => {
  it('rounds up to the next 1,000 KP and prices at 32 THB per 1,000', () => {
    const p = topUpPlan(7800);
    expect(p.buyKp).toBe(8000);
    expect(p.thb).toBe(256);
    expect(p.leftoverKp).toBe(200);
    expect(p.packs).toEqual([
      { size: 5000, count: 1 },
      { size: 1000, count: 3 },
    ]);
  });
  it('exact multiples leave nothing over', () => {
    const p = topUpPlan(25000);
    expect(p.buyKp).toBe(25000);
    expect(p.leftoverKp).toBe(0);
    expect(p.packs).toEqual([{ size: 25000, count: 1 }]);
  });
});

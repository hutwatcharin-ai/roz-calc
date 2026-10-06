import { describe, expect, it } from 'vitest';
import { BONUS_TYPES, bonusText, conditionText, effectTypes, isPenalty, itemEffects, refineBonusAt } from './item-effects';

describe('item effects', () => {
  it("reads Thara Frog Card as 30% less damage from demi-humans", () => {
    const frog = itemEffects(4058)!;
    expect(frog.g![0].b[0]).toEqual(['damage_taken_percent', -30, 'race:demi_human', null, null]);
    expect(bonusText(frog.g![0].b[0])).toBe('ดาเมจที่โดนจากเผ่ากึ่งมนุษย์ -30%');
    expect(isPenalty(frog.g![0].b[0])).toBe(false);
  });

  it('says what a bonus is aimed at and how it scales', () => {
    expect(bonusText(['damage_percent', 20, 'race:insect', null, null])).toBe('ตีเผ่าแมลง +20%');
    expect(bonusText(['damage_percent', 25, 'monster_kind:boss', null, null])).toBe('ตีบอส +25%');
    expect(bonusText(['matk', 5, null, 2, null])).toBe('MATK +5 ทุก +2');
    expect(bonusText(['cast_time_variable_percent', -30, null, null, 'Land Protector'])).toBe('ร่ายแปรผัน Land Protector -30%');
    expect(bonusText(['resistance_percent', 20, 'status:petrify', null, null])).toBe('กันหิน +20%');
    // Alchemist Essence: ATK grows with the level of a skill, not a flat +3.
    expect(bonusText(itemEffects(29561)!.g![0].b.find((b) => b[0] === 'atk')!)).toBe('ATK +3 ต่อเลเวล Prepare Potion');
  });

  it('marks the drawbacks, not the good minuses', () => {
    expect(isPenalty(['hp_percent', -2, null, null, null])).toBe(true);
    expect(isPenalty(['cast_time_variable_percent', -10, null, null, null])).toBe(false);
    expect(isPenalty(['sp_cost_percent', 10, null, null, null])).toBe(true);
  });

  it('puts a condition into words', () => {
    expect(conditionText({})).toBeNull();
    expect(conditionText({ refine: 7, siege: true })).toBe('ตีบวก +7 ขึ้นไป · เฉพาะในวอร์');
  });

  it('labels every bonus type the data uses', () => {
    const file = require('../data/item-effects.json') as { items: Record<string, { g?: { b: [string][] }[] }> };
    const used = new Set(Object.values(file.items).flatMap((e) => (e.g ?? []).flatMap((g) => g.b.map((b) => b[0]))));
    for (const type of used) expect(BONUS_TYPES[type], type).toBeDefined();
  });

  it('gives refine totals, not steps (a level 3 weapon jumps after +15)', () => {
    expect(refineBonusAt('weapon_lv3', 10)).toEqual({ stat: 'ATK', value: 50 });
    expect(refineBonusAt('weapon_lv3', 16)).toEqual({ stat: 'ATK', value: 134 });
    expect(refineBonusAt('armor', 7)).toEqual({ stat: 'DEF', value: 49 });
    expect(refineBonusAt(undefined, 7)).toBeNull();
  });

  it('lists the effect types an item has', () => {
    expect(effectTypes(itemEffects(4058))).toEqual(new Set(['damage_taken_percent']));
    expect(effectTypes(null).size).toBe(0);
  });
});

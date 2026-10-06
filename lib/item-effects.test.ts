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

  it('gives refine totals from the official table, high-refine extra included', () => {
    // Level 3 weapon at +10: base 50 plus the extra 40 the official guide prints.
    expect(refineBonusAt('weapon_lv3', 10)).toEqual({ stat: 'ATK', value: 90 });
    expect(refineBonusAt('weapon_lv3', 16)).toEqual({ stat: 'ATK', value: 222 });
    expect(refineBonusAt('armor', 7)).toEqual({ stat: 'DEF', value: 49 });
    expect(refineBonusAt(undefined, 7)).toBeNull();
  });

  it('lists the effect types an item has', () => {
    expect(effectTypes(itemEffects(4058))).toEqual(new Set(['damage_taken_percent']));
    expect(effectTypes(null).size).toBe(0);
  });
});

describe('item effects caveats', () => {
  it('keeps a space between a Latin label and a Thai target', () => {
    expect(bonusText(['ignore_mdef_percent', 10, 'player', null, null])).toBe('ทะลุ MDEF ผู้เล่น +10%');
  });
  it("flags Eclipse Card's FLEE +18, which only holds with Lunatic Card", () => {
    const eclipse = itemEffects(4266)!;
    const flee = eclipse.g!.find((g) => g.b.some((b) => b[0] === 'flee'))!;
    expect(conditionText(flee.c)).toBe('มีเงื่อนไข ดูข้อความในเกม');
  });
});

describe('numbers from our own card text', () => {
  it('gives Andre Card ATK +20 where prontera had nothing, and skips combo clauses', () => {
    expect(itemEffects(4043)).toMatchObject({ src: 'text', g: [{ c: {}, b: [['atk', 20, null, null, null]] }] });
    // Kobold Archer-style combos: only the card's own line, not the set's STR +10.
    expect(effectTypes(itemEffects(4246))).toEqual(new Set(['crit_damage_percent']));
  });
});

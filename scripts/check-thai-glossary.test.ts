import { describe, it, expect } from 'vitest';
import { checkTranslation, MUST_STAY_ENGLISH } from './check-thai-glossary';

describe('checkTranslation — numbers', () => {
  it('passes when every number survives', () => {
    const issues = checkTranslation('ATK +5 and DEF +3.', 'ATK +5 และ DEF +3');
    expect(issues.filter((i) => i.rule === 'number-mismatch')).toHaveLength(0);
  });

  it('catches a number that changed', () => {
    const issues = checkTranslation('Adds a 6% chance.', 'มีโอกาส 9%');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('catches a number that was dropped', () => {
    // The Baphomet Card case from spec section 1: the official Thai lost the
    // HIT -10 line entirely. That is the failure this rule exists to catch.
    const issues = checkTranslation('9-cell splash. HIT -10.', 'กระจาย 9 ช่อง');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('catches a number that was added', () => {
    const issues = checkTranslation('Unbreakable.', 'ไม่แตก 100%');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('ignores the order numbers appear in when each keeps its own stat', () => {
    // Thai word order legitimately moves whole phrases around. This is the
    // legitimate case: +5 is still ATK's and +3 is still DEF's, only the two
    // clauses swapped. Contrast with the transposition test below, where the
    // numbers changed hands.
    const issues = checkTranslation('ATK +5, DEF +3', 'DEF +3 และ ATK +5');
    expect(issues.filter((i) => i.rule === 'number-mismatch')).toHaveLength(0);
  });

  it('catches a sign that flipped', () => {
    // A penalty turned into a bonus. The digits are identical, so a rule that
    // strips the sign reports nothing at all.
    const issues = checkTranslation('HIT -10.', 'HIT +10');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('catches a percent that was dropped', () => {
    // "5" and "5%" are different quantities. Stripping the unit makes a flat
    // -5 damage reduction and a -5% one look like the same translation.
    const issues = checkTranslation('Reduces damage by 5%.', 'ลดความเสียหาย 5');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('catches two numbers that swapped stats', () => {
    // The multiset {3, 5} is unchanged, so an order-insensitive comparison of
    // bare digits cannot see this. ATK now gets DEF's number and vice versa --
    // every quantity on the line is wrong.
    const issues = checkTranslation('ATK +5, DEF +3', 'ATK +3 และ DEF +5');
    expect(issues.some((i) => i.rule === 'number-mismatch')).toBe(true);
  });

  it('does not demand an anchor the source never had', () => {
    // The number is not preceded by a glossary term in either language, so it
    // is compared on its own and Thai prose around it is free to differ.
    const issues = checkTranslation('Adds a 6% chance to stun.', 'มีโอกาส 6% ทำให้สตัน');
    expect(issues.filter((i) => i.rule === 'number-mismatch')).toHaveLength(0);
  });
});

describe('checkTranslation — terms that must stay English', () => {
  it('passes when the term is carried through', () => {
    const issues = checkTranslation(
      'Chance to inflict Curse on the attacker.',
      'มีโอกาสร่าย Curse ใส่ผู้โจมตี',
    );
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('catches a status ailment that was translated away', () => {
    const issues = checkTranslation('Chance to inflict Curse.', 'มีโอกาสทำให้ติดคำสาป');
    expect(issues.some((i) => i.rule === 'must-stay-english' && i.detail.includes('Curse'))).toBe(true);
  });

  it('catches an element that was translated away', () => {
    const issues = checkTranslation('Fire-Property Resistance +10%.', 'ต้านทานธาตุไฟ +10%');
    expect(issues.some((i) => i.rule === 'must-stay-english' && i.detail.includes('Fire'))).toBe(true);
  });

  it('matches a term only as a whole word', () => {
    // "Fired" contains "Fire" but is not the element.
    const issues = checkTranslation('The arrow is Fired.', 'ลูกศรถูกยิงออกไป');
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('does not read an equip slot inside a longer label name', () => {
    // 155 lines read `Weapon Level : N`. "Weapon" there is part of the label
    // NAME, and translating the label name is exactly what batch 1 does, so
    // treating it as the equip slot flags all 155 -- the only complaint across
    // 3,535 composed lines, and every one of them a false positive.
    const issues = checkTranslation('Weapon Level : 3', 'ระดับอาวุธ : 3');
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('still catches an equip slot translated away as a value', () => {
    const issues = checkTranslation('Type : Weapon', 'ประเภท : อาวุธ');
    expect(issues.some((i) => i.rule === 'must-stay-english' && i.detail.includes('Weapon'))).toBe(true);
  });

  it('does not read an equip slot inside a bare label name', () => {
    // The term row itself, not the composed line: `Weapon Level` is stored and
    // translated as one term, so there is no colon to separate name from value.
    const issues = checkTranslation('Weapon Level', 'ระดับอาวุธ');
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('accepts an equip slot carried through as the whole value', () => {
    const issues = checkTranslation('Equipped on : Armor', 'ช่องที่ใส่ : Armor');
    expect(issues.filter((i) => i.rule === 'must-stay-english')).toHaveLength(0);
  });

  it('holds every category the glossary names', () => {
    for (const t of ['Curse', 'Fire', 'Brute', 'Perfect Dodge', 'ATK', 'Armor']) {
      expect(MUST_STAY_ENGLISH).toContain(t);
    }
  });
});

describe('checkTranslation — untranslated lines', () => {
  it('flags a translation with no Thai characters at all', () => {
    const issues = checkTranslation('Unbreakable.', 'Unbreakable.');
    expect(issues.some((i) => i.rule === 'no-thai-characters')).toBe(true);
  });

  it('does not flag a line that has Thai in it', () => {
    const issues = checkTranslation('Unbreakable.', 'ไม่แตก');
    expect(issues.filter((i) => i.rule === 'no-thai-characters')).toHaveLength(0);
  });
});

describe('checkTranslation — numbers, anchored to glossary terms', () => {
  it('accepts a glossary term that moves next to the number', () => {
    // Live case, 14 lines: the English reads "FLEE Rate +5", so nothing is
    // anchored to FLEE there, while the Thai renders "อัตรา FLEE +5" and puts
    // FLEE right in front of the number. The quantity did not move.
    const issues = checkTranslation('FLEE Rate +5.', 'อัตรา FLEE +5');
    expect(issues.filter((i) => i.rule === 'number-mismatch')).toHaveLength(0);
  });

  it('reports a swap once, not twice', () => {
    const issues = checkTranslation('ATK +5, DEF +3', 'ATK +3 และ DEF +5');
    const mismatches = issues.filter((i) => i.rule === 'number-mismatch');
    expect(mismatches).toHaveLength(2); // one per stat that lost its number
    expect(mismatches.every((i) => /ATK|DEF/.test(i.detail))).toBe(true);
  });
});

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

  it('ignores the order numbers appear in', () => {
    const issues = checkTranslation('ATK +5, DEF +3', 'DEF +3, ATK +5');
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

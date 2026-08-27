import { describe, it, expect } from 'vitest';
import { canJobEquip, EQUIPMENT_CATEGORIES } from './equip-filter';

describe('canJobEquip', () => {
  it('matches an exact job name', () => {
    expect(canJobEquip(['Swordsman', 'Knight'], 'Swordsman')).toBe(true);
  });

  it('includes items marked All Jobs', () => {
    // 166 items carry this. Matching job names alone would hide every item
    // that any job can wear -- most of the useful results.
    expect(canJobEquip(['All Jobs'], 'Wizard')).toBe(true);
  });

  it('includes All Jobs except Novice for a non-Novice job', () => {
    expect(canJobEquip(['All Jobs except Novice'], 'Knight')).toBe(true);
  });

  it('excludes All Jobs except Novice for Novice itself', () => {
    expect(canJobEquip(['All Jobs except Novice'], 'Novice')).toBe(false);
  });

  it('does not match an unrelated job', () => {
    expect(canJobEquip(['Swordsman'], 'Mage')).toBe(false);
  });

  it('returns false for a null class list rather than throwing', () => {
    expect(canJobEquip(null, 'Knight')).toBe(false);
  });

  it('returns false for an empty class list', () => {
    expect(canJobEquip([], 'Knight')).toBe(false);
  });

  it('is case-insensitive on the job name', () => {
    expect(canJobEquip(['Swordsman'], 'swordsman')).toBe(true);
  });
});

describe('EQUIPMENT_CATEGORIES', () => {
  it('is exactly the three categories that make up the 490 wearable items', () => {
    expect([...EQUIPMENT_CATEGORIES]).toEqual(['Armor', 'Weapon', 'Costume Equipment']);
  });
});

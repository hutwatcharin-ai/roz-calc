import { describe, it, expect } from 'vitest';
import { canJobEquip, isUnclassifiedClass, EQUIPMENT_CATEGORIES } from './equip-filter';
import { isZeroJob } from './zero-jobs';

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

  it('parses All Jobs except Summoner generically', () => {
    // Item [Costume] Tear (Bound) has this. Should match Knight but not Summoner.
    expect(canJobEquip(['All Jobs except Summoner'], 'Knight')).toBe(true);
    expect(canJobEquip(['All Jobs except Summoner'], 'Summoner')).toBe(false);
  });

  it('matches any job when the class is unclassified (Thief Classes)', () => {
    expect(canJobEquip(['Thief Classes'], 'Knight')).toBe(true);
    expect(canJobEquip(['Thief Classes'], 'Wizard')).toBe(true);
  });

  it('matches any job when the class is unclassified (Swordman typo)', () => {
    expect(canJobEquip(['Swordman'], 'Knight')).toBe(true);
    expect(canJobEquip(['Swordman'], 'Mage')).toBe(true);
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

describe('isZeroJob', () => {
  it('recognizes real Zero jobs', () => {
    expect(isZeroJob('Swordsman')).toBe(true);
    expect(isZeroJob('Knight')).toBe(true);
    expect(isZeroJob('Novice')).toBe(true);
  });

  it('rejects Super Novice (not playable in Zero)', () => {
    expect(isZeroJob('Super Novice')).toBe(false);
  });

  it('rejects Ninja (in data but not playable in Zero)', () => {
    expect(isZeroJob('Ninja')).toBe(false);
  });

  it('rejects Soul Linker (in data but not playable in Zero)', () => {
    expect(isZeroJob('Soul Linker')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isZeroJob('swordsman')).toBe(true);
    expect(isZeroJob('KNIGHT')).toBe(true);
  });
});

describe('isUnclassifiedClass', () => {
  it('recognizes unclassified entries', () => {
    expect(isUnclassifiedClass('Thief Classes')).toBe(true);
    expect(isUnclassifiedClass('Newbie cannot smoke')).toBe(true);
    expect(isUnclassifiedClass('Swordman')).toBe(true);
  });

  it('recognizes real Zero jobs as classified', () => {
    expect(isUnclassifiedClass('Swordsman')).toBe(false);
    expect(isUnclassifiedClass('Knight')).toBe(false);
  });

  it('recognizes All Jobs forms as classified', () => {
    expect(isUnclassifiedClass('All Jobs')).toBe(false);
    expect(isUnclassifiedClass('All Jobs except Novice')).toBe(false);
    expect(isUnclassifiedClass('All Jobs except Summoner')).toBe(false);
  });

  it('is case-insensitive on job matching', () => {
    expect(isUnclassifiedClass('swordsman')).toBe(false);
  });
});

describe('EQUIPMENT_CATEGORIES', () => {
  it('is exactly the three categories that make up the 490 wearable items', () => {
    expect([...EQUIPMENT_CATEGORIES]).toEqual(['Armor', 'Weapon', 'Costume Equipment']);
  });
});

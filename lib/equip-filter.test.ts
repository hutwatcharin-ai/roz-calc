import { describe, it, expect } from 'vitest';
import { canJobEquip, isUnclassifiedClass, EQUIPMENT_CATEGORIES } from './equip-filter';
import { isZeroJob, isKnownNonZeroJob } from './zero-jobs';

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

  it('does not match any job when the class is a known non-Zero job (Ninja)', () => {
    expect(canJobEquip(['Ninja'], 'Swordsman')).toBe(false);
    expect(canJobEquip(['Ninja'], 'Knight')).toBe(false);
  });

  it('does not match any job when the class is a known non-Zero job (Soul Linker)', () => {
    expect(canJobEquip(['Soul Linker'], 'Knight')).toBe(false);
    expect(canJobEquip(['Soul Linker'], 'Wizard')).toBe(false);
  });

  it('allows one usable entry to override an unusable one on the same item', () => {
    // An unusable entry (Ninja) must not veto a usable one (All Jobs) on the same item.
    expect(canJobEquip(['Ninja', 'All Jobs'], 'Knight')).toBe(true);
    expect(canJobEquip(['Soul Linker', 'Swordsman'], 'Swordsman')).toBe(true);
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

describe('isKnownNonZeroJob', () => {
  it('recognizes non-Zero jobs', () => {
    expect(isKnownNonZeroJob('Ninja')).toBe(true);
    expect(isKnownNonZeroJob('Soul Linker')).toBe(true);
  });

  it('rejects Zero jobs', () => {
    expect(isKnownNonZeroJob('Swordsman')).toBe(false);
    expect(isKnownNonZeroJob('Knight')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isKnownNonZeroJob('ninja')).toBe(true);
    expect(isKnownNonZeroJob('SOUL LINKER')).toBe(true);
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

  it('recognizes non-Zero jobs as classified', () => {
    expect(isUnclassifiedClass('Ninja')).toBe(false);
    expect(isUnclassifiedClass('Soul Linker')).toBe(false);
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

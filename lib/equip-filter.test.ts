import { describe, it, expect } from 'vitest';
import { canJobEquip, isUnclassifiedClass } from './equip-filter';
import { GEAR_CATEGORIES } from './item-href';
import { isZeroJob, isKnownNonZeroJob, jobAncestry } from './zero-jobs';

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

  it('skips empty and whitespace-only entries', () => {
    expect(canJobEquip([''], 'Knight')).toBe(false);
    expect(canJobEquip(['   '], 'Knight')).toBe(false);
  });

  it('includes class-1 gear when filtering class-2 (Knight sees Swordsman)', () => {
    // Class-2 jobs inherit their class-1 gear
    expect(canJobEquip(['Swordsman'], 'Knight')).toBe(true);
    expect(canJobEquip(['Mage'], 'Wizard')).toBe(true);
    expect(canJobEquip(['Archer'], 'Hunter')).toBe(true);
    expect(canJobEquip(['Thief'], 'Assassin')).toBe(true);
    expect(canJobEquip(['Acolyte'], 'Priest')).toBe(true);
    expect(canJobEquip(['Merchant'], 'Blacksmith')).toBe(true);
  });

  it('does not include class-2 gear when filtering class-1 (Swordsman does not see Knight)', () => {
    // One-way inheritance: class-1 does not get class-2 gear
    expect(canJobEquip(['Knight'], 'Swordsman')).toBe(false);
    expect(canJobEquip(['Wizard'], 'Mage')).toBe(false);
    expect(canJobEquip(['Hunter'], 'Archer')).toBe(false);
  });

  it('ensures Novice is not an ancestor of class-1 jobs', () => {
    // Novice is not part of any class-1 family
    expect(canJobEquip(['Novice'], 'Swordsman')).toBe(false);
    expect(canJobEquip(['Novice'], 'Knight')).toBe(false);
  });

  it('still excludes Novice in All Jobs except Novice after inheritance', () => {
    // All Jobs except Novice must still exclude Novice even for class-2 jobs
    expect(canJobEquip(['All Jobs except Novice'], 'Knight')).toBe(true);
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

  it('recognizes empty strings as not unclassified', () => {
    expect(isUnclassifiedClass('')).toBe(false);
    expect(isUnclassifiedClass('   ')).toBe(false);
  });
});

describe('jobAncestry', () => {
  it('returns class-1 job alone for class-1 jobs', () => {
    expect(jobAncestry('Swordsman')).toEqual(['Swordsman']);
    expect(jobAncestry('Mage')).toEqual(['Mage']);
    expect(jobAncestry('Novice')).toEqual(['Novice']);
  });

  it('returns class-2 job followed by class-1 parent', () => {
    expect(jobAncestry('Knight')).toEqual(['Knight', 'Swordsman']);
    expect(jobAncestry('Wizard')).toEqual(['Wizard', 'Mage']);
    expect(jobAncestry('Priest')).toEqual(['Priest', 'Acolyte']);
  });

  it('is case-insensitive on input but returns canonical names', () => {
    expect(jobAncestry('knight')).toEqual(['Knight', 'Swordsman']);
    expect(jobAncestry('WIZARD')).toEqual(['Wizard', 'Mage']);
  });
});

describe('GEAR_CATEGORIES', () => {
  it('is exactly the two categories the equipment list holds', () => {
    // Costume Equipment is deliberately absent: it has its own list and its
    // own route since 3 Sep 2026 (see lib/item-href.ts).
    expect([...GEAR_CATEGORIES]).toEqual(['Armor', 'Weapon']);
  });
});

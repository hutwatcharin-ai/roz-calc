import { describe, it, expect } from 'vitest';
import { ZERO_JOBS, isZeroJob, isInGameSkill } from './zero-jobs';

describe('ZERO_JOBS', () => {
  it('holds twenty jobs', () => {
    expect(ZERO_JOBS).toHaveLength(20);
  });

  it('includes Novice, which the research doc omitted from its count', () => {
    expect(isZeroJob('Novice')).toBe(true);
  });

  it('includes every class-1 job', () => {
    for (const j of ['Swordsman', 'Mage', 'Archer', 'Thief', 'Acolyte', 'Merchant']) {
      expect(isZeroJob(j)).toBe(true);
    }
  });

  it('includes every class-2 job', () => {
    for (const j of ['Knight', 'Crusader', 'Wizard', 'Sage', 'Hunter', 'Bard', 'Dancer',
                     'Assassin', 'Rogue', 'Priest', 'Monk', 'Blacksmith', 'Alchemist']) {
      expect(isZeroJob(j)).toBe(true);
    }
  });

  it('excludes jobs that are not in Zero', () => {
    for (const j of ['Super Novice', 'Ninja', 'Gunslinger', 'Kagerou', 'Oboro', 'Rebellion']) {
      expect(isZeroJob(j)).toBe(false);
    }
  });

  it('excludes transcendent and class-3 jobs', () => {
    for (const j of ['Lord Knight', 'High Priest', 'Paladin', 'Assassin Cross', 'Sniper', 'Creator']) {
      expect(isZeroJob(j)).toBe(false);
    }
  });

  it('does not treat Super Novice as Novice', () => {
    // A substring check would wrongly accept it and put 52 unreleased skills
    // into the in-game list.
    expect(isZeroJob('Super Novice')).toBe(false);
    expect(isZeroJob('Expanded Super Novice')).toBe(false);
  });
});

describe('isInGameSkill', () => {
  it('is true when any class is a Zero job', () => {
    expect(isInGameSkill(['Knight'])).toBe(true);
  });

  it('is true when a skill is shared by an in-game and an unreleased job', () => {
    expect(isInGameSkill(['Knight', 'Lord Knight'])).toBe(true);
  });

  it('is false when every class is unreleased content', () => {
    expect(isInGameSkill(['Lord Knight', 'Paladin'])).toBe(false);
  });

  it('is false for an empty class list', () => {
    // 418 skills carry no class at all. They are unreleased content, not a
    // gap in our data -- and they must not silently land in the in-game view.
    expect(isInGameSkill([])).toBe(false);
  });

  it('is false for a null class list rather than throwing', () => {
    expect(isInGameSkill(null)).toBe(false);
  });
});

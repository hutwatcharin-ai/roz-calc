// qpetFor exists because two egg items are filed under a name the guide never
// uses, and both cases are a fact recorded elsewhere rather than a typo:
//
//   "Drops Egg"       -- the guide files the pet as "Drop", after the monster
//                        it is tamed from, which the game calls "Drops".
//   "Savage Babe Egg" -- monster 1167 was renamed to "Savage Bebe" on 7 Sep
//                        2026 and the egg item kept the old spelling.
//
// Without the resolver both render "ยังไม่มีข้อมูล" on /database/pets while the
// bonus is sitting in the guide file under the other name.
import { describe, it, expect } from 'vitest';
import { qpetFor, rozglobalGuides } from '@/lib/rozglobal-guides';
import { formerNames } from '@/lib/former-names';

describe('qpetFor', () => {
  it('matches on the plain name when the guide uses it', () => {
    expect(qpetFor('Poring')?.pet).toBe('Poring');
  });

  it('bridges an egg named after the source monster', () => {
    // Guard the premise: if the guide ever renames this pet to "Drops" the
    // test would keep passing on the direct match and prove nothing.
    expect(rozglobalGuides.qpets.some((pet) => pet.pet === 'Drops')).toBe(false);
    const pet = qpetFor('Drops');
    expect(pet?.pet).toBe('Drop');
    expect(pet?.level1).toBeTruthy();
  });

  it('bridges an egg that kept a renamed monster old name', () => {
    expect(formerNames(1167).some((old) => old.name === 'Savage Babe')).toBe(true);
    expect(rozglobalGuides.qpets.some((pet) => pet.pet === 'Savage Babe')).toBe(false);
    expect(qpetFor('Savage Babe')?.pet).toBe('Savage Bebe');
  });

  it('returns null for a pet the guide never covered', () => {
    expect(qpetFor('Fei-Chai')).toBeNull();
  });
});

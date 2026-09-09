import { describe, expect, it } from 'vitest';
import { isCVariant, isMjVariant, isInstanceVariant, INSTANCE_VARIANT_SQL_NOT_LIKE } from './c-variant';

describe('isCVariant', () => {
  it('matches C<digit><space> prefixes', () => {
    expect(isCVariant('C1 Yoyo')).toBe(true);
    expect(isCVariant('C3 Drops')).toBe(true);
    expect(isCVariant('C9 Baphomet')).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isCVariant('Yoyo')).toBe(false);
    expect(isCVariant('Cornutus')).toBe(false); // C + letter, not digit
    expect(isCVariant('C1Yoyo')).toBe(false); // no space
    expect(isCVariant('Mini C1 Yoyo')).toBe(false); // not a prefix
    expect(isCVariant('')).toBe(false);
    expect(isCVariant(null)).toBe(false);
    expect(isCVariant(undefined)).toBe(false);
  });
});

describe('isMjVariant', () => {
  it('spots the memorial-dungeon variants by their suffix', () => {
    expect(isMjVariant('Orc Warrior Mj')).toBe(true);
    expect(isMjVariant('Hode Mj')).toBe(true);
    expect(isMjVariant('Orc Warrior')).toBe(false);
  });

  it('does not fire on a name that merely contains the letters', () => {
    // Checked against the whole table: nothing else contains "mj" at all,
    // but the rule has to be the suffix, not a substring.
    expect(isMjVariant('Mjolnir Guard')).toBe(false);
    expect(isMjVariant('Mj')).toBe(false);
    expect(isMjVariant(null)).toBe(false);
  });
});

describe('isInstanceVariant', () => {
  it('covers all five families the monster list hides', () => {
    expect(isInstanceVariant('Orc Warrior Mj')).toBe(true);
    expect(isInstanceVariant('Md King Poring')).toBe(true);
    expect(isInstanceVariant('Mq Crab')).toBe(true);
    expect(isInstanceVariant('Ztw Ricecake')).toBe(true);
    expect(isInstanceVariant('B Flame Ghost')).toBe(true);
  });

  it('leaves normal monsters alone', () => {
    // Names from the table that start with the same letters as a family
    // marker but are not one: the marker is a whole word, not a prefix.
    expect(isInstanceVariant('Bathory')).toBe(false);
    expect(isInstanceVariant('Baphomet')).toBe(false);
    expect(isInstanceVariant('Mastering')).toBe(false);
    expect(isInstanceVariant('Marine Sphere')).toBe(false);
    expect(isInstanceVariant('Poring')).toBe(false);
    expect(isInstanceVariant(null)).toBe(false);
  });

  it('has one SQL pattern per family, and each matches its own function', () => {
    // The list filters in SQL and the tests check in JavaScript; a family
    // added to one and not the other would hide nothing while claiming to.
    expect(INSTANCE_VARIANT_SQL_NOT_LIKE).toEqual(['% Mj', 'Md %', 'Mq %', 'Ztw %', 'B %']);
    for (const pattern of INSTANCE_VARIANT_SQL_NOT_LIKE) {
      const sample = pattern.replace('%', 'Poring').trim();
      expect(isInstanceVariant(sample)).toBe(true);
    }
  });
});

import { describe, expect, it } from 'vitest';
import { isCVariant, isMjVariant } from './c-variant';

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

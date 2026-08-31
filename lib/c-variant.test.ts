import { describe, expect, it } from 'vitest';
import { isCVariant } from './c-variant';

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

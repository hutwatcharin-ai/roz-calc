import { describe, expect, it } from 'vitest';
import { knownAs, monsterLabel } from '@/lib/monster-known-as';
import { thaiAliasNames } from '@/lib/thai-aliases';

describe('Baphomet vs Baphomet Jr.', () => {
  it('labels #1101 as Baphomet Jr. and leaves the MVP alone', () => {
    expect(knownAs(1101)).toBe('Baphomet Jr.');
    expect(knownAs(1039)).toBeNull();
    expect(monsterLabel(1039, 'Baphomet')).toBe('Baphomet');
  });

  it('gives the nickname บาโฟ to the MVP, not to Baphomet Jr.', () => {
    expect(thaiAliasNames('monsters', 1039)).toContain('บาโฟ');
    expect(thaiAliasNames('monsters', 1101)).not.toContain('บาโฟ');
  });
});

// The internal names are only worth showing if they actually tell the
// duplicates apart, so that is what this checks -- not that the file parsed.
import { describe, it, expect } from 'vitest';
import { aegisName } from '@/lib/aegis-names';
import file from '@/data/monster-aegis-names.json';

const names = file as Record<string, string>;

describe('aegisName', () => {
  it('gives every id its own internal name', () => {
    const values = Object.values(names);
    expect(new Set(values).size).toBe(values.length);
  });

  it('separates the monsters that share a display name', () => {
    // Both sources print "Whisper" for 1179 and 1185, and "Thief Bug" for
    // three ids. If these ever collapse to one string the line on the page
    // stops distinguishing anything.
    const pairs = [
      [1179, 1185],
      [1002, 1062],
      [1039, 1101],
      [1049, 1050],
      [1155, 1156],
      [1051, 1053],
      [1053, 1054],
    ];
    for (const [a, b] of pairs) {
      expect(aegisName(a)).toBeTruthy();
      expect(aegisName(b)).toBeTruthy();
      expect(aegisName(a)).not.toBe(aegisName(b));
    }
  });

  it('returns null for an id the export did not cover', () => {
    expect(aegisName(999999)).toBeNull();
  });
});

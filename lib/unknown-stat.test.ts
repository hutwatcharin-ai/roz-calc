import { describe, it, expect } from 'vitest';
import { unknownIfZero, stat } from '@/lib/unknown-stat';

describe('unknownIfZero', () => {
  it('reads 0 as unknown, because the source prints a dash for these rows', () => {
    expect(unknownIfZero(0)).toBe('—');
    expect(unknownIfZero(null)).toBe('—');
    expect(unknownIfZero(undefined)).toBe('—');
  });

  it('keeps a real number, grouped', () => {
    expect(unknownIfZero(1830)).toBe('1,830');
  });
});

describe('stat', () => {
  it('keeps a real zero, because DEF 0 is a fact', () => {
    expect(stat(0)).toBe('0');
    expect(stat(null)).toBe('—');
  });
});

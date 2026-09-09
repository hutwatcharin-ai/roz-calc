import { describe, it, expect } from 'vitest';
import { cardRelease, releaseText } from '@/lib/card-availability';

describe('cardRelease', () => {
  it('finds a card whether or not the caller kept the word Card', () => {
    expect(cardRelease('Alice')).not.toBeNull();
    expect(cardRelease('Alice Card')).not.toBeNull();
    expect(cardRelease('alice card')?.when).toBe('JAN 2027');
  });

  it('says nothing about a card that is in the game', () => {
    // Poring is the first card anyone gets; if this ever returns a release
    // date the merge in the build script has gone wrong.
    expect(cardRelease('Poring Card')).toBeNull();
  });

  it('records which sources back each row', () => {
    const alice = cardRelease('Alice');
    expect(alice?.sources.length).toBeGreaterThanOrEqual(1);
    expect(alice?.sources).toContain('rozerodb');
  });
});

describe('releaseText', () => {
  it('writes the month in Thai', () => {
    expect(releaseText({ when: 'JAN 2027', sortKey: 202701, sources: [] })).toBe('ม.ค. 2027');
    expect(releaseText({ when: 'OCT 2026', sortKey: 202610, sources: [] })).toBe('ต.ค. 2026');
  });

  it('does not invent a date it was not given', () => {
    expect(releaseText({ when: null, sortKey: 999999, sources: [] })).toBe('ยังไม่มีกำหนด');
  });
});

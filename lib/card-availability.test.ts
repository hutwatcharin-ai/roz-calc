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

  it('treats Pyramid cards as available since the 17 Sep 2026 update', () => {
    // Both sources still said OCT 2026 when crawled; the monsters now spawn.
    for (const name of ['Mummy Card', 'Ancient Mummy Card', 'Isis Card', 'Verit Card', 'Arclouse Card']) {
      expect(cardRelease(name), name).toBeNull();
    }
    // Only Pyramid was opened: an OCT 2026 card from elsewhere keeps its date.
    expect(cardRelease('Joker Card')?.when).toBe('OCT 2026');
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

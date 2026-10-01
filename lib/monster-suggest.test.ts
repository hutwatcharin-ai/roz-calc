import { describe, expect, it } from 'vitest';
import { highlightParts, rankSuggestions, type SuggestMonster } from './monster-suggest';

const m = (id: number, name: string, level: number, extra: Partial<SuggestMonster> = {}): SuggestMonster => ({
  id, name, label: name, level, mvp: false, mini: false, race: '', element: '', elementKey: 'Neutral', sprite: null, aliases: [], ...extra,
});

const LIST = [
  m(1297, 'Ancient Mummy', 114),
  m(1041, 'Mummy', 55),
  m(1039, 'Baphomet', 105, { mvp: true, aliases: ['บาโฟ'] }),
  m(1101, 'Baphomet', 90, { label: 'Baphomet Jr.' }),
  m(1002, 'Poring', 1),
];

describe('rankSuggestions', () => {
  it('puts the exact name first, then the longer one', () => {
    expect(rankSuggestions(LIST, 'mummy').map((h) => h.monster.id)).toEqual([1041, 1297]);
  });

  it('ranks same-score rows by level, so Baphomet Jr. comes before the MVP', () => {
    expect(rankSuggestions(LIST, 'baph').map((h) => h.monster.id)).toEqual([1101, 1039]);
  });

  it('finds a monster by its Thai name and says which name matched', () => {
    const hits = rankSuggestions(LIST, 'บาโฟ');
    expect(hits.map((h) => h.monster.id)).toEqual([1039]);
    expect(hits[0].via).toBe('บาโฟ');
  });

  it('matches the players’ label too', () => {
    expect(rankSuggestions(LIST, 'jr').map((h) => h.monster.id)).toEqual([1101]);
  });

  it('returns nothing for an empty query or no match', () => {
    expect(rankSuggestions(LIST, '  ')).toEqual([]);
    expect(rankSuggestions(LIST, 'zzz')).toEqual([]);
  });

  it('caps the list', () => {
    const many = Array.from({ length: 20 }, (_, i) => m(i, `Wolf ${i}`, i));
    expect(rankSuggestions(many, 'wolf')).toHaveLength(8);
  });
});

describe('highlightParts', () => {
  it('splits around the match, ignoring case', () => {
    expect(highlightParts('Ancient Mummy', 'mum')).toEqual(['Ancient ', 'Mum', 'my']);
  });
  it('leaves text alone when the query is not in it', () => {
    expect(highlightParts('Poring', 'xyz')).toEqual(['Poring', '', '']);
  });
});

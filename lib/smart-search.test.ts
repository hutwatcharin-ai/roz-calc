import { describe, it, expect } from 'vitest';
import { matchScore, matches, normalise, rankMatches, searchWords, similarity, suggest } from './smart-search';

// Every case below is a search someone really ran on rozerothai.com between
// 9 Jul and 7 Sep 2026 (GA4 `search` events, replayed against the tables).
// The ones marked "found nothing" are what the old ilike rule returned.

describe('normalise', () => {
  it('strips the punctuation people type without meaning it', () => {
    expect(normalise('  Arc Wand [1] ')).toBe('arc wand 1');
    expect(normalise('groove.')).toBe('groove');
    expect(normalise("moonli\\")).toBe('moonli');
  });
});

describe('matchScore', () => {
  it('ranks exact, then prefix, then word-prefix, then anywhere', () => {
    expect(matchScore('Orc', 'orc')).toBe(100);
    expect(matchScore('Orc Warrior', 'orc')).toBe(80);
    expect(matchScore('Desert Wolf B', 'wolf')).toBe(70);
    expect(matchScore('Orcish Axe', 'rcish')).toBe(60);
  });

  it('puts the monster above the gear when both contain the word', () => {
    // "Orc" used to return whatever row order gave.
    const rows = ['Orcish Axe', 'Orc Warrior', 'Orc'];
    expect(rankMatches(rows, 'orc', (r) => r)).toEqual(['Orc', 'Orc Warrior', 'Orcish Axe']);
  });

  it('finds two words typed the wrong way round', () => {
    expect(matchScore('Red Potion', 'potion red')).toBe(50);
    expect(matchScore('Poring Card', 'card poring')).toBe(50);
  });

  it('refuses a query that shares nothing', () => {
    expect(matches('Poring', 'zzz')).toBe(false);
    expect(matchScore('Poring', '')).toBe(0);
  });
});

describe('similarity', () => {
  it('scores a one-letter typo close and an unrelated word far', () => {
    expect(similarity('damascus', 'damacus')).toBeGreaterThan(0.7);
    expect(similarity('muffler', 'muffer')).toBeGreaterThan(0.7);
    expect(similarity('gakkung bow', 'gukkung')).toBeGreaterThan(0.5);
    expect(similarity('poring', 'damascus')).toBeLessThan(0.2);
  });

  it('is symmetric and self-identical', () => {
    expect(similarity('hydra', 'hydra')).toBe(1);
    expect(similarity('hydra', 'hydar')).toBeCloseTo(similarity('hydar', 'hydra'));
  });
});

describe('suggest', () => {
  // The equipment page's real misses, against real names from the table.
  const equipment = ['Damascus', 'Gakkung Bow', 'Guard', 'Arc Wand', 'Muffler', 'Clip', 'Poring Card'];

  it('answers the three ways people misspelled Damascus', () => {
    for (const typo of ['damacus', 'damarcus', 'darmacus']) {
      expect(suggest(equipment, typo, (n) => n)[0]?.item).toBe('Damascus');
    }
  });

  it('answers the other typos from the log', () => {
    expect(suggest(equipment, 'muffer', (n) => n)[0]?.item).toBe('Muffler');
    expect(suggest(equipment, 'Gukkung', (n) => n)[0]?.item).toBe('Gakkung Bow');
    expect(suggest(equipment, 'graud', (n) => n)[0]?.item).toBe('Guard');
    expect(suggest(equipment, 'Arc ward', (n) => n)[0]?.item).toBe('Arc Wand');
  });

  it('suggests the longer name when the query is a run of its words', () => {
    // "Desert Wolf Card" was typed on the monsters page; the item is called
    // "Baby Desert Wolf Card", so no substring rule could ever find it.
    const cards = ['Baby Desert Wolf Card', 'Poring Card', 'Hydra Card'];
    expect(suggest(cards, 'Desert Wolf Card', (n) => n)[0]?.item).toBe('Baby Desert Wolf Card');
  });

  it('says nothing rather than guess', () => {
    // Real misses with no counterpart in the game: silence beats a wrong lead.
    expect(suggest(equipment, 'temari', (n) => n)).toEqual([]);
    expect(suggest(equipment, 'buying', (n) => n)).toEqual([]);
    // Too short to be evidence of anything.
    expect(suggest(equipment, 'd', (n) => n)).toEqual([]);
  });

  it('returns the closest first and no more than asked', () => {
    const out = suggest(['Damascus', 'Damascus Blade', 'Poring'], 'damacus', (n) => n, { limit: 1 });
    expect(out).toHaveLength(1);
    expect(out[0].item).toBe('Damascus');
  });
});

describe('rankMatches', () => {
  it('keeps everything when the query is empty', () => {
    expect(rankMatches(['b', 'a'], '  ', (r) => r)).toEqual(['b', 'a']);
  });

  it('breaks ties the way the caller asks', () => {
    const rows = [{ id: 2, name: 'Orc Lady' }, { id: 1, name: 'Orc Baby' }];
    expect(rankMatches(rows, 'orc', (r) => r.name, (a, b) => a.id - b.id).map((r) => r.id)).toEqual([1, 2]);
  });
});

describe('searchWords', () => {
  it('gives one word per condition, punctuation dropped', () => {
    expect(searchWords(' Arc Wand [1] ')).toEqual(['arc', 'wand', '1']);
    expect(searchWords('   ')).toEqual([]);
  });
});

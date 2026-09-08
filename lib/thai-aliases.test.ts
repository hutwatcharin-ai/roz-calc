import { describe, it, expect } from 'vitest';
import { aliasIdsFor, aliasedIds, thaiAliasNames, thaiAliases } from './thai-aliases';

describe('thaiAliases', () => {
  it('gives the Thai spelling of a name people search for', () => {
    // 7 impressions at position 8.4 for "คาราเมล ro", none of which clicked.
    expect(thaiAliasNames('monsters', 1103)).toContain('คาราเมล');
    expect(thaiAliasNames('monsters', 1024)).toContain('วอมเทล');
  });

  it('gives the nickname too, which no translation of the name could produce', () => {
    // Wolf is grey-blue, so players call it the blue dog; Creamy Card grants
    // Teleport, so it is the teleport card. Neither word is in the name.
    expect(thaiAliasNames('monsters', 1013)).toContain('หมาฟ้า');
    expect(thaiAliasNames('items', 4040)).toContain('การ์ดเทเลพอต');
  });

  it('carries the evidence for every alias', () => {
    for (const kind of ['monsters', 'items'] as const) {
      for (const id of aliasedIds(kind)) {
        for (const alias of thaiAliases(kind, id)) {
          expect(alias.name.trim()).not.toBe('');
          expect(alias.query.trim()).not.toBe('');
          // Whichever log it came from, it has to say how often and how it
          // was seen. A translated name could report neither.
          if (alias.source === 'gsc') {
            expect(alias.impressions).toBeGreaterThan(0);
            expect(alias.position).toBeGreaterThan(0);
          } else {
            expect(alias.searches).toBeGreaterThan(0);
            // The site's own search box has no ranking to report.
            expect(alias.position).toBeUndefined();
          }
        }
      }
    }
  });

  it('is empty for anything nobody has searched in Thai', () => {
    expect(thaiAliasNames('monsters', 1002)).toEqual([]);
    expect(thaiAliases('items', 999999)).toEqual([]);
  });
});

describe('aliasIdsFor', () => {
  it('resolves the Thai name a list page cannot match itself', () => {
    expect(aliasIdsFor('monsters', 'คาราเมล')).toContain(1103);
    // People type the game's name after the search term.
    expect(aliasIdsFor('monsters', 'คาราเมล ro')).toContain(1103);
    expect(aliasIdsFor('monsters', 'หมาฟ้า')).toContain(1013);
    expect(aliasIdsFor('items', 'การ์ดเทเลพอต')).toContain(4040);
  });

  it('answers nothing for an English or empty query, leaving the normal rule alone', () => {
    expect(aliasIdsFor('monsters', 'poring')).toEqual([]);
    expect(aliasIdsFor('monsters', '')).toEqual([]);
    expect(aliasIdsFor('monsters', 'ก')).toEqual([]);
  });
});

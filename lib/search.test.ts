import { describe, it, expect } from 'vitest';
import { mergeSearchResults } from './search';

describe('mergeSearchResults', () => {
  it('tags monsters and items with the correct type and href', () => {
    const monsters = [{ id: 1091, name_en: 'Dragon Fly' }];
    const items = [{ id: 757, name_en: 'Elunium Ore' }];

    const result = mergeSearchResults(monsters, items);

    expect(result).toEqual([
      { type: 'monster', id: 1091, name: 'Dragon Fly', href: '/database/monsters/1091' },
      { type: 'item', id: 757, name: 'Elunium Ore', href: '/database/items/757' },
    ]);
  });

  it('returns an empty list when both inputs are empty', () => {
    expect(mergeSearchResults([], [])).toEqual([]);
  });

  it('puts monsters before items when both are present', () => {
    const monsters = [{ id: 1, name_en: 'A' }];
    const items = [{ id: 2, name_en: 'B' }];

    const result = mergeSearchResults(monsters, items);

    expect(result.map((r) => r.type)).toEqual(['monster', 'item']);
  });
});

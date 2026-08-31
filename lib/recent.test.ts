import { describe, it, expect } from 'vitest';
import { RECENT_LIMIT, RECENT_STORAGE_KEY, addRecent, hrefFor, readRecent } from './recent';

function memoryStorage(seed?: string) {
  const map = new Map<string, string>();
  if (seed !== undefined) map.set(RECENT_STORAGE_KEY, seed);
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

const throwingStorage = {
  getItem(): string | null {
    throw new Error('denied');
  },
  setItem(): void {
    throw new Error('denied');
  },
};

describe('addRecent', () => {
  it('puts the newest visit first', () => {
    const s = memoryStorage();
    addRecent(s, { kind: 'monster', id: 1002, name: 'Poring' });
    const list = addRecent(s, { kind: 'item', id: 501, name: 'Red Potion' });
    expect(list.map((e) => e.id)).toEqual([501, 1002]);
  });

  it('moves a revisit to the front instead of duplicating it', () => {
    const s = memoryStorage();
    addRecent(s, { kind: 'monster', id: 1002, name: 'Poring' });
    addRecent(s, { kind: 'monster', id: 1004, name: 'Hornet' });
    const list = addRecent(s, { kind: 'monster', id: 1002, name: 'Poring' });
    expect(list.map((e) => e.id)).toEqual([1002, 1004]);
    expect(list).toHaveLength(2);
  });

  it('does not confuse a monster with an item that shares its id', () => {
    // Monster ids and item ids overlap as ranges; kind is part of identity.
    const s = memoryStorage();
    addRecent(s, { kind: 'monster', id: 1002, name: 'Poring' });
    const list = addRecent(s, { kind: 'item', id: 1002, name: 'Some Item' });
    expect(list).toHaveLength(2);
  });

  it('never grows past the limit', () => {
    const s = memoryStorage();
    for (let i = 1; i <= RECENT_LIMIT + 4; i += 1) {
      addRecent(s, { kind: 'monster', id: i, name: `M${i}` });
    }
    const list = readRecent(s);
    expect(list).toHaveLength(RECENT_LIMIT);
    expect(list[0].id).toBe(RECENT_LIMIT + 4); // newest kept, oldest dropped
  });

  it('survives a storage that throws, as Safari private mode does', () => {
    const list = addRecent(throwingStorage, { kind: 'monster', id: 1, name: 'X' });
    expect(list).toEqual([{ kind: 'monster', id: 1, name: 'X' }]);
  });
});

describe('readRecent', () => {
  it('reads corrupt storage as empty rather than crashing the page', () => {
    expect(readRecent(memoryStorage('not json'))).toEqual([]);
    expect(readRecent(memoryStorage('{"a":1}'))).toEqual([]);
    expect(readRecent(throwingStorage)).toEqual([]);
  });

  it('drops entries whose shape is wrong, keeping the rest', () => {
    // An older build may have written a different shape; one bad entry must not
    // take the whole list with it.
    const s = memoryStorage(
      JSON.stringify([
        { kind: 'monster', id: 1002, name: 'Poring' },
        { kind: 'weapon', id: 1, name: 'nope' },
        { kind: 'item', id: 501 },
      ]),
    );
    expect(readRecent(s)).toEqual([{ kind: 'monster', id: 1002, name: 'Poring' }]);
  });
});

describe('hrefFor', () => {
  it('routes each kind to its own detail page', () => {
    expect(hrefFor({ kind: 'monster', id: 1002, name: 'Poring' })).toBe('/database/monsters/1002');
    expect(hrefFor({ kind: 'item', id: 501, name: 'Red Potion' })).toBe('/database/items/501');
  });
});

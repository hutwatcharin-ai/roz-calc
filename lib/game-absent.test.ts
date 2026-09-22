import { describe, expect, it } from 'vitest';
import { absentIdsFilter, isAbsentFromGame, ABSENT_ITEM_IDS } from './game-absent';
import game from '@/data/game-items.json';

describe('items absent from the live client', () => {
  it('never lists an id the client actually has', () => {
    const inClient = new Set(Object.keys((game as { items: Record<string, unknown> }).items).map(Number));
    expect(ABSENT_ITEM_IDS.filter((id) => inClient.has(id))).toEqual([]);
  });

  it('flags an unopened-map card and not a live one', () => {
    expect(isAbsentFromGame(4430)).toBe(ABSENT_ITEM_IDS.includes(4430));
    expect(isAbsentFromGame(4035)).toBe(false); // Hydra Card, in the client
  });

  it('builds a PostgREST not-in list from only the given categories', () => {
    expect(absentIdsFilter(['No Such Category'])).toBe('(0)');
    expect(absentIdsFilter(['Card']).startsWith('(')).toBe(true);
  });
});

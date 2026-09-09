import { describe, it, expect } from 'vitest';
import { cardNameMonsterIds, cardNamesFor, cardNameAliases } from './card-name-aliases';

// The pairs come from monster_drops, so the data is as good as the table.
// What is worth checking here is the promise the page makes: typing the name
// on a card reaches the monster that drops it, and no ambiguous pair sneaks
// into the file.

describe('finding a monster by the name on its card', () => {
  it('reaches a monster whose name shares no word with the card', () => {
    // Zealotus Card drops from Zherlthsh; nothing about the two names matches.
    expect(cardNameMonsterIds('Zealotus')).toContain(1200);
    expect(cardNameMonsterIds('evil nymph')).toContain(1416);
    expect(cardNameMonsterIds('Golden Thief Bug')).toContain(1086);
  });

  it('matches with the word "card" attached, the way people type it', () => {
    expect(cardNameMonsterIds('zealotus card')).toContain(1200);
  });

  it('ignores a query too short to mean anything', () => {
    expect(cardNameMonsterIds('mi')).toEqual([]);
    expect(cardNameMonsterIds('')).toEqual([]);
  });

  it('answers the other direction too, for the monster page', () => {
    const named = cardNamesFor(1200);
    expect(named).toHaveLength(1);
    expect(named[0].cardName).toBe('Zealotus Card');
  });
});

describe('the alias file stays unambiguous', () => {
  it('never gives one alias two monsters', () => {
    const seen = new Map<string, number>();
    for (const entry of cardNameAliases) {
      const key = entry.alias.toLowerCase();
      const already = seen.get(key);
      expect(already === undefined || already === entry.monster, `${entry.alias} points at two monsters`).toBe(true);
      seen.set(key, entry.monster);
    }
  });

  it('carries the evidence for every pair', () => {
    expect(cardNameAliases.length).toBeGreaterThan(20);
    for (const entry of cardNameAliases) {
      expect(entry.cardName, entry.alias).toMatch(/ Card$/);
      expect(entry.cardName.startsWith(entry.alias), entry.alias).toBe(true);
      expect(entry.monster).toBeGreaterThan(0);
      expect(entry.monsterName.length).toBeGreaterThan(0);
    }
  });

  // The rule that keeps the file honest: an alias that is already a monster's
  // own name would drag searches away from the monster that owns the word.
  it('never uses a name that is itself a monster in the file', () => {
    const monsterNames = new Set(cardNameAliases.map((e) => e.monsterName.toLowerCase()));
    for (const entry of cardNameAliases) {
      expect(monsterNames.has(entry.alias.toLowerCase()), entry.alias).toBe(false);
    }
  });
});

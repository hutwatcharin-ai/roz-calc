import { describe, it, expect } from 'vitest';
import { SIZE_TABLE, SIZES, bestWeaponsFor, parseSize, sizeModifier } from './size-table';

describe('SIZE_TABLE', () => {
  it('has every weapon type the guide lists, with all three sizes', () => {
    expect(SIZE_TABLE).toHaveLength(20);
    for (const row of SIZE_TABLE) {
      for (const size of SIZES) {
        expect({ weapon: row.weapon, size, ok: Number.isInteger(row[size]) }).toEqual({
          weapon: row.weapon,
          size,
          ok: true,
        });
      }
    }
  });

  it('only uses the four values the guide prints', () => {
    // 50 / 75 / 100 and nothing else. A stray value means a transcription slip,
    // and this is a hand transcription from a screenshot.
    const values = new Set(SIZE_TABLE.flatMap((r) => SIZES.map((s) => r[s])));
    expect([...values].sort((a, b) => a - b)).toEqual([50, 75, 100]);
  });

  it('keeps the rows that decide what to carry', () => {
    // Book against a Large monster is the worst cell in the table, and a Dagger
    // is nearly as bad -- bigger swings than most cards, and the reason this
    // table is worth having at all.
    const book = SIZE_TABLE.find((r) => r.weapon === 'Book');
    expect(book).toMatchObject({ small: 100, medium: 100, large: 50 });

    const dagger = SIZE_TABLE.find((r) => r.weapon === 'Dagger');
    expect(dagger).toMatchObject({ small: 100, medium: 75, large: 50 });

    // Staves and guns are flat: nothing to think about, which is itself an
    // answer a caster wants.
    for (const weapon of ['One-Handed Staff', 'Two-Handed Staff', 'Gun', 'Bare hand']) {
      const row = SIZE_TABLE.find((r) => r.weapon === weapon);
      expect({ weapon, values: [row?.small, row?.medium, row?.large] }).toEqual({
        weapon,
        values: [100, 100, 100],
      });
    }
  });

  it('names every row once', () => {
    const names = SIZE_TABLE.map((r) => r.weapon);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('parseSize', () => {
  it('reads the values the monsters table stores', () => {
    expect(parseSize('Small')).toBe('small');
    expect(parseSize('Medium')).toBe('medium');
    expect(parseSize('Large')).toBe('large');
    expect(parseSize(' large ')).toBe('large');
  });

  it('refuses to guess an unknown value into one of the three', () => {
    // A monster whose size the feed never gave must show no size advice at all,
    // not advice for whichever size happened to be the default.
    expect(parseSize(null)).toBeNull();
    expect(parseSize('')).toBeNull();
    expect(parseSize('Huge')).toBeNull();
  });
});

describe('bestWeaponsFor', () => {
  it('puts the strongest weapon types first', () => {
    const large = bestWeaponsFor('large');
    expect(large[0][ 'large' ]).toBe(100);
    expect(large[large.length - 1]['large']).toBe(50);
  });

  it('returns every row, not just the winners', () => {
    expect(bestWeaponsFor('small')).toHaveLength(SIZE_TABLE.length);
  });
});

describe('sizeModifier', () => {
  it('reads the cell the table holds', () => {
    const bow = SIZE_TABLE.find((r) => r.weapon === 'Bow')!;
    expect(sizeModifier(bow, 'large')).toBe(75);
    expect(sizeModifier(bow, 'small')).toBe(100);
  });
});

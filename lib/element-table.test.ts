import { describe, it, expect } from 'vitest';
import {
  ELEMENTS,
  ELEMENT_TABLE,
  elementModifier,
  type Element,
  type ElementLevel,
} from './element-table';

const LEVELS: ElementLevel[] = [1, 2, 3, 4];

function everyCell(): number[] {
  const values: number[] = [];
  for (const level of LEVELS) {
    for (const attack of ELEMENTS) {
      for (const defence of ELEMENTS) values.push(ELEMENT_TABLE[level][attack][defence]);
    }
  }
  return values;
}

// These guard a REGENERATION, not my typing: the file is generated from
// rAthena's attr_fix.yml, and the failure mode worth catching is a parser that
// silently drops rows or misreads the "Dark" -> "Shadow" rename.
describe('ELEMENT_TABLE', () => {
  it('is complete: four attribute levels, ten by ten, no gaps', () => {
    const values = everyCell();
    expect(values).toHaveLength(4 * 10 * 10);
    expect(values.every((v) => Number.isInteger(v))).toBe(true);
  });

  it('stays inside the range attr_fix.yml documents', () => {
    // The source file's own header says values run from -100 to 200. Anything
    // outside means the parse picked up a line it should not have.
    const values = everyCell();
    expect(Math.min(...values)).toBeGreaterThanOrEqual(-100);
    expect(Math.max(...values)).toBeLessThanOrEqual(200);
  });

  it('uses the game\'s element names, not the ones its sources print', () => {
    // rAthena writes "Dark" and the official guide prints "Ninja Aura" where
    // everything else writes Ghost. A missed rename either way would leave a
    // column that nothing on the site can look up.
    expect(ELEMENTS).toContain('Shadow');
    expect(ELEMENTS).toContain('Ghost');
    expect(ELEMENTS as readonly string[]).not.toContain('Dark');
    expect(ELEMENTS as readonly string[]).not.toContain('Ninja Aura');
    for (const level of LEVELS) {
      expect(Object.keys(ELEMENT_TABLE[level]).sort()).toEqual([...ELEMENTS].sort());
    }
  });

  it('deepens with the defence element level rather than staying flat', () => {
    // A parser that read level 1 four times would pass every check above. These
    // three series come from the source file and all move with the level.
    const series = (a: Element, d: Element) => LEVELS.map((l) => elementModifier(a, d, l));
    expect(series('Water', 'Fire')).toEqual([150, 175, 200, 200]);
    expect(series('Holy', 'Undead')).toEqual([125, 150, 175, 200]);
    expect(series('Neutral', 'Ghost')).toEqual([90, 70, 50, 0]);
  });

  it('keeps the immunities that decide what a player can even hit', () => {
    // Shadow against Undead is 0 at every level: a Shadow weapon does nothing
    // to an Undead-element monster. Getting this one wrong would send a player
    // to a map they cannot fight on.
    for (const level of LEVELS) expect(elementModifier('Shadow', 'Undead', level)).toBe(0);
    expect(elementModifier('Poison', 'Poison', 1)).toBe(0);
  });

  it('is transposed the right way round', () => {
    // The official grid is defender-major and this table is attacker-major, so
    // a transpose bug would swap every asymmetric pair and still pass every
    // check above. Fire beats Earth and loses to Water; the reverse is a
    // different, wrong table.
    expect(elementModifier('Fire', 'Earth', 1)).toBe(150);
    expect(elementModifier('Earth', 'Fire', 1)).toBe(90);
    expect(elementModifier('Water', 'Fire', 1)).toBe(150);
    expect(elementModifier('Fire', 'Water', 1)).toBe(90);
  });

  it('keeps the one value where the official guide and rAthena disagree', () => {
    // Official prints 75, rAthena says 50, and rAthena's 75/50/25/0 series is
    // the tidier one -- which is exactly why this is pinned. The site follows
    // the official number, and a future regeneration must not quietly restore
    // the neater value. scripts/compare-element-tables.ts tracks the same fact.
    expect(elementModifier('Undead', 'Poison', 2)).toBe(75);
    expect([1, 3, 4].map((l) => elementModifier('Undead', 'Poison', l as ElementLevel))).toEqual([
      75, 25, 0,
    ]);
  });

  it('agrees with the table it reads from', () => {
    expect(elementModifier('Water', 'Water', 1)).toBe(ELEMENT_TABLE[1].Water.Water);
  });
});

import { describe, it, expect } from 'vitest';
import {
  ARMOUR_DEF,
  GEAR_TYPES,
  MAX_REFINE,
  ORE,
  REFINE_CHANCE,
  WEAPON_ATK,
  WEAPON_ATK_BONUS,
  armourDefAt,
  chanceAt,
  weaponAtkAt,
  type WeaponType,
} from './refine-table';

// These tables were read off a screenshot of the official guide. Every one of
// the three numeric tables turns out to be a formula, so the test writes the
// formula down separately and asserts it reproduces the transcription digit for
// digit. A misread number breaks the sequence and names itself.

const WEAPONS: WeaponType[] = ['weapon1', 'weapon2', 'weapon3', 'weapon4'];

describe('the transcription reproduces the arithmetic behind the guide', () => {
  it('gives ATK in two straight lines, gentle to +15 then steep', () => {
    // Slope below +15, slope above, taken from the first step of each segment.
    const SLOPES: Record<WeaponType, [number, number]> = {
      weapon1: [2, 18],
      weapon2: [3, 35],
      weapon3: [5, 59],
      weapon4: [8, 95],
    };

    for (const weapon of WEAPONS) {
      const [low, high] = SLOPES[weapon];
      const derived = Array.from({ length: MAX_REFINE }, (_, i) => {
        const level = i + 1;
        return level <= 15 ? low * level : low * 15 + high * (level - 15);
      });
      expect(WEAPON_ATK[weapon], weapon).toEqual(derived);
    }
  });

  it('starts the high-refine bonus at a different level per weapon and climbs by a fixed step', () => {
    // The guide prints a dash until the level in [0], then a straight line
    // rising by [1] each level. Better weapons start earlier and climb faster.
    const BONUS: Record<WeaponType, [number, number]> = {
      weapon1: [8, 3],
      weapon2: [7, 5],
      weapon3: [6, 8],
      weapon4: [5, 14],
    };

    for (const weapon of WEAPONS) {
      const [from, step] = BONUS[weapon];
      const derived = Array.from({ length: MAX_REFINE }, (_, i) => {
        const level = i + 1;
        return level < from ? 0 : step * (level - from + 1);
      });
      expect(WEAPON_ATK_BONUS[weapon], weapon).toEqual(derived);
    }
  });

  it('gives armour DEF equal to the refine level squared', () => {
    const derived = Array.from({ length: MAX_REFINE }, (_, i) => (i + 1) ** 2);
    expect(ARMOUR_DEF).toEqual(derived);
  });
});

describe('the success table', () => {
  it('covers every refine level for every equipment type', () => {
    for (const gear of GEAR_TYPES) {
      expect(REFINE_CHANCE[gear], gear).toHaveLength(MAX_REFINE);
    }
  });

  it('never gets easier as the refine level rises', () => {
    // No formula backs this table, so shape is the only cross-check available.
    for (const gear of GEAR_TYPES) {
      const rows = REFINE_CHANCE[gear];
      for (let i = 1; i < rows.length; i += 1) {
        expect(rows[i].normal, `${gear} +${i + 1} normal`).toBeLessThanOrEqual(rows[i - 1].normal);
        expect(rows[i].special, `${gear} +${i + 1} special`).toBeLessThanOrEqual(rows[i - 1].special);
      }
    }
  });

  it('never makes the special ore worse than the plain one', () => {
    for (const gear of GEAR_TYPES) {
      for (const [i, row] of REFINE_CHANCE[gear].entries()) {
        expect(row.special, `${gear} +${i + 1}`).toBeGreaterThanOrEqual(row.normal);
        expect(row.normal).toBeGreaterThan(0);
        expect(row.special).toBeLessThanOrEqual(100);
      }
    }
  });

  it('matches what the site owner measured in game: +1 to +4 on a low weapon is 90%', () => {
    // Independent of the screenshot -- this came from actually refining, and is
    // the only part of this table with a second source behind it.
    for (const weapon of ['weapon1', 'weapon2', 'weapon3'] as WeaponType[]) {
      for (const level of [1, 2, 3, 4]) {
        expect(chanceAt(weapon, level, false), `${weapon} +${level}`).toBe(90);
      }
    }
  });
});

describe('lookups', () => {
  it('adds the high-refine bonus into the weapon total', () => {
    // +10 weapon Lv4: 80 from the line, 84 from the bonus.
    expect(weaponAtkAt('weapon4', 10)).toBe(164);
    // +4 weapon Lv1 is below the bonus threshold, so it is the line alone.
    expect(weaponAtkAt('weapon1', 4)).toBe(8);
  });

  it('reads zero at +0 rather than falling off the end of the array', () => {
    expect(weaponAtkAt('weapon1', 0)).toBe(0);
    expect(armourDefAt(0)).toBe(0);
  });

  it('refuses a refine level the table does not cover', () => {
    expect(() => chanceAt('armour', MAX_REFINE + 1, false)).toThrow();
  });
});

describe('ore and fees', () => {
  it('gives every equipment type an ore and a fee', () => {
    for (const gear of GEAR_TYPES) {
      expect(ORE[gear].normal.ore, gear).toBeTruthy();
      expect(ORE[gear].normal.feeZeny, gear).toBeGreaterThan(0);
    }
  });

  it('offers the concentrated ore only where the guide lists one', () => {
    // Lv1 and Lv2 weapons have a single ore, so there is nothing to choose.
    expect(ORE.weapon1.special).toBeNull();
    expect(ORE.weapon2.special).toBeNull();
    expect(ORE.weapon3.special?.ore).toBe('Concentrated Oridecon');
    expect(ORE.armour.special?.ore).toBe('Concentrated Elunium');
  });

  it('leaves the price null where the guide gives none rather than inventing one', () => {
    // Oridecon and Elunium drop from monsters; the guide prints no NPC price.
    expect(ORE.weapon3.normal.oreZeny).toBeNull();
    expect(ORE.weapon1.normal.oreZeny).toBe(200);
  });
});

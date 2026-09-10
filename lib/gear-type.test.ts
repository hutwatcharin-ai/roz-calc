import { describe, expect, it } from 'vitest';
import file from '@/data/gear-types.json';
import { ARMOR_TYPES, SLOTS_FILLED, TYPE_TH, UNTYPED_ROWS, WEAPON_TYPES, categoryOfType, gearCategory, gearType, typesFor } from './gear-type';

const meta = (file as { _meta: Record<string, unknown> })._meta;

describe('gearType', () => {
  it('keeps the column when the row has one', () => {
    expect(gearType({ id: 1201, category: 'Weapon', weapon_type: 'Dagger' })).toBe('Dagger');
  });

  it('fills the rows the column leaves empty', () => {
    // The three that made this worth building: a shield, a body armour and a
    // pair of boots that the filter could not find at all.
    expect(gearType({ id: 460120, category: 'Armor', weapon_type: null })).toBe('Shield');
    expect(gearType({ id: 450320, category: 'Armor', weapon_type: null })).toBe('Armor');
    expect(gearType({ id: 470012, category: 'Armor', weapon_type: null })).toBe('Shoes');
    expect(gearType({ id: 480007, category: 'Armor', weapon_type: null })).toBe('Garment');
  });

  it('leaves a row with no answer as null rather than guessing', () => {
    // 5 rows reach neither rAthena nor a safe rule. They stay listed; they
    // just do not claim a slot.
    expect(UNTYPED_ROWS.length).toBeGreaterThan(0);
    expect(gearType({ id: UNTYPED_ROWS[0], category: 'Armor', weapon_type: null })).toBeNull();
  });

  it('corrects the two rows filed under the wrong half', () => {
    // Bow Thimble is an accessory and Rainbow Eggshell is a hat; our table
    // calls both weapons.
    expect(gearCategory({ id: 2671, category: 'Weapon', weapon_type: null })).toBe('Armor');
    expect(gearType({ id: 2671, category: 'Weapon', weapon_type: null })).toBe('Accessory');
    expect(gearCategory({ id: 5039, category: 'Weapon', weapon_type: null })).toBe('Armor');
    expect(gearType({ id: 5039, category: 'Weapon', weapon_type: null })).toBe('Headgear');
  });

  it('leaves a category alone when nothing corrects it', () => {
    expect(gearCategory({ id: 1201, category: 'Weapon', weapon_type: 'Dagger' })).toBe('Weapon');
  });
});

describe('the filter vocabulary', () => {
  it('has a Thai label for every type a chip can show', () => {
    for (const t of [...ARMOR_TYPES, ...WEAPON_TYPES]) expect(TYPE_TH[t], t).toBeTruthy();
  });

  it('puts every filled type in one half or the other', () => {
    const slots = (file as { types: Record<string, { type: string }> }).types;
    for (const [id, row] of Object.entries(slots)) {
      const half = categoryOfType(row.type);
      expect(typesFor(half), `${id} ${row.type}`).toContain(row.type);
    }
  });

  it('offers no types for a category the page does not have', () => {
    expect(typesFor('Costume Equipment')).toHaveLength(0);
  });
});

describe('the published data', () => {
  it('fills the bulk of the gap', () => {
    // 248 rows had no type; anything below ~230 means a pass stopped working.
    expect(SLOTS_FILLED).toBeGreaterThan(230);
    expect(meta.rowsWithNoType).toBe(248);
  });

  it('records an inference rule that still agrees with the source', () => {
    // The build refuses to write on an unknown disagreement, so this asserts
    // the evidence travelled with the data rather than being lost.
    const control = meta.control as Record<string, { agree: number; disagree: string[] }>;
    for (const [rule, result] of Object.entries(control)) {
      expect(result.agree, rule).toBeGreaterThan(100);
      expect(result.disagree, rule).toHaveLength(0);
    }
  });
});

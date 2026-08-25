import { describe, it, expect } from 'vitest';
import { parseItemDescription } from './parse-item-text';

describe('parseItemDescription', () => {
  it('extracts weapon fields from a real Ice Falchion description', () => {
    const lines = [
      'A blue-bladed sword imbued with the power of water.',
      'Has a low chance to autocast [Cold Bolt] Lv.3 when dealing physical attacks.',
      'Type : Sword',
      'ATK : 100',
      'Weight : 60',
      'Element : Water',
      'Weapon Level : 4',
      'Required Level : 40',
      'Equippable by : Swordsman Class, Merchant Class, Thief Class',
    ];

    const result = parseItemDescription(lines);

    expect(result).toEqual({
      weaponType: 'Sword',
      atk: 100,
      weaponLevel: 4,
      requiredLevel: 40,
      equippableClasses: ['Swordsman', 'Merchant', 'Thief'],
    });
  });

  it('returns nulls and an empty class list when fields are absent', () => {
    const lines = ['Recovery tonic finely ground from Red Herb. Recovers about 45 HP.', 'Weight : 7'];

    const result = parseItemDescription(lines);

    expect(result).toEqual({
      weaponType: null,
      atk: null,
      weaponLevel: null,
      requiredLevel: null,
      equippableClasses: [],
    });
  });
});

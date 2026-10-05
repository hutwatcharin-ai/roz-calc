import { describe, expect, it } from 'vitest';
import { classicTwinIds } from './classic-twins';

const W = 'Weapon';
const items = [
  { id: 1463, name: 'Hallberd', category: W },
  { id: 630039, name: 'Hallberd', category: W },
  { id: 630053, name: 'Hallberd', category: W },
  { id: 1301, name: 'Axe', category: W },
  { id: 520037, name: 'Axe', category: W },
  { id: 501, name: 'Red Potion', category: 'Consumable / Recovery' },
  { id: 22817, name: 'Small Healing Potion', category: 'Special' },
  { id: 107046, name: 'Small Healing Potion', category: 'Special' },
];

describe('classicTwinIds', () => {
  it('marks a classic id that has a Zero namesake and no drop', () => {
    expect(classicTwinIds(items, new Set([630053]))).toEqual(new Set([1463, 1301]));
  });
  it('keeps a classic id that a monster drops', () => {
    expect(classicTwinIds(items, new Set([1301])).has(1301)).toBe(false);
  });
  it('leaves non-equipment alone: shops and the cash shop, not drops, hand those out', () => {
    expect(classicTwinIds(items, new Set()).has(22817)).toBe(false);
  });
  it('keeps a classic id with no Zero namesake', () => {
    expect(classicTwinIds(items, new Set()).has(501)).toBe(false);
  });
});

import { describe, expect, it } from 'vitest';
import { classicTwinIds } from './classic-twins';

const items = [
  { id: 1463, name: 'Hallberd' },
  { id: 630039, name: 'Hallberd' },
  { id: 630053, name: 'Hallberd' },
  { id: 1301, name: 'Axe' },
  { id: 520037, name: 'Axe' },
  { id: 501, name: 'Red Potion' },
];

describe('classicTwinIds', () => {
  it('marks a classic id that has a Zero namesake and no drop', () => {
    expect(classicTwinIds(items, new Set([630053]))).toEqual(new Set([1463, 1301]));
  });
  it('keeps a classic id that a monster drops', () => {
    expect(classicTwinIds(items, new Set([1301])).has(1301)).toBe(false);
  });
  it('keeps a classic id with no Zero namesake', () => {
    expect(classicTwinIds(items, new Set()).has(501)).toBe(false);
  });
});

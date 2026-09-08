import { describe, it, expect } from 'vitest';
import { isBound, withoutBound } from './bound-items';

describe('isBound', () => {
  it('spots both spellings the game uses, at the end only', () => {
    expect(isBound('[Costume] Poring Mascot (Bound)')).toBe(true);
    expect(isBound('[Costume] Poring Mascot [Bound]')).toBe(true);
    expect(isBound('[Costume] Poring Mascot')).toBe(false);
    // "Bound" inside a name is not the marker.
    expect(isBound('Bound Sword')).toBe(false);
    expect(isBound('Spellbound Cloak')).toBe(false);
  });
});

describe('withoutBound', () => {
  it('gives the twin costume the icon can be copied from', () => {
    expect(withoutBound('[Costume] Poring Mascot (Bound)')).toBe('[Costume] Poring Mascot');
    expect(withoutBound('[Costume] Poring Mascot')).toBe('[Costume] Poring Mascot');
  });
});

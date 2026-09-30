import { describe, expect, it } from 'vitest';
import { ITEM_SETS, SET_KINDS, setsOf, setAnchor } from '@/lib/item-sets';

describe('item sets', () => {
  it('every set has two or more pieces and a Thai bonus', () => {
    for (const s of ITEM_SETS) {
      expect(s.pieces.length, s.name).toBeGreaterThanOrEqual(2);
      expect(s.bonus, s.name).not.toMatch(/\b(chance|when|damage)\b/i);
    }
  });

  it('every set lands in a group the page renders', () => {
    const kinds = new Set(SET_KINDS.map((k) => k.kind));
    for (const s of ITEM_SETS) expect(kinds.has(s.kind), s.name).toBe(true);
  });

  it('anchors are unique', () => {
    const anchors = ITEM_SETS.map(setAnchor);
    expect(new Set(anchors).size).toBe(anchors.length);
  });

  it('finds the sets of a piece from either side', () => {
    // Wolf Card and Vagabond Wolf Card are one set; the helper must find it
    // from both cards.
    expect(setsOf(4029).map((s) => s.name)).toContain('Vagabond Wolf & Wolf Card');
    expect(setsOf(4183).map((s) => s.name)).toContain('Vagabond Wolf & Wolf Card');
    expect(setsOf(501)).toEqual([]);
  });
});

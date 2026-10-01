import { describe, expect, it } from 'vitest';
import { dropTier } from './drop-tier';

describe('dropTier', () => {
  it('bands by rate', () => {
    expect(dropTier(45, false)).toBe('common');
    expect(dropTier(10, false)).toBe('common');
    expect(dropTier(4.25, false)).toBe('uncommon');
    expect(dropTier(0.5, false)).toBe('rare');
    expect(dropTier(0.05, false)).toBe('epic');
  });
  it('makes every card a card, whatever the rate', () => {
    expect(dropTier(0.01, true)).toBe('card');
    expect(dropTier(null, true)).toBe('card');
  });
  it('says nothing when the rate is unknown', () => {
    expect(dropTier(null, false)).toBeNull();
  });
});

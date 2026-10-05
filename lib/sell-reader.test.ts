import { describe, expect, it } from 'vitest';
import { plainPrice } from './sell-reader';

describe('plainPrice', () => {
  it('takes the plain NPC price left of the arrow', () => {
    expect(plainPrice('125->155Z')).toBe(125);
    expect(plainPrice('0Z')).toBe(0);
  });
  it('reads the shop window thousands with commas', () => {
    expect(plainPrice('2,500Z')).toBe(2500);
    expect(plainPrice('1200->1,068Z')).toBe(1200);
    expect(plainPrice('50000->44,500Z')).toBe(50000);
  });
  it('refuses text with an unread glyph or a stray comma', () => {
    expect(plainPrice(null)).toBeNull();
    expect(plainPrice('?00->1,958Z')).toBeNull();
    expect(plainPrice('1,50Z')).toBeNull();
  });
});

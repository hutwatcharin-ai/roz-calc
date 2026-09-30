import { describe, expect, it } from 'vitest';
import { spriteSize } from '@/lib/sprite-scale';

describe('spriteSize', () => {
  it('scales by a whole number and keeps the shape', () => {
    // Zombie is 56x89: 2x fits the 190 box, 3x would not.
    expect(spriteSize('/images/monsters/1015.gif')).toEqual({ width: 112, height: 178, scale: 2 });
  });

  it('caps small sprites at 3x', () => {
    const s = spriteSize('/images/monsters/1002.gif')!; // Poring 41x39
    expect(s.scale).toBe(3);
    expect(s.width / s.height).toBeCloseTo(41 / 39);
  });

  it('shrinks a sprite bigger than the box to fit', () => {
    const s = spriteSize('/images/monsters/1002.gif', 30)!;
    expect(Math.max(s.width, s.height)).toBeLessThanOrEqual(30);
  });

  it('returns null for an unknown file', () => {
    expect(spriteSize('/images/monsters/nope.gif')).toBeNull();
    expect(spriteSize(null)).toBeNull();
  });
});

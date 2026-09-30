// How big to draw a monster sprite in the header ring: a whole-number scale
// so pixels stay square, as large as fits the target box, never below 1x.
// A sprite already bigger than the box is shrunk to fit instead (a few MVPs);
// that one case is not pixel-exact, and it is the only way it fits.

import sizes from '@/data/monster-sprite-sizes.json';

const SIZES = sizes as unknown as Record<string, [number, number]>;

export const SPRITE_BOX = 190;
const MAX_SCALE = 3;

export function spriteSize(imageUrl: string | null, box = SPRITE_BOX): { width: number; height: number; scale: number } | null {
  if (!imageUrl) return null;
  const file = imageUrl.split('/').pop() ?? '';
  const size = SIZES[file];
  if (!size) return null;
  const [w, h] = size;
  const longest = Math.max(w, h);
  if (longest > box) {
    const f = box / longest;
    return { width: Math.round(w * f), height: Math.round(h * f), scale: f };
  }
  const scale = Math.max(1, Math.min(MAX_SCALE, Math.floor(box / longest)));
  return { width: w * scale, height: h * scale, scale };
}

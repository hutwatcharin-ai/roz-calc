// The equip window's character with its headgear (scripts/build-build-doll.py,
// owner 7 Oct 2026). Bodies and hats are drawn apart from the client's
// sprites and stacked here the way the game stacks them: a hat sits at the
// body's anchor plus the hat's own offset, on the body's 200x200 canvas.

import file from '@/data/build-doll.json';

export type Sex = 'm' | 'f';

const data = file as unknown as {
  bodies: Record<string, [number, number]>;
  views: Record<string, Partial<Record<Sex, [number, number, number, number]>>>;
  hats: Record<string, string>;
};

/** The sex a class can be drawn as: Bard is male only, Dancer female only. */
export function dollSex(cls: string, wanted: Sex): Sex {
  if (data.bodies[`${cls}-${wanted}`]) return wanted;
  return wanted === 'm' ? 'f' : 'm';
}

export function dollBody(cls: string, sex: Sex): { src: string; anchor: [number, number] } | null {
  const anchor = data.bodies[`${cls}-${sex}`];
  return anchor ? { src: `/images/build-doll/body-${cls}-${sex}.webp`, anchor } : null;
}

/** A head item's picture, placed on the body canvas; null when the game draws nothing for it. */
export function dollHat(itemId: number, cls: string, sex: Sex): { src: string; x: number; y: number; w: number; h: number } | null {
  const body = data.bodies[`${cls}-${sex}`];
  const key = data.hats[String(itemId)];
  const box = key ? data.views[key]?.[sex] : undefined;
  if (!body || !key || !box) return null;
  return { src: `/images/build-doll/hat-${key.slice(1)}-${sex}.webp`, x: body[0] + box[0], y: body[1] + box[1], w: box[2], h: box[3] };
}

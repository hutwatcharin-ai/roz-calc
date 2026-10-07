// The equip window's character with what it wears (scripts/build-build-doll.py,
// owner 7 Oct 2026). Bodies, headgear, weapons and shields are drawn apart
// from the client's sprites and stacked here the way the game stacks them:
// a hat sits at the body's anchor plus the hat's own offset; a weapon or
// shield lies on the body canvas where it was drawn (its frames match the
// body's). All on the body's 200x200 canvas.
//
// The game shows weapons and shields only in the battle stance, so a
// character holding either is drawn in that stance.

import file from '@/data/build-doll.json';

export type Sex = 'm' | 'f';

interface Picture {
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const data = file as unknown as {
  /** [stand anchor x, y, stance anchor x, y] */
  bodies: Record<string, [number, number, number, number]>;
  views: Record<string, Partial<Record<Sex, [number, number, number, number]>>>;
  hats: Record<string, string>;
  /** item -> sprite names to try (its own, then its weapon type's) */
  weapons: Record<string, string[]>;
  shields: Record<string, string>;
  dualOrder: string[];
  /** class-sex -> sprite name -> [file, x, y, w, h] */
  layers: Record<string, Record<string, [string, number, number, number, number]>>;
};

/** The sex a class can be drawn as: Bard is male only, Dancer female only. */
export function dollSex(cls: string, wanted: Sex): Sex {
  if (data.bodies[`${cls}-${wanted}`]) return wanted;
  return wanted === 'm' ? 'f' : 'm';
}

export function dollBody(cls: string, sex: Sex, stance: boolean): { src: string; anchor: [number, number] } | null {
  const b = data.bodies[`${cls}-${sex}`];
  if (!b) return null;
  return {
    src: `/images/build-doll/body-${cls}-${sex}${stance ? '-r' : ''}.webp`,
    anchor: stance ? [b[2], b[3]] : [b[0], b[1]],
  };
}

/** A head item's picture on the body canvas; null when the game draws nothing for it. */
export function dollHat(itemId: number, anchor: [number, number], sex: Sex): Picture | null {
  const key = data.hats[String(itemId)];
  const box = key ? data.views[key]?.[sex] : undefined;
  if (!key || !box) return null;
  return { src: `/images/build-doll/hat-${key.slice(1)}-${sex}.webp`, x: anchor[0] + box[0], y: anchor[1] + box[1], w: box[2], h: box[3] };
}

function layer(cls: string, sex: Sex, name: string): Picture | null {
  const l = data.layers[`${cls}-${sex}`]?.[name];
  return l ? { src: `/images/build-doll/${l[0]}.webp`, x: l[1], y: l[2], w: l[3], h: l[4] } : null;
}

/**
 * The weapon in the stance. With a weapon in each hand (an Assassin), the
 * game has one sprite for the pair by type, named in the order dagger,
 * sword, axe (_단검_검).
 */
export function dollWeapon(rightId: number | null, leftId: number | null, cls: string, sex: Sex): Picture | null {
  const right = rightId ? data.weapons[String(rightId)] : undefined;
  const left = leftId ? data.weapons[String(leftId)] : undefined;
  if (right && left) {
    const pair = [right[right.length - 1], left[left.length - 1]].sort((a, b) => data.dualOrder.indexOf(a) - data.dualOrder.indexOf(b));
    const both = layer(cls, sex, `${pair[0]}_${pair[1].slice(1)}`);
    if (both) return both;
  }
  for (const name of right ?? left ?? []) {
    const pic = layer(cls, sex, name);
    if (pic) return pic;
  }
  return null;
}

export function dollShield(itemId: number | null, cls: string, sex: Sex): Picture | null {
  const name = itemId ? data.shields[String(itemId)] : undefined;
  return name ? layer(cls, sex, `shield:${name}`) : null;
}

/** Whether the weapon or shield has a picture: then the character stands ready. */
export function dollStance(rightId: number | null, leftId: number | null, shieldId: number | null, cls: string, sex: Sex): boolean {
  return !!(dollWeapon(rightId, leftId, cls, sex) || dollShield(shieldId, cls, sex));
}

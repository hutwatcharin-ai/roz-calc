// What a dressed-up character wears and how it stands, and the sprite parts
// that draws it. Pure: the slim index (data/dress-up-client.json, made by
// scripts/build-dress-up-client.mjs) is the only data it reads, so it runs the
// same in the browser and in tests.
import index from '@/data/dress-up-client.json';
import { frameAt } from './render';
import type { PartData } from './types';

export type Sex = 'm' | 'f';
export type Slot = 'upper' | 'mid' | 'lower' | 'garment';
export type Pose = 'stand' | 'walk' | 'sit' | 'ready' | 'attack' | 'hurt' | 'dead';
export type PartKind = 'body' | 'head' | 'acc' | 'robe' | 'weapon';

export type Look = {
  cls: string;
  sex: Sex;
  hair: number;
  hairColour: number;
  cloth: number;
  upper?: number;
  mid?: number;
  lower?: number;
  garment?: number;
  /** a weapon type the class holds (dagger, sword2h, dagger-sword, ...) */
  weapon?: string;
  /** 0 faces the viewer, then clockwise: 2 left, 4 away, 6 right */
  dir: number;
  pose: Pose;
  /** stand and sit only: 0 ahead, 1 left, 2 right */
  headDir: 0 | 1 | 2;
};

export type PartRef = { key: string; anchored: boolean; kind: PartKind };

export interface ClientClass {
  slug: string;
  sexes: Sex[];
  cloth: number[];
  weapons: string[];
  atk: Record<Sex, Record<string, number>>;
}

/** [slot letters, view] | [.., .., 0 = no sprite anywhere] | [.., .., class-sexes without one] */
export type ClientItem = [string, number] | [string, number, 0 | string[]];

export interface ClientIndex {
  v: number;
  classes: ClientClass[];
  hair: { styles: number; colours: { id: number; th: string }[] };
  items: Record<string, ClientItem>;
  files: Record<string, string>;
}

export const INDEX = index as unknown as ClientIndex;

export const SLOTS: Slot[] = ['upper', 'mid', 'lower', 'garment'];
const LETTER: Record<string, Slot> = { u: 'upper', m: 'mid', l: 'lower', g: 'garment' };

export const POSE_TYPE: Record<Pose, number> = { stand: 0, walk: 1, sit: 2, ready: 4, attack: 5, hurt: 6, dead: 8 };

export const DEFAULT_LOOK: Look = {
  cls: 'novice', sex: 'm', hair: 1, hairColour: 0, cloth: 0, dir: 0, pose: 'stand', headDir: 0,
};

export function classOf(slug: string): ClientClass | undefined {
  return INDEX.classes.find((c) => c.slug === slug);
}

/** The slots an item fills, or [] when the index does not know it. */
export function slotsOf(itemId: number): Slot[] {
  const it = INDEX.items[String(itemId)];
  return it ? [...it[0]].map((l) => LETTER[l]) : [];
}

/** The sex the class can be drawn as (Bard is male only, Dancer female only), as dollSex. */
export function sexOf(look: Look): Sex {
  const c = classOf(look.cls);
  if (!c || c.sexes.includes(look.sex)) return look.sex;
  return c.sexes[0];
}

/** Whether the item has a sprite for this class and sex. */
export function hasSprite(itemId: number, cls: string, sex: Sex): boolean {
  const it = INDEX.items[String(itemId)];
  if (!it) return false;
  const without = it[2];
  if (without === 0) return false;
  return !without || !without.includes(`${cls}-${sex}`);
}

/** Take off whatever fills `slot`, from every slot that item fills. */
export function takeOff(look: Look, slot: Slot): Look {
  const id = look[slot];
  if (id === undefined) return look;
  const next = { ...look };
  for (const s of SLOTS) if (next[s] === id) delete next[s];
  return next;
}

/** Put an item on: whatever sat in any slot it needs comes off whole (Review Focus 2). */
export function wear(look: Look, itemId: number): Look {
  const slots = slotsOf(itemId);
  if (slots.length === 0) return look;
  let next = look;
  for (const s of slots) next = takeOff(next, s);
  next = { ...next };
  for (const s of slots) next[s] = itemId;
  return next;
}

function wornItems(look: Look): number[] {
  const ids: number[] = [];
  for (const s of SLOTS) {
    const id = look[s];
    if (id !== undefined && !ids.includes(id)) ids.push(id);
  }
  return ids;
}

/** The parts that draw the look, and the worn items that have no sprite for it. */
export function drawable(look: Look): { parts: PartRef[]; missing: number[] } {
  const c = classOf(look.cls);
  const sex = sexOf(look);
  const files = INDEX.files;
  const parts: PartRef[] = [];
  const missing: number[] = [];
  const add = (key: string, anchored: boolean, kind: PartKind) => {
    if (files[key]) parts.push({ key, anchored, kind });
    return !!files[key];
  };
  const cloth = c?.cloth.includes(look.cloth) ? look.cloth : 0;
  add(`body/${look.cls}-${sex}-${cloth}`, false, 'body');
  add(`head/${look.hair}-${sex}-${look.hairColour}`, true, 'head');
  const robes: number[] = [];
  for (const id of wornItems(look)) {
    const it = INDEX.items[String(id)];
    if (!it || !hasSprite(id, look.cls, sex)) { missing.push(id); continue; }
    if (it[0].includes('g')) { robes.push(id); continue; }
    if (!add(`acc/${it[1]}-${sex}`, true, 'acc')) missing.push(id);
  }
  for (const id of robes) {
    if (!add(`robe/${INDEX.items[String(id)][1]}-${look.cls}-${sex}`, false, 'robe')) missing.push(id);
  }
  if (look.weapon && c?.weapons.includes(look.weapon)) add(`weapon/${look.cls}-${sex}-${look.weapon}`, false, 'weapon');
  return { parts, missing };
}

/** The parts that draw the look, or the worn item ids that have no sprite for its class and sex. */
export function partsFor(look: Look): PartRef[] | { missing: number[] } {
  const { parts, missing } = drawable(look);
  return missing.length ? { missing } : parts;
}

/** The act index: pose type x 8 + direction; attack takes the class's type for the sex and weapon. */
export function actionFor(look: Look): number {
  let type = POSE_TYPE[look.pose];
  if (look.pose === 'attack') {
    const atk = look.weapon ? classOf(look.cls)?.atk[sexOf(look)]?.[look.weapon] : undefined;
    type = atk ?? 5;
  }
  return type * 8 + (((look.dir % 8) + 8) % 8);
}

/**
 * The frame a part shows. In stand and sit the body, head and headgear frames
 * are head directions (ahead, left, right), not animation, so they show
 * headDir; so does any other part with exactly those 3 frames. Everything
 * else loops on its own delay, whatever the body's frame count (Review Focus 5).
 */
export function frameFor(kind: PartKind, part: PartData, action: number, look: Look, ms: number): number {
  if (look.pose === 'stand' || look.pose === 'sit') {
    const list = part.acts[String(action)] ?? part.acts['0'];
    if (kind === 'body' || kind === 'head' || kind === 'acc' || list.length === 3) {
      return Math.min(look.headDir, list.length - 1);
    }
  }
  return frameAt(part, action, ms);
}

// The tiles the picker shows for a slot. Pure, like look.ts.
//
// One tile per look, not per item: a costume and the plain headgear it copies
// share a view and so draw the same sprite (about half the items), and a
// grid of identical pairs is noise. A tile keeps every item id behind it and
// wears the first one that suits the filter and has a sprite for the class.
import thumbs from '@/data/dress-up-thumbs.json';
import { INDEX, SLOTS, hasSprite, slotsOf, wear, type Look, type Sex, type Slot } from './look';

export type Filter = 'all' | 'costume' | 'plain';

export interface Tile {
  /** `${acc|robe}/${view}|${slot letters}`, stable across builds */
  key: string;
  slots: Slot[];
  /** newest first */
  ids: number[];
  /** cell index in the thumb sheet, or undefined when there is no picture */
  thumb?: number;
}

export const THUMBS = thumbs as { v: number; cell: number; cols: number; file: string; at: Record<string, number> };

let all: Tile[] | null = null;

/** Every tile, newest look first (the highest item id behind it). */
export function allTiles(): Tile[] {
  if (all) return all;
  const by = new Map<string, Tile>();
  for (const [sid, it] of Object.entries(INDEX.items)) {
    const id = Number(sid);
    const kind = it[0] === 'g' ? 'robe' : 'acc';
    const key = `${kind}/${it[1]}|${it[0]}`;
    let t = by.get(key);
    if (!t) {
      t = { key, slots: slotsOf(id), ids: [], thumb: THUMBS.at[`${kind}/${it[1]}`] };
      by.set(key, t);
    }
    t.ids.push(id);
  }
  all = [...by.values()];
  for (const t of all) t.ids.sort((a, b) => b - a);
  all.sort((a, b) => b.ids[0] - a.ids[0]);
  return all;
}

const suits = (id: number, filter: Filter, costume: ReadonlySet<number>) =>
  filter === 'all' || (filter === 'costume') === costume.has(id);

/** Whether any item behind the tile has a sprite on some class (the rest draw nothing anywhere). */
const drawnAnywhere = (t: Tile) => t.ids.some((id) => INDEX.items[String(id)][2] !== 0);

/** The tiles that fill `slot`, kept to those with an item that suits the filter and draws on some class. */
export function tilesFor(slot: Slot, filter: Filter, costume: ReadonlySet<number>): Tile[] {
  return allTiles().filter((t) => t.slots.includes(slot) && drawnAnywhere(t) && t.ids.some((id) => suits(id, filter, costume)));
}

/** The item a tap wears: one that suits the filter and is drawn on this class, else the first that suits. */
export function pickId(tile: Tile, cls: string, sex: Sex, filter: Filter, costume: ReadonlySet<number>): number {
  const ok = tile.ids.filter((id) => suits(id, filter, costume));
  const pool = ok.length ? ok : tile.ids;
  return pool.find((id) => hasSprite(id, cls, sex)) ?? pool[0];
}

/** Whether any item behind the tile is drawn on this class and sex. */
export function tileDrawn(tile: Tile, cls: string, sex: Sex): boolean {
  return tile.ids.some((id) => hasSprite(id, cls, sex));
}

/** The tile an item belongs to. */
export function tileOf(id: number): Tile | undefined {
  return allTiles().find((t) => t.ids.includes(id));
}

/**
 * A random outfit and hair on the same class: always a top, usually a garment,
 * a middle and a lower when the top left them free. Only items drawn on the
 * class. `rand` returns [0, 1), so tests can pass a seeded one.
 */
export function randomLook(look: Look, sex: Sex, rand: () => number = Math.random): Look {
  const any = <T,>(xs: T[]): T | undefined => (xs.length ? xs[Math.floor(rand() * xs.length)] : undefined);
  const drawn = (slot: Slot, only: boolean) =>
    allTiles().filter((t) => t.slots.includes(slot) && (!only || t.slots.length === 1) && tileDrawn(t, look.cls, sex));
  let next: Look = { ...look, hair: 1 + Math.floor(rand() * INDEX.hair.styles) };
  next.hairColour = any(INDEX.hair.colours)?.id ?? 0;
  for (const s of SLOTS) delete next[s];
  const put = (t: Tile | undefined) => {
    if (t) next = wear(next, pickId(t, look.cls, sex, 'all', new Set()));
  };
  put(any(drawn('upper', false)));
  if (rand() < 0.7) put(any(drawn('garment', true)));
  if (next.mid === undefined && rand() < 0.6) put(any(drawn('mid', true)));
  if (next.lower === undefined && rand() < 0.6) put(any(drawn('lower', true)));
  return next;
}

import { describe, expect, it } from 'vitest';
import { gameItem } from '@/lib/game-items';
import { THUMBS, allTiles, pickId, randomLook, tileDrawn, tileOf, tilesFor } from './catalog';
import { DEFAULT_LOOK, INDEX, SLOTS, hasSprite, slotsOf } from './look';

const COSTUME = new Set(Object.keys(INDEX.items).map(Number).filter((id) => gameItem(id)?.costume));

// A seeded generator, so randomLook is repeatable.
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

describe('allTiles', () => {
  it('holds every item exactly once', () => {
    const ids = allTiles().flatMap((t) => t.ids);
    expect(ids.length).toBe(Object.keys(INDEX.items).length);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('puts items with the same view and slots on one tile (costume and plain copies)', () => {
    const shared = allTiles().filter((t) => t.ids.length > 1);
    expect(shared.length).toBeGreaterThan(300);
    for (const t of shared) {
      const views = new Set(t.ids.map((id) => INDEX.items[String(id)][1]));
      const slots = new Set(t.ids.map((id) => INDEX.items[String(id)][0]));
      expect(views.size).toBe(1);
      expect(slots.size).toBe(1);
    }
    expect(allTiles().length).toBeLessThan(Object.keys(INDEX.items).length * 0.6);
  });

  it('has a picture for every tile with an item drawn anywhere', () => {
    const blank = allTiles().filter((t) => t.thumb === undefined && t.ids.some((id) => INDEX.items[String(id)][2] !== 0));
    expect(blank.map((t) => t.key)).toEqual([]);
    const cells = Math.max(...Object.values(THUMBS.at)) + 1;
    expect(cells).toBe(Object.keys(THUMBS.at).length);
  });
});

describe('tilesFor', () => {
  it('lists a multi-slot look under each slot it fills', () => {
    const t = allTiles().find((x) => x.slots.length > 1)!;
    for (const s of t.slots) expect(tilesFor(s, 'all', COSTUME)).toContain(t);
    for (const s of SLOTS.filter((x) => !t.slots.includes(x))) expect(tilesFor(s, 'all', COSTUME)).not.toContain(t);
  });

  it('leaves out looks with no sprite on any class', () => {
    for (const s of SLOTS) {
      for (const t of tilesFor(s, 'all', COSTUME)) expect(t.ids.some((id) => INDEX.items[String(id)][2] !== 0)).toBe(true);
    }
    const none = allTiles().filter((t) => t.ids.every((id) => INDEX.items[String(id)][2] === 0));
    expect(none.length).toBeGreaterThan(0);
    for (const t of none) for (const s of t.slots) expect(tilesFor(s, 'all', COSTUME)).not.toContain(t);
  });

  it('keeps costume and plain filters to tiles with such an item', () => {
    const cos = tilesFor('upper', 'costume', COSTUME);
    const plain = tilesFor('upper', 'plain', COSTUME);
    expect(cos.length).toBeGreaterThan(50);
    expect(plain.length).toBeGreaterThan(50);
    for (const t of cos) expect(t.ids.some((id) => COSTUME.has(id))).toBe(true);
    for (const t of plain) expect(t.ids.some((id) => !COSTUME.has(id))).toBe(true);
  });
});

describe('pickId', () => {
  it('wears the costume under the costume filter and the plain item under the plain one', () => {
    const t = allTiles().find((x) => x.ids.some((id) => COSTUME.has(id)) && x.ids.some((id) => !COSTUME.has(id)))!;
    expect(COSTUME.has(pickId(t, 'novice', 'm', 'costume', COSTUME))).toBe(true);
    expect(COSTUME.has(pickId(t, 'novice', 'm', 'plain', COSTUME))).toBe(false);
  });

  it('prefers an item drawn on the class', () => {
    const t = allTiles().find((x) => x.ids.some((id) => !hasSprite(id, 'novice', 'm')) && x.ids.some((id) => hasSprite(id, 'novice', 'm')));
    if (!t) return; // no such tile in this build
    expect(hasSprite(pickId(t, 'novice', 'm', 'all', COSTUME), 'novice', 'm')).toBe(true);
  });
});

describe('randomLook', () => {
  it('always wears a top drawn on the class and keeps the class', () => {
    for (let seed = 1; seed <= 30; seed++) {
      const look = randomLook({ ...DEFAULT_LOOK, cls: 'knight' }, 'm', seeded(seed));
      expect(look.cls).toBe('knight');
      expect(look.upper).toBeDefined();
      for (const s of SLOTS) {
        const id = look[s];
        if (id === undefined) continue;
        expect(hasSprite(id, 'knight', 'm')).toBe(true);
        expect(slotsOf(id)).toContain(s);
        expect(tileDrawn(tileOf(id)!, 'knight', 'm')).toBe(true);
      }
      expect(look.hair).toBeGreaterThanOrEqual(1);
      expect(look.hair).toBeLessThanOrEqual(INDEX.hair.styles);
    }
  });

  it('is repeatable for a seed and varies across seeds', () => {
    const a = randomLook(DEFAULT_LOOK, 'm', seeded(7));
    expect(randomLook(DEFAULT_LOOK, 'm', seeded(7))).toEqual(a);
    const tops = new Set(Array.from({ length: 20 }, (_, i) => randomLook(DEFAULT_LOOK, 'm', seeded(i + 1)).upper));
    expect(tops.size).toBeGreaterThan(10);
  });
});

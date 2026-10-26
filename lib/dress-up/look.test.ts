import { afterEach, describe, expect, it, vi } from 'vitest';
import full from '@/data/dress-up.json';
import { dollSex } from '@/lib/build-doll';
import {
  DEFAULT_LOOK, INDEX, actionFor, baseClass, drawable, frameFor, highClass, partsFor, sexOf, takeOff, wear, withClass,
  withOutfit, type Look,
} from './look';
import { DressUpUnavailable, loadPart } from './load';
import type { PartData } from './types';

// Real ids from the index: Wedding Veil (upper), Sunglasses and Glasses (mid),
// Goggles (upper+mid), Costume Sword Wing (garment).
const UPPER_A = 2206;
const MID_B = 2201;
const MID_C = 2203;
const UPPER_MID = 2225;
const GARMENT = 20510;
const NO_SPRITE = full.coverage.missing[0].id;

const keysOf = (look: Look) => {
  const r = partsFor(look);
  if ('missing' in r) throw new Error(`missing ${r.missing}`);
  return r.map((p) => p.key);
};

describe('wear and takeOff (Review Focus 2)', () => {
  it('an upper+mid item replaces both the upper and the mid it lands on', () => {
    const before = wear(wear(DEFAULT_LOOK, UPPER_A), MID_B);
    expect([before.upper, before.mid]).toEqual([UPPER_A, MID_B]);
    const after = wear(before, UPPER_MID);
    expect(after.upper).toBe(UPPER_MID);
    expect(after.mid).toBe(UPPER_MID);
  });

  it('a mid-only item then removes the whole upper+mid item', () => {
    const look = wear(wear(wear(DEFAULT_LOOK, UPPER_A), MID_B), UPPER_MID);
    const after = wear(look, MID_C);
    expect(after.mid).toBe(MID_C);
    expect(after.upper).toBeUndefined();
  });

  it('takeOff clears every slot the item fills', () => {
    const look = takeOff(wear(DEFAULT_LOOK, UPPER_MID), 'mid');
    expect(look.upper).toBeUndefined();
    expect(look.mid).toBeUndefined();
  });

  it('a garment goes in the garment slot; an unknown id changes nothing', () => {
    expect(wear(DEFAULT_LOOK, GARMENT).garment).toBe(GARMENT);
    expect(wear(DEFAULT_LOOK, 1)).toEqual(DEFAULT_LOOK);
  });
});

describe('partsFor', () => {
  it('lists an item with no sprite for knight-f as missing (Review Focus 1)', () => {
    const look = wear({ ...DEFAULT_LOOK, cls: 'knight', sex: 'f' }, NO_SPRITE);
    expect(partsFor(look)).toEqual({ missing: [NO_SPRITE] });
    // drawable still draws the rest, without the missing item
    const d = drawable(look);
    expect(d.missing).toEqual([NO_SPRITE]);
    expect(d.parts.map((p) => p.key)).toEqual(['body/knight-f-0', 'head/1-f-0']);
  });

  it('resolves logical keys for a full look, the double-slot item once', () => {
    let look: Look = { ...DEFAULT_LOOK, cls: 'knight', sex: 'm', hair: 5, hairColour: 8, cloth: 2, weapon: 'sword' };
    look = wear(wear(wear(look, UPPER_MID), GARMENT), UPPER_A);
    const view = (id: number) => (full.items as Record<string, { view: number }>)[id].view;
    expect(partsFor(look)).toEqual([
      { key: 'body/knight-m-2', anchored: false, kind: 'body' },
      { key: 'head/5-m-8', anchored: true, kind: 'head' },
      { key: `acc/${view(UPPER_A)}-m`, anchored: true, kind: 'acc' },
      { key: `robe/${view(GARMENT)}-knight-m`, anchored: false, kind: 'robe' },
      { key: 'weapon/knight-m-sword', anchored: false, kind: 'weapon' },
    ]);
    for (const k of keysOf(look)) expect((full.files as Record<string, string>)[k]).toBeTruthy();
  });

  it('no body file means nothing is drawn, never a look anchored on the head', () => {
    const look = wear({ ...DEFAULT_LOOK, cls: 'gunslinger', weapon: 'dagger' }, UPPER_A);
    expect(drawable(look).parts).toEqual([]);
    expect(partsFor(look)).toEqual([]);
  });

  it('a weapon type the class cannot hold and a cloth it lacks are dropped', () => {
    const keys = keysOf({ ...DEFAULT_LOOK, cls: 'mage', weapon: 'katar', cloth: 7 });
    expect(keys).toEqual(['body/mage-m-0', 'head/1-m-0']);
  });

  it('Bard + f resolves to m, as dollSex says, for every class', () => {
    expect(sexOf({ ...DEFAULT_LOOK, cls: 'bard', sex: 'f' })).toBe('m');
    expect(keysOf({ ...DEFAULT_LOOK, cls: 'bard', sex: 'f' })[0]).toBe('body/bard-m-0');
    for (const c of full.classes) {
      const doll = (c as { of?: string }).of ?? c.slug; // a high class outfit is drawn as its 2nd class's sexes
      for (const s of ['m', 'f'] as const) expect(sexOf({ ...DEFAULT_LOOK, cls: c.slug, sex: s })).toBe(dollSex(doll, s));
    }
  });
});

describe('withClass', () => {
  it('resets a cloth palette and a weapon type the new class lacks, keeps ones it has', () => {
    const odd = withClass({ ...DEFAULT_LOOK, cloth: 7, weapon: 'katar' }, 'mage');
    expect(odd.cls).toBe('mage');
    expect(odd.cloth).toBe(0);
    expect(odd.weapon).toBeUndefined();
    const kept = withClass({ ...DEFAULT_LOOK, cloth: 2, weapon: 'dagger' }, 'assassin');
    expect([kept.cloth, kept.weapon]).toEqual([2, 'dagger']);
  });
});

describe('high class outfits', () => {
  const SECOND = ['knight', 'priest', 'wizard', 'blacksmith', 'hunter', 'assassin', 'crusader', 'monk', 'sage',
    'rogue', 'alchemist', 'bard', 'dancer'];

  it('every 2nd class has one, drawn with a body, its weapons and the stylist colours', () => {
    for (const slug of SECOND) {
      const high = highClass(slug)!;
      expect(high, slug).toBeDefined();
      expect(baseClass(high)).toBe(slug);
      const look = withOutfit({ ...withClass(DEFAULT_LOOK, slug), weapon: undefined }, true);
      expect(look.cls).toBe(high);
      const { parts } = drawable(look);
      expect(parts[0]?.key, high).toMatch(new RegExp(`^body/${high}-`));
      const c = INDEX.classes.find((x) => x.slug === high)!;
      expect(c.weapons).toEqual(INDEX.classes.find((x) => x.slug === slug)!.weapons);
    }
    expect(INDEX.classes.find((x) => x.slug === 'lord-knight')!.cloth).toEqual([0, 2, 3]);
  });

  it('first classes and the novice have none, and the toggle leaves them alone', () => {
    for (const slug of ['novice', 'swordsman', 'mage', 'acolyte']) {
      expect(highClass(slug)).toBeUndefined();
      expect(withOutfit(withClass(DEFAULT_LOOK, slug), true).cls).toBe(slug);
    }
  });

  it('keeps the outfit on across 2nd classes, drops it on a class without one, and takes it off', () => {
    const lk = withOutfit(withClass(DEFAULT_LOOK, 'knight'), true);
    expect(withClass(lk, 'priest').cls).toBe('high-priest');
    expect(withClass(lk, 'mage').cls).toBe('mage');
    expect(withOutfit(lk, false).cls).toBe('knight');
  });

  it('wears garments on the outfit body', () => {
    const { parts, missing } = drawable(wear(withOutfit(withClass(DEFAULT_LOOK, 'knight'), true), GARMENT));
    expect(missing).toEqual([]);
    expect(parts.map((p) => p.key)).toContain(`robe/${INDEX.items[String(GARMENT)][1]}-lord-knight-m`);
  });
});

describe('actionFor', () => {
  it('pose type x 8 + direction', () => {
    expect(actionFor({ ...DEFAULT_LOOK, pose: 'sit', dir: 3 })).toBe(19);
    expect(actionFor({ ...DEFAULT_LOOK, pose: 'dead', dir: 7 })).toBe(71);
  });

  it('attack takes the type for the sex and weapon, 5 when there is none', () => {
    expect(actionFor({ ...DEFAULT_LOOK, pose: 'attack', dir: 0 })).toBe(40);
    // novice: dagger is 10 for m and 11 for f
    expect(actionFor({ ...DEFAULT_LOOK, pose: 'attack', weapon: 'dagger', dir: 2 })).toBe(82);
    expect(actionFor({ ...DEFAULT_LOOK, sex: 'f', pose: 'attack', weapon: 'dagger', dir: 2 })).toBe(90);
  });
});

describe('frameFor', () => {
  const part = (n: number, delay = 100): PartData => ({
    v: 1, w: 1, h: 1, acts: { '0': Array.from({ length: n }, () => [[], null, 0]) }, delay: { '0': delay },
  });

  it('stays in range on a clock a moment before zero (requestAnimationFrame timestamps)', () => {
    const look = { ...DEFAULT_LOOK, headDir: 1 as const };
    for (const ms of [-1, -40, -900]) {
      const f = frameFor('acc', part(24, 40), 0, look, ms);
      expect(f).toBeGreaterThanOrEqual(8);
      expect(f).toBeLessThan(16);
      const r = frameFor('robe', part(5), 0, look, ms);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(5);
    }
  });

  it('in stand, body/head/acc show headDir; a 24-frame garment keeps animating', () => {
    const look = { ...DEFAULT_LOOK, headDir: 2 as const };
    expect(frameFor('head', part(3), 0, look, 12345)).toBe(2);
    expect(frameFor('body', part(3), 0, look, 12345)).toBe(2);
    expect(frameFor('robe', part(24), 0, look, 1650)).toBe(16);
  });

  it('in stand, a 3-frame robe or weapon still advances with time, not headDir', () => {
    const look = { ...DEFAULT_LOOK, headDir: 2 as const };
    expect(frameFor('robe', part(3), 0, look, 0)).toBe(0);
    expect(frameFor('robe', part(3), 0, look, 150)).toBe(1);
    expect(frameFor('weapon', part(3), 0, { ...look, pose: 'sit' }, 150)).toBe(1);
  });

  it('in stand, a 24-frame headgear is 3 head directions x 8 frames that keep animating', () => {
    const hat = part(24, 100);
    for (const headDir of [0, 1, 2] as const) {
      const look = { ...DEFAULT_LOOK, headDir };
      for (let t = 0; t < 8; t++) expect(frameFor('acc', hat, 0, look, t * 100 + 50)).toBe(headDir * 8 + t);
      expect(frameFor('acc', hat, 0, look, 850)).toBe(headDir * 8); // wraps inside its group
    }
    expect(frameFor('acc', hat, 0, { ...DEFAULT_LOOK, pose: 'sit', headDir: 2 }, 350)).toBe(19);
  });

  it('in walk, every part runs on its own delay', () => {
    const walk = { ...DEFAULT_LOOK, pose: 'walk' as const, headDir: 2 as const };
    expect(frameFor('head', part(3), 8, walk, 250)).toBe(2);
    expect(frameFor('head', part(8), 8, walk, 450)).toBe(4);
  });
});

describe('loadPart (Review Focus 4)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('rejects with DressUpUnavailable when the base URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_DRESSUP_BASE', '');
    await expect(loadPart('body/novice-m-0')).rejects.toBeInstanceOf(DressUpUnavailable);
  });

  it('rejects with DressUpUnavailable when the fetch fails', async () => {
    vi.stubEnv('NEXT_PUBLIC_DRESSUP_BASE', 'http://127.0.0.1:9/');
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('network'));
    vi.stubGlobal('fetch', fetchMock);
    await expect(loadPart('body/novice-f-0')).rejects.toBeInstanceOf(DressUpUnavailable);
    expect(fetchMock.mock.calls[0][0]).toMatch(/^http:\/\/127\.0\.0\.1:9\/body\/novice-f-0\.[0-9a-f]{8}\.json$/);
    vi.unstubAllGlobals();
  });
});

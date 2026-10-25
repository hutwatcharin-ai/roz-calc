import { describe, it, expect } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { composeFrame, frameAt } from './render';
import type { Atlas, FrameData, PartData, Placed } from './types';

const FX = path.join(__dirname, '__fixtures__');
type Look = { parts: { key: string; anchored: boolean }[]; action: number; frames: number[]; ref: number };
const looks: Look[] = JSON.parse(readFileSync(path.join(FX, 'looks.json'), 'utf8'));

const cache = new Map<string, { part: PartData; atlas: Atlas }>();
function load(key: string) {
  let v = cache.get(key);
  if (!v) {
    const part: PartData = JSON.parse(readFileSync(path.join(FX, 'parts', `${key}.json`), 'utf8'));
    const raw = gunzipSync(readFileSync(path.join(FX, 'parts', `${key}.rgba.gz`)));
    const data = new Uint8ClampedArray(raw.length);
    data.set(raw);
    v = { part, atlas: { w: part.w, h: part.h, data } };
    cache.set(key, v);
  }
  return v;
}

describe('composeFrame', () => {
  it('has the 30 random looks plus the dead and 24-frame robe looks', () => {
    expect(looks).toHaveLength(32);
    expect(looks[30].action >> 3).toBe(8);
    const robe = looks[31].parts.findIndex((p) => p.key.startsWith('robe-angel-'));
    expect(looks[31].action).toBe(0);
    expect(looks[31].frames[0]).toBe(0);
    expect(looks[31].frames[robe]).toBe(16);
  });

  it.each(looks.map((l, i) => [i, l] as const))('matches the client reference #%#', (i, look) => {
    const placed: Placed[] = look.parts.map((p, n) => ({
      ...load(p.key),
      anchored: p.anchored,
      frame: look.frames[n],
    }));
    const out = composeFrame(placed, look.action);
    const ref = gunzipSync(readFileSync(path.join(FX, 'ref', `${look.ref}.rgba.gz`)));
    expect(ref.length).toBe(200 * 200 * 4);
    let diff = 0;
    for (let p = 0; p < 200 * 200; p++) {
      for (let c = 0; c < 4; c++) {
        if (out.data[p * 4 + c] !== ref[p * 4 + c]) { diff++; break; }
      }
    }
    const rotated = placed.some((pl) => {
      const list = pl.part.acts[String(look.action)] ?? pl.part.acts['0'];
      return list[pl.frame % list.length][0].some((l) => l[9] !== 0);
    });
    if (rotated) {
      if (diff > 0) console.log(`look #${i} has rot: ${diff} differing pixels`);
      expect(diff).toBeLessThanOrEqual(200 * 200 * 0.005);
    } else {
      expect(diff).toBe(0);
    }
  });
});

describe('z order', () => {
  // 1x1 parts: a red body with an anchor, a blue anchored part on the same pixel.
  const px = (r: number, g: number, b: number): Atlas => ({ w: 1, h: 1, data: new Uint8ClampedArray([r, g, b, 255]) });
  const one = (z: number, anchor: [number, number]): PartData => ({
    v: 1, w: 1, h: 1,
    acts: { '0': [[[[0, 0, 0, 0, 1, 1, 0, 1, 1, 0, 255, 255, 255, 255]], anchor, z]] },
    delay: { '0': 100 },
  });
  const at = (a: Atlas, x: number, y: number) => Array.from(a.data.subarray((y * a.w + x) * 4, (y * a.w + x) * 4 + 4));

  it('draws a higher z later whatever the array order', () => {
    const body: Placed = { part: one(10, [0, 0]), atlas: px(255, 0, 0), anchored: false, frame: 0 };
    const head: Placed = { part: one(5, [0, 0]), atlas: px(0, 0, 255), anchored: true, frame: 0 };
    expect(at(composeFrame([body, head], 0), 100, 150)).toEqual([255, 0, 0, 255]);
    head.part = one(15, [0, 0]);
    expect(at(composeFrame([body, head], 0), 100, 150)).toEqual([0, 0, 255, 255]);
  });

  it('keeps array order for equal z', () => {
    const a: Placed = { part: one(3, [0, 0]), atlas: px(255, 0, 0), anchored: false, frame: 0 };
    const b: Placed = { part: one(3, [0, 0]), atlas: px(0, 255, 0), anchored: false, frame: 0 };
    expect(at(composeFrame([a, b], 0), 100, 150)).toEqual([0, 255, 0, 255]);
    expect(at(composeFrame([b, a], 0), 100, 150)).toEqual([255, 0, 0, 255]);
  });

  it('anchors on placed[0] even when it draws last', () => {
    const body: Placed = { part: one(10, [4, 2]), atlas: px(255, 0, 0), anchored: false, frame: 0 };
    const head: Placed = { part: one(5, [0, 0]), atlas: px(0, 0, 255), anchored: true, frame: 0 };
    const out = composeFrame([body, head], 0);
    expect(at(out, 104, 152)).toEqual([0, 0, 255, 255]);
    expect(at(out, 100, 150)).toEqual([255, 0, 0, 255]);
  });
});

describe('frameAt', () => {
  const mk = (n: number): PartData => ({
    v: 1, w: 1, h: 1,
    acts: { '0': Array.from({ length: n }, () => [[], null, 0] as FrameData) },
    delay: { '0': 100 },
  });
  it('steps by the part delay', () => expect(frameAt(mk(4), 0, 250)).toBe(2));
  it('single frame stays 0', () => expect(frameAt(mk(1), 0, 9999)).toBe(0));
  // requestAnimationFrame's timestamp is when the frame began, which can be a moment before the
  // performance.now() the stage started its clock with: a small negative ms must still give a frame.
  it('a clock a moment before zero still gives a frame in range', () => {
    for (const ms of [-1, -16, -250]) {
      const f = frameAt(mk(4), 0, ms);
      expect(f).toBeGreaterThanOrEqual(0);
      expect(f).toBeLessThan(4);
    }
  });
  it('a missing action uses action 0 frames and delay', () => expect(frameAt(mk(4), 66, 250)).toBe(2));
  it('uses the action own delay', () => {
    const p = mk(4);
    p.acts['8'] = Array.from({ length: 8 }, () => [[], null, 0] as FrameData);
    p.delay['8'] = 50;
    expect(frameAt(p, 8, 250)).toBe(5);
  });
});

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
      console.log(`look #${i} has rot: ${diff} differing pixels`);
      expect(diff).toBeLessThanOrEqual(200 * 200 * 0.005);
    } else {
      expect(diff).toBe(0);
    }
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
});

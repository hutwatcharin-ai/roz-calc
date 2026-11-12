import { describe, expect, it } from 'vitest';
import full from '@/data/dress-up.json';
import slim from '@/data/dress-up-client.json';
import { buildClient } from '@/scripts/build-dress-up-client.mjs';

describe('data/dress-up-client.json', () => {
  it('is what scripts/build-dress-up-client.mjs makes from data/dress-up.json (run npm run dress-up:build)', () => {
    expect(slim).toEqual(buildClient(full));
  });

  it('keeps every exception: items with no sprite are flagged', () => {
    const fx = (slim as { fx?: Record<string, number> }).fx ?? {};
    const none = Object.entries(slim.items).filter(([id, v]) => (v as unknown[])[2] === 0 && !(id in fx)).map(([id]) => Number(id));
    expect(none.sort()).toEqual(full.coverage.missing.map((m) => m.id).sort());
  });
});

describe('buildClient with effect costumes', () => {
  const fixture = {
    v: 1,
    classes: [{ slug: 'novice', sexes: ['m'], cloth: [0], weapons: [], attackTypeBySex: {} }],
    hair: { styles: 1, colours: [] },
    carts: 0,
    items: {
      '20515': { slots: ['upper'], view: 0, has: {}, fx: 56 },
      '5000': { slots: ['mid'], view: 12, has: { 'novice-m': true }, fx: 164 },
      '5001': { slots: ['lower'], view: 13, has: { 'novice-m': true } },
    },
    files: { 'fx/56': 'fx/56.0123abcd', 'fx/164': 'fx/164.89abcdef' },
  };

  it('lists the effect of every item that has one', () => {
    expect(buildClient(fixture).fx).toEqual({ '20515': 56, '5000': 164 });
  });

  it('keeps an effect-only item as [slots, 0, 0] and a sprite+effect item as usual', () => {
    const { items, files } = buildClient(fixture) as unknown as { items: Record<string, unknown>; files: Record<string, string> };
    expect(items['20515']).toEqual(['u', 0, 0]);
    expect(items['5000']).toEqual(['m', 12]);
    expect(files['fx/56']).toBe('0123abcd');
  });
});

// The star-gear guide shows one weapon tier-1 cost read off the first row of
// data/reform.json; that is only true while every row costs the same.
import { describe, expect, it } from 'vitest';
import reform from '@/data/reform.json';
import star from '@/data/star-gear.json';

describe('data/reform.json', () => {
  const rows = reform.reforms;
  it('has one cost for every weapon', () => {
    const first = rows[0];
    for (const r of rows) {
      expect([r.tokenAmount, r.coinAmount, r.refineMin, r.refineMax, r.refineChange]).toEqual([
        first.tokenAmount, first.coinAmount, first.refineMin, first.refineMax, first.refineChange,
      ]);
    }
  });
  it('turns into a ★ piece the guide lists', () => {
    const ids = new Set(star.items.map((i) => i.id));
    for (const r of rows) expect(ids.has(r.star)).toBe(true);
  });
});

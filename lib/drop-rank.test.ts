import { describe, expect, it } from 'vitest';
import { rankDrops } from './drop-rank';

const rows = [
  { monster_id: 1, rate: 1 }, // rare on the map
  { monster_id: 2, rate: 0.5 }, // common on the map
  { monster_id: 3, rate: 5 }, // only on a closed map
  { monster_id: 4, rate: 2 }, // spawn count unknown
];
const spawns = [
  { monster_id: 1, map_code: 'a', map_name: 'A', amount: 2 },
  { monster_id: 2, map_code: 'b', map_name: 'B', amount: 60 },
  { monster_id: 2, map_code: 'c', map_name: 'C', amount: 10 },
  { monster_id: 3, map_code: 'closed', map_name: 'Closed', amount: 99 },
  { monster_id: 4, map_code: 'd', map_name: 'D', amount: null },
];

describe('rankDrops', () => {
  const out = rankDrops(rows, spawns, (m) => m === 'closed');

  it('ranks by items per clear of the best open map, not by rate', () => {
    expect(out.map((r) => r.row.monster_id)).toEqual([2, 1, 4, 3]);
    expect(out[0].perClear).toBeCloseTo(0.3);
    expect(out[0].best).toEqual({ code: 'b', name: 'B', amount: 60 });
  });

  it('adds up several spawn groups on one map', () => {
    const two = rankDrops([{ monster_id: 9, rate: 1 }], [
      { monster_id: 9, map_code: 'm', map_name: 'M', amount: 30 },
      { monster_id: 9, map_code: 'm', map_name: 'M', amount: 20 },
    ], () => false);
    expect(two[0].best?.amount).toBe(50);
  });

  it('says how many kills one item takes', () => {
    expect(out.find((r) => r.row.monster_id === 2)?.killsPerItem).toBe(200);
  });

  it('puts unknown counts after scored rows and closed maps last', () => {
    expect(out[2]).toMatchObject({ perClear: null, closed: false });
    expect(out[3]).toMatchObject({ closed: true, best: null });
  });
});

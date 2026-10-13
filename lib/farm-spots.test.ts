import { describe, expect, it } from 'vitest';
import { farmSpots } from './farm-spots';

const closed = (code: string) => code === 'closed_map';
const spawn = (monster_id: number, map_code: string, amount: number | null) => ({ monster_id, map_code, map_name: map_code.toUpperCase(), amount });

describe('farmSpots', () => {
  it('puts the faster map first, not the higher rate', () => {
    // 1% with 2 on the map gives 0.02 a clear; 0.5% with 60 gives 0.3.
    const r = farmSpots(
      [
        { monster_id: 1, name: 'Rare', level: 50, rate: 1 },
        { monster_id: 2, name: 'Common', level: 40, rate: 0.5 },
      ],
      [spawn(1, 'a', 2), spawn(2, 'b', 60)],
      closed,
    );
    expect(r.spots.map((s) => s.monster.name)).toEqual(['Common', 'Rare']);
    expect(r.spots[0]).toMatchObject({ map: { code: 'b', name: 'B' }, amount: 60, killsPerItem: 200, perClear: 0.3 });
  });

  it('picks the open map with the most of the monster', () => {
    const r = farmSpots([{ monster_id: 1, name: 'Horn', level: 18, rate: 10 }], [spawn(1, 'few', 5), spawn(1, 'many', 181), spawn(1, 'closed_map', 500)], closed);
    expect(r.spots[0].map.code).toBe('many');
    expect(r.spots[0].amount).toBe(181);
    expect(r.closedOnly).toBe(0);
  });

  it('counts a dropper that only lives on closed maps instead of listing it', () => {
    const r = farmSpots([{ monster_id: 1, name: 'Later', level: 90, rate: 5 }], [spawn(1, 'closed_map', 30)], closed);
    expect(r.spots).toEqual([]);
    expect(r.closedOnly).toBe(1);
  });

  it('leaves champions out and does not call a spawnless monster closed', () => {
    const r = farmSpots(
      [
        { monster_id: 1, name: 'Swift Poring', level: 1, rate: 50 },
        { monster_id: 2, name: 'Instance Boss', level: 99, rate: 5 },
      ],
      [spawn(1, 'a', 10)],
      closed,
    );
    expect(r.spots).toEqual([]);
    expect(r.closedOnly).toBe(0);
  });

  it('keeps an unknown count or rate unknown, and stops at the limit', () => {
    const r = farmSpots(
      [1, 2, 3, 4].map((id) => ({ monster_id: id, name: `M${id}`, level: 10, rate: id === 4 ? null : id })),
      [spawn(1, 'a', 10), spawn(2, 'b', null), spawn(3, 'c', 10), spawn(4, 'd', 10)],
      closed,
      3,
    );
    expect(r.spots).toHaveLength(3);
    const m2 = farmSpots([{ monster_id: 2, name: 'M2', level: 10, rate: 2 }], [spawn(2, 'b', null)], closed).spots[0];
    expect(m2).toMatchObject({ amount: null, perClear: null, killsPerItem: 50 });
    const m4 = farmSpots([{ monster_id: 4, name: 'M4', level: 10, rate: null }], [spawn(4, 'd', 10)], closed).spots[0];
    expect(m4).toMatchObject({ amount: 10, perClear: null, killsPerItem: null });
  });
});

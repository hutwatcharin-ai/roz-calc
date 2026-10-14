import { describe, expect, it } from 'vitest';
import { buildCostumeDrops, groupByMap, matchesCostumeDrop, upcomingCostumes, type MonsterIn, type SpawnIn } from './costume-drops';

const mob = (id: number, name: string, level: number): MonsterIn => ({ id, name_en: name, level, is_mvp: false });
const spawn = (monster_id: number, map_code: string, amount: number | null): SpawnIn => ({ monster_id, map_code, map_name: map_code, amount });

const base = {
  isClosed: (code: string) => code.startsWith('yun_'),
  isClone: (name: string) => /^C\d_/.test(name),
  isCanonical: (code: string) => !code.endsWith('_a'),
};

describe('buildCostumeDrops', () => {
  it('lists droppers lowest level first with their biggest open map first', () => {
    const rows = buildCostumeDrops({
      ...base,
      costumes: [{ id: 1, name_en: 'Poo Poo Hat (Bound)', weapon_type: 'Upper' }],
      drops: [
        { item_id: 1, monster_id: 20, rate: null },
        { item_id: 1, monster_id: 10, rate: null },
      ],
      monsters: [mob(10, 'Chonchon', 4), mob(20, 'Steel Chonchon', 23)],
      spawns: [spawn(10, 'prt_fild01', 10), spawn(10, 'pay_fild01', 40), spawn(10, 'pay_fild01', 5), spawn(20, 'mjolnir_02', 30)],
    });
    expect(rows[0].droppers.map((d) => d.name)).toEqual(['Chonchon', 'Steel Chonchon']);
    expect(rows[0].droppers[0].maps.map((m) => [m.code, m.amount])).toEqual([['pay_fild01', 45], ['prt_fild01', 10]]);
    expect(rows[0].minLevel).toBe(4);
  });

  it('leaves out clones, closed maps, channel copies, and a costume nobody open drops', () => {
    const rows = buildCostumeDrops({
      ...base,
      costumes: [
        { id: 1, name_en: 'Frog Hat (Bound)', weapon_type: 'Upper' },
        { id: 2, name_en: 'Bird Nest (Bound)', weapon_type: 'Upper' },
      ],
      drops: [
        { item_id: 1, monster_id: 30, rate: null },
        { item_id: 1, monster_id: 31, rate: null },
        { item_id: 2, monster_id: 40, rate: null },
      ],
      monsters: [mob(30, 'C1_POISON_TOAD', 40), mob(31, 'Poison Toad', 40), mob(40, 'Harpy', 70)],
      spawns: [spawn(30, 'pay_fild05', 1), spawn(31, 'pay_fild05', 20), spawn(31, 'pay_fild05_a', 20), spawn(40, 'yun_fild02', 50)],
    });
    expect(rows.map((r) => r.name)).toEqual(['Frog Hat (Bound)']);
    expect(rows[0].droppers.map((d) => d.name)).toEqual(['Poison Toad']);
    expect(rows[0].droppers[0].maps.map((m) => m.code)).toEqual(['pay_fild05']);
  });

  it('keeps an unknown spawn count unknown instead of adding it as zero', () => {
    const rows = buildCostumeDrops({
      ...base,
      costumes: [{ id: 1, name_en: 'X', weapon_type: null }],
      drops: [{ item_id: 1, monster_id: 1, rate: null }],
      monsters: [mob(1, 'M', 1)],
      spawns: [spawn(1, 'a', 3), spawn(1, 'a', null)],
    });
    expect(rows[0].droppers[0].maps[0].amount).toBeNull();
  });
});

describe('upcomingCostumes', () => {
  it('lists costumes only on closed maps, earliest month first, TBD last', () => {
    const input = {
      ...base,
      costumes: [
        { id: 1, name_en: 'Open One', weapon_type: null },
        { id: 2, name_en: 'Glast Hat', weapon_type: null },
        { id: 3, name_en: 'Yuno Hat', weapon_type: null },
        { id: 4, name_en: 'Izlude Hat', weapon_type: null },
      ],
      drops: [1, 2, 3, 4].map((i) => ({ item_id: i, monster_id: i, rate: null })),
      monsters: [mob(1, 'A', 1), mob(2, 'B', 80), mob(3, 'C', 70), mob(4, 'D', 50)],
      spawns: [spawn(1, 'prt_fild01', 5), spawn(2, 'gl_c01', 5), spawn(2, 'yun_x', 5), spawn(3, 'yun_fild02', 5), spawn(4, 'iz_d04', 5)],
    };
    const when: Record<string, string> = { gl_c01: 'DEC 2026', yun_x: 'MAR 2027', yun_fild02: 'JAN 2027', iz_d04: 'TBD' };
    const closed = (code: string) => code in when;
    const open = buildCostumeDrops({ ...input, isClosed: closed });
    const all = buildCostumeDrops({ ...input, isClosed: () => false });
    const result = upcomingCostumes(all, open, (code) => when[code] ?? null);
    expect(result.map((r) => [r.costume.name, r.when])).toEqual([
      ['Glast Hat', 'DEC 2026'],
      ['Yuno Hat', 'JAN 2027'],
      ['Izlude Hat', null],
    ]);
  });
});

describe('groupByMap and search', () => {
  const rows = buildCostumeDrops({
    ...base,
    costumes: [
      { id: 1, name_en: 'Bamboo Hat (Bound)', weapon_type: 'Upper' },
      { id: 2, name_en: 'Butterfly Hairpin (Bound)', weapon_type: 'Upper' },
    ],
    drops: [
      { item_id: 1, monster_id: 1, rate: null },
      { item_id: 2, monster_id: 2, rate: null },
    ],
    monsters: [mob(1, 'Fabre', 6), mob(2, 'Spore', 16)],
    spawns: [spawn(1, 'prt_fild08', 177), spawn(2, 'prt_fild08', 10), spawn(2, 'pay_fild02', 60)],
  });

  it('puts the map with the most costumes first', () => {
    const groups = groupByMap(rows);
    expect(groups[0].code).toBe('prt_fild08');
    expect(groups[0].entries.map((e) => e.dropper.name)).toEqual(['Fabre', 'Spore']);
  });

  it('finds a costume by its own name, its monster or its map', () => {
    expect(rows.filter((r) => matchesCostumeDrop(r, 'fabre')).map((r) => r.id)).toEqual([1]);
    expect(rows.filter((r) => matchesCostumeDrop(r, 'pay_fild02')).map((r) => r.id)).toEqual([2]);
    expect(rows.filter((r) => matchesCostumeDrop(r, 'butterfly')).map((r) => r.id)).toEqual([2]);
  });
});

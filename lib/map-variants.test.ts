import { describe, expect, it } from 'vitest';
import { canonicalByCode, canonicalOf, groupMapVariants, type MapRow } from './map-variants';

function maps(...rows: [string, string][]): MapRow[] {
  return rows.map(([map_code, map_display_name]) => ({ map_code, map_display_name }));
}

describe('canonicalOf', () => {
  it('prefers the code with no channel suffix and no b_ prefix', () => {
    expect(canonicalOf(['gef_f10_a', 'gef_fild10', 'gef_f10_b'])).toBe('gef_fild10');
  });

  it('falls back to the shortest, then alphabetical, when every code is a variant', () => {
    // Ant Hell 1F has no plain code in our data -- only channels.
    expect(canonicalOf(['an_d01_b', 'an_d01_a'])).toBe('an_d01_a');
  });

  it('is stable however the codes arrive', () => {
    expect(canonicalOf(['gef_f10_b', 'gef_f10_a', 'gef_fild10'])).toBe(
      canonicalOf(['gef_fild10', 'gef_f10_a', 'gef_f10_b']),
    );
  });
});

describe('groupMapVariants', () => {
  const spawns = new Map<string, Set<number>>([
    ['gef_fild10', new Set([1023, 1189])],
    ['gef_f10_a', new Set([1023, 1189])],
    ['gef_f10_b', new Set([1189, 1023])], // same set, different order
    ['gef_f10_z', new Set([1023, 1189, 25188])], // event monster on top
    ['b_gef_f10', new Set([1190])], // boss room
  ]);

  it('folds channels of one map together', () => {
    const groups = groupMapVariants(
      maps(['gef_fild10', 'Orc Village'], ['gef_f10_a', 'Orc Village'], ['gef_f10_b', 'Orc Village']),
      spawns,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]).toEqual({ canonical: 'gef_fild10', variants: ['gef_f10_a', 'gef_f10_b'] });
  });

  it('keeps the event channel out: one extra monster is different content', () => {
    const groups = groupMapVariants(
      maps(['gef_fild10', 'Orc Village'], ['gef_f10_z', 'Orc Village']),
      spawns,
    );
    expect(groups).toHaveLength(2);
  });

  it('keeps the boss room out', () => {
    const groups = groupMapVariants(
      maps(['gef_fild10', 'Orc Village'], ['b_gef_f10', 'Orc Village']),
      spawns,
    );
    expect(groups).toHaveLength(2);
  });

  it('does not fold two different places that happen to hold the same monster', () => {
    // Both hold only Poring; they are not the same field.
    const onlyPoring = new Map([['prt_fild08', new Set([1002])], ['pay_fild04', new Set([1002])]]);
    const groups = groupMapVariants(
      maps(['prt_fild08', 'Prontera Field'], ['pay_fild04', 'Payon Field']),
      onlyPoring,
    );
    expect(groups).toHaveLength(2);
  });

  it('gives a map with no spawn data a group of its own', () => {
    // Two empty maps under different names must not collapse into one page.
    const groups = groupMapVariants(maps(['a_map', 'A'], ['b_map', 'B']), new Map());
    expect(groups).toHaveLength(2);
  });

  it('folds a Zero channel copy the game names differently when every count matches (5 Oct 2026)', () => {
    const counts = new Map<string, Map<number, number>>([
      ['iz_dun02', new Map([[1069, 40], [1070, 30]])],
      ['iz_d02_a', new Map([[1069, 40], [1070, 30]])],
      ['iz_d02_b', new Map([[1070, 30], [1069, 40]])],
    ]);
    const groups = groupMapVariants(
      maps(['iz_dun02', 'Izlude Undersea Tunnel 3F'], ['iz_d02_a', 'Undersea Cave 3F'], ['iz_d02_b', 'Undersea Cave 3F']),
      counts,
    );
    expect(groups).toEqual([{ canonical: 'iz_dun02', variants: ['iz_d02_a', 'iz_d02_b'] }]);
  });

  it('keeps two floors apart when they hold the same species in different numbers', () => {
    const counts = new Map<string, Map<number, number>>([
      ['gld_dun01', new Map([[1001, 20], [1002, 10]])],
      ['gld_dun01_2', new Map([[1001, 35], [1002, 10]])],
    ]);
    const groups = groupMapVariants(maps(['gld_dun01', 'Greenwood Lake Dungeon 1F'], ['gld_dun01_2', 'Greenwood Lake Dungeon 2F']), counts);
    expect(groups).toHaveLength(2);
  });

  it('never folds two differently named maps on one species, even with equal counts', () => {
    const counts = new Map<string, Map<number, number>>([
      ['prt_fild08', new Map([[1002, 50]])],
      ['pay_fild04', new Map([[1002, 50]])],
    ]);
    expect(groupMapVariants(maps(['prt_fild08', 'Prontera Field'], ['pay_fild04', 'Payon Field']), counts)).toHaveLength(2);
  });

  it('folds a boss room with its _z copy by code even when the names differ', () => {
    const counts = new Map<string, Map<number, number>>([['b_nif', new Map([[1291, 1]])], ['b_nif_z', new Map([[1291, 1]])]]);
    expect(groupMapVariants(maps(['b_nif', 'b_nif'], ['b_nif_z', 'b_nif_z']), counts)).toEqual([{ canonical: 'b_nif', variants: ['b_nif_z'] }]);
  });

  it('returns a group of one for a map with nothing to fold', () => {
    const groups = groupMapVariants(maps(['gef_fild10', 'Orc Village']), spawns);
    expect(groups).toEqual([{ canonical: 'gef_fild10', variants: [] }]);
  });
});

describe('canonicalByCode', () => {
  it('maps every variant to its canonical and leaves canonicals out', () => {
    const lookup = canonicalByCode([
      { canonical: 'gef_fild10', variants: ['gef_f10_a', 'gef_f10_b'] },
      { canonical: 'gef_f10_z', variants: [] },
    ]);
    expect(lookup).toEqual({ gef_f10_a: 'gef_fild10', gef_f10_b: 'gef_fild10' });
    expect(lookup.gef_fild10).toBeUndefined();
  });
});

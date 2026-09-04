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

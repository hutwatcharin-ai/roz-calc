import { describe, it, expect } from 'vitest';
import { codeNumber, foldSpawns } from './spawn-chips';

describe('codeNumber', () => {
  it('reads the number off field, channel, boss and typo codes', () => {
    expect(codeNumber('prt_fild08')).toBe('08');
    expect(codeNumber('prt_f08_a')).toBe('08');
    expect(codeNumber('b_prt_f08')).toBe('08');
    expect(codeNumber('moc_fild17_')).toBe('17');
    expect(codeNumber('gef_fild00')).toBe('00');
  });
  it('returns null when there is none', () => {
    expect(codeNumber('prontera')).toBeNull();
    expect(codeNumber('gl_chyard')).toBeNull();
  });
});

describe('foldSpawns', () => {
  const byCode = { prt_f08_a: 'prt_fild08', prt_f08_b: 'prt_fild08', prt_f08_z: 'prt_fild08' };

  it('folds channel copies into one chip and counts them', () => {
    const chips = foldSpawns(
      [
        { map_code: 'prt_f08_a', map_display_name: 'Prontera Field', amount: 197 },
        { map_code: 'prt_f08_b', map_display_name: 'Prontera Field', amount: 197 },
        { map_code: 'prt_fild08', map_display_name: 'Prontera Field', amount: 197 },
      ],
      byCode,
    );
    expect(chips).toHaveLength(1);
    expect(chips[0].code).toBe('prt_fild08');
    expect(chips[0].channels).toBe(2);
  });

  it('numbers a name only when several maps on the page share it', () => {
    const chips = foldSpawns(
      [
        { map_code: 'prt_fild01', map_display_name: 'Prontera Field', amount: 42 },
        { map_code: 'prt_fild08', map_display_name: 'Prontera Field', amount: 197 },
        { map_code: 'xmas_dun01', map_display_name: 'Lutie Toy Factory Warehouse', amount: 12 },
      ],
      {},
    );
    expect(chips.map((c) => c.label)).toEqual(['Prontera Field 08', 'Prontera Field 01', 'Lutie Toy Factory Warehouse']);
  });

  it('leaves a name that already carries a floor alone', () => {
    const chips = foldSpawns(
      [
        { map_code: 'maz_d01_a', map_display_name: 'Labyrinth Forest 1F', amount: 5 },
        { map_code: 'maz_d02_a', map_display_name: 'Labyrinth Forest 1F', amount: 5 },
      ],
      {},
    );
    expect(chips.map((c) => c.label)).toEqual(['Labyrinth Forest 1F', 'Labyrinth Forest 1F']);
  });

  it('sorts by spawn count, most first, unknown last', () => {
    const chips = foldSpawns(
      [
        { map_code: 'a01', map_display_name: 'A', amount: null },
        { map_code: 'b01', map_display_name: 'B', amount: 3 },
        { map_code: 'c01', map_display_name: 'C', amount: 30 },
      ],
      {},
    );
    expect(chips.map((c) => c.code)).toEqual(['c01', 'b01', 'a01']);
  });

  it('folds the event channel and the classic-code row into the same chip', () => {
    const chips = foldSpawns(
      [
        { map_code: 'pay_f01_a', map_display_name: 'Payon Forest', amount: 38 },
        { map_code: 'pay_f01_b', map_display_name: 'Payon Forest', amount: 38 },
        { map_code: 'pay_f01_z', map_display_name: 'Payon Forest', amount: 38 },
        { map_code: 'pay_fild01', map_display_name: 'Payon Forest', amount: 38 },
      ],
      { pay_f01_b: 'pay_f01_a' },
    );
    expect(chips).toHaveLength(1);
    expect(chips[0].code).toBe('pay_fild01');
    expect(chips[0].channels).toBe(3);
  });

  it('keeps a boss room apart from the field it is named after', () => {
    const chips = foldSpawns(
      [
        { map_code: 'gef_fild10', map_display_name: 'Orc Village', amount: 20 },
        { map_code: 'b_gef_f10', map_display_name: 'Orc Village', amount: 1 },
      ],
      {},
    );
    expect(chips).toHaveLength(2);
  });

  it('takes the amount from the owning row when a variant came first', () => {
    const chips = foldSpawns(
      [
        { map_code: 'prt_f08_a', map_display_name: 'Prontera Field', amount: 100 },
        { map_code: 'prt_fild08', map_display_name: 'Prontera Field', amount: 197 },
      ],
      byCode,
    );
    expect(chips[0].amount).toBe(197);
  });
});

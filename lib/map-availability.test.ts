import { describe, expect, it } from 'vitest';
import { mapRelease } from './map-availability';

describe('mapRelease', () => {
  it('closes the areas the publisher roadmap has not opened yet', () => {
    // Named by the roadmap but not bannered by rozerodb: without the roadmap
    // rows these sat in the farm rankings as if a player could walk in.
    expect(mapRelease('c_tower1')).toMatchObject({ when: 'OCT 2026', area: 'Clock Tower' });
    expect(mapRelease('alde_dun01')?.area).toBe('Clock Tower');
    expect(mapRelease('anthell01')?.when).toBe('NOV 2026');
    expect(mapRelease('tur_d01_a')?.area).toBe('Turtle Island');
    expect(mapRelease('tre_d01_a')?.area).toBe('Sunken Ship');
  });

  it('closes the Zero copies rozerodb files under another name', () => {
    // tow_d is rozerodb's "Clock Tower F1", xma_d its "Toy Factory".
    expect(mapRelease('tow_d01_a')?.area).toBe('Clock Tower');
    expect(mapRelease('xma_d01_a')?.area).toBe('Lutie');
  });

  it('prefers the roadmap month when the two sources disagree', () => {
    // Glast Heim: roadmap DEC 2026, rozerodb JAN 2027.
    expect(mapRelease('gl_knt01')).toMatchObject({ when: 'DEC 2026', sources: ['roadmap', 'rozerodb'] });
  });

  it('closes Izlude Pirate Cave / Undersea on the owner\'s in-game confirmation, not a crawled source', () => {
    // iz_d has no rozerodb banner and no roadmap line at all -- this is a
    // manual close, unlike every other entry in this file.
    expect(mapRelease('iz_dun02')).toMatchObject({ when: 'TBD', area: 'Pirate Cave' });
    expect(mapRelease('iz_d00_a')?.area).toBe('Pirate Cave');
  });

  it('opens Pyramid from the 17 Sep 2026 update even though rozerodb still banners it', () => {
    // rozerodb said OCT 2026; the publisher's notice put it in the 17 Sep patch.
    for (const code of ['moc_pryd01', 'moc_pryd06', 'pry_d01_a', 'b_pry_d04']) {
      expect(mapRelease(code), code).toBeNull();
    }
    // The override is scoped: Clock Tower, also bannered OCT, stays closed.
    expect(mapRelease('c_tower1')?.area).toBe('Clock Tower');
  });

  it('opens Labyrinth, Sphinx and Mjolnir from the 1 Oct 2026 update, not Clock Tower', () => {
    for (const code of ['prt_maze01', 'maz_d01_a', 'b_maz_d03', 'in_sphinx1', 'sp_d01_a', 'b_sp_d05', 'mjo_dun01', 'mjo_d01_a']) {
      expect(mapRelease(code), code).toBeNull();
    }
    expect(mapRelease('tow_d01_a')?.area).toBe('Clock Tower');
  });

  it('leaves open the maps nothing marks as closed', () => {
    // Umbala (um_) was the other ambiguous edge case flagged the same day --
    // owner confirmed it *is* open, so it must never end up in this list.
    for (const code of ['pay_fild02', 'prt_fild08', 'gef_fild04', 'orc_d01_a', 'nrd_fild01', 'um_fild01', 'cmd_fild02']) {
      expect(mapRelease(code), code).toBeNull();
    }
  });
});

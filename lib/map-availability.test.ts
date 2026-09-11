import { describe, expect, it } from 'vitest';
import { mapRelease } from './map-availability';

describe('mapRelease', () => {
  it('closes the areas the publisher roadmap has not opened yet', () => {
    // Named by the roadmap but not bannered by rozerodb: without the roadmap
    // rows these sat in the farm rankings as if a player could walk in.
    expect(mapRelease('prt_maze01')).toMatchObject({ when: 'OCT 2026', area: 'Prontera Labyrinth' });
    expect(mapRelease('in_sphinx1')?.area).toBe('Sphinx');
    expect(mapRelease('mjo_dun01')?.area).toBe('Mjolnir Dead Pit');
    expect(mapRelease('anthell01')?.when).toBe('NOV 2026');
    expect(mapRelease('tur_d01_a')?.area).toBe('Turtle Island');
    expect(mapRelease('tre_d01_a')?.area).toBe('Sunken Ship');
  });

  it('closes the Zero copies rozerodb files under another name', () => {
    // tow_d is rozerodb's "Clock Tower F1", xma_d its "Toy Factory".
    expect(mapRelease('tow_d01_a')?.area).toBe('Clock Tower');
    expect(mapRelease('xma_d01_a')?.area).toBe('Lutie');
  });

  it('keeps rozerodb-only closures and prefers the roadmap month on a disagreement', () => {
    // Pyramid appears only as a rozerodb banner.
    expect(mapRelease('moc_pryd01')).toMatchObject({ when: 'OCT 2026', sources: ['rozerodb'] });
    // Glast Heim: roadmap DEC 2026, rozerodb JAN 2027.
    expect(mapRelease('gl_knt01')).toMatchObject({ when: 'DEC 2026', sources: ['roadmap', 'rozerodb'] });
  });

  it('leaves open the maps nothing marks as closed', () => {
    for (const code of ['pay_fild02', 'prt_fild08', 'gef_fild04', 'iz_dun02', 'orc_d01_a', 'nrd_fild01', 'um_fild01', 'cmd_fild02']) {
      expect(mapRelease(code), code).toBeNull();
    }
  });
});

import { describe, it, expect } from 'vitest';
import { mapImage, mirroredMapCodes } from './map-image';

describe('mapImage', () => {
  it('returns a path for a map that was mirrored', () => {
    const codes = mirroredMapCodes();
    expect(codes.length).toBeGreaterThan(0);
    const hit = mapImage(codes[0]);
    expect(hit).not.toBeNull();
    expect(hit!.src).toMatch(/^\/images\/maps\//);
  });

  it('prefers the full prontera render over the minimap when both exist', () => {
    // prt_fild08 has both: the minimap mirrored from ratemyserver and the
    // render mirrored from prontera.info.
    const hit = mapImage('prt_fild08');
    expect(hit?.kind).toBe('full');
    expect(hit?.src).toBe('/images/maps/full/prt_fild08.webp');
  });

  it('falls back to the minimap for a map prontera does not have', () => {
    // Gonryun Dungeon 1F: ratemyserver has gon_dun01, prontera has nothing.
    const hit = mapImage('gon_d01_a');
    expect(hit?.kind).toBe('mini');
    expect(hit?.src).toBe('/images/maps/gon_d01_a.gif');
  });

  it('returns null for a map with no picture, so callers cannot render a broken image', () => {
    expect(mapImage('no_such_map_code')).toBeNull();
  });

  it('reports the classic code when the picture is filed under one', () => {
    // an_d01_a is Ant Hell F1, whose picture exists only as anthell01.
    const hit = mapImage('an_d01_a');
    if (hit) expect(hit.fromCode).not.toBe('an_d01_a');
  });
});

import { describe, it, expect } from 'vitest';
import { mapImage, mirroredMapCodes } from './map-image';

describe('mapImage', () => {
  it('returns a path for a map that was mirrored', () => {
    const codes = mirroredMapCodes();
    expect(codes.length).toBeGreaterThan(0);
    const hit = mapImage(codes[0]);
    expect(hit?.src).toBe(`/images/maps/${codes[0]}.gif`);
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

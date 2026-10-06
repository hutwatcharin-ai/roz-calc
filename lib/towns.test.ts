import { describe, expect, it } from 'vitest';
import { townByCode, townPlaces, TOWNS } from './towns';
import { mapWarps } from './map-warps';
import { mapRelease } from './map-availability';

describe('towns', () => {
  it('gives every town a minimap with warps out', () => {
    for (const town of TOWNS) {
      const warps = mapWarps(town.code);
      expect(warps, town.code).not.toBeNull();
      expect(warps!.exits.length + warps!.doors.length, town.code).toBeGreaterThan(0);
    }
  });
  it('lists only towns that are open', () => {
    for (const town of TOWNS) expect(mapRelease(town.code), town.code).toBeNull();
  });
  it('finds the NPCs inside the buildings, not only on the street', () => {
    const places = townPlaces('geffen');
    expect(places[0].code).toBe('geffen');
    expect(places.some((p) => p.code === 'geffen_in')).toBe(true);
  });
  it('knows a town by its code and nothing else', () => {
    expect(townByCode('geffen')?.nameTh).toBe('เกฟเฟน');
    expect(townByCode('gef_fild10')).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { PASSAGES, townByCode, townPlaces, TOWNS } from './towns';
import { mapWarps } from './map-warps';
import { mapRelease } from './map-availability';

describe('towns', () => {
  it('gives every town and passage its warps out', () => {
    for (const town of [...TOWNS, ...PASSAGES]) {
      const warps = mapWarps(town.code);
      expect(warps, town.code).not.toBeNull();
      expect(warps!.exits.length + warps!.doors.length, town.code).toBeGreaterThan(0);
    }
  });
  it('lists only places that are open', () => {
    for (const town of [...TOWNS, ...PASSAGES]) expect(mapRelease(town.code), town.code).toBeNull();
  });
  it('finds the NPCs inside the buildings, not only on the street', () => {
    const places = townPlaces('geffen');
    expect(places[0].code).toBe('geffen');
    expect(places.some((p) => p.code === 'geffen_in')).toBe(true);
  });
  it('keeps the sprite labels of Nordfeld off its town page', () => {
    const names = townPlaces('nordfeld').flatMap((p) => p.npcs.map((n) => n.name));
    expect(names.some((n) => n.startsWith('Roz '))).toBe(false);
  });
  it('names the NPC in Alberta who takes you to Nordfeld', () => {
    const alberta = townPlaces('alberta')[0].npcs;
    expect(alberta.find((n) => n.name === 'Nordfeld Ambassador')).toMatchObject({ slug: 'nordfeld-ambassador', x: 232, y: 118 });
  });
  it('knows a town by its code and nothing else', () => {
    expect(townByCode('geffen')?.nameTh).toBe('เกฟเฟน');
    expect(townByCode('gef_fild10')).toBeNull();
  });
});

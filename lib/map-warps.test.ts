import { describe, expect, it } from 'vitest';
import { DOOR_MIN, mapWarps, warpMapName, warpPosition } from './map-warps';

describe('warpPosition', () => {
  it('centres a tall map: Prontera (312x392) leaves 52 px each side of 512', () => {
    // The client minimap's own content box measured 52..463 px wide.
    expect(warpPosition(-0.5, 391.5, 312, 392).left).toBeCloseTo((52.25 / 512) * 100, 1);
    expect(warpPosition(311.5, -0.5, 312, 392).left).toBeCloseTo((459.75 / 512) * 100, 1);
  });
  it('counts rows from the bottom', () => {
    expect(warpPosition(100, 0, 200, 200).top).toBeGreaterThan(99);
    expect(warpPosition(100, 199, 200, 200).top).toBeLessThan(1);
  });
});

describe('mapWarps', () => {
  it('lists Prontera among the exits of the field next to it', () => {
    const field = mapWarps('prt_fild05');
    expect(field?.exits.some((e) => e.to === 'prontera')).toBe(true);
  });
  it('lists doors only when one destination has many cells', () => {
    for (const code of ['gef_fild10', 'pay_dun00', 'prt_maze01']) {
      const w = mapWarps(code);
      expect(w).not.toBeNull();
      for (const d of w!.doors) expect(d.pts.length).toBeGreaterThanOrEqual(DOOR_MIN);
      for (const e of w!.exits) expect(e.pts.length).toBeLessThan(DOOR_MIN);
    }
  });
  it("names a map by the game's own table", () => {
    expect(warpMapName('pay_arche')).toBe('Payon Archer Village');
  });
});

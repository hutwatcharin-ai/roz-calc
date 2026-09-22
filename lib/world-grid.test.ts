import { describe, expect, it } from 'vitest';
import { layoutGrid } from './world-grid';

const input = {
  tiles: [
    { code: 'f_west', x: 100, y: 100 },
    { code: 'f_east', x: 217, y: 100 }, // two steps east: a gap for the town
    { code: 'f_south', x: 158.5, y: 158 },
  ],
  towns: [{ code: 'town', fields: ['f_west', 'f_east', 'f_south'] }],
  dungeons: [
    { key: 'd1', entranceMap: 'lobby', fallbackTile: 'f_west', floors: ['d1', 'd2', 'd3'], via: ['town', 'lobby'] },
  ],
};

describe('layoutGrid', () => {
  const { cells } = layoutGrid(input);
  const at = (code: string) => cells.find((c) => c.code === code)!;

  it('snaps atlas tiles to their grid', () => {
    expect(at('f_east').col - at('f_west').col).toBe(2);
    expect(at('f_south').row - at('f_west').row).toBe(1);
  });

  it('puts a town in the gap between its fields', () => {
    expect([at('town').col, at('town').row]).toEqual([at('f_west').col + 1, at('f_west').row]);
  });

  it('gives every map its own cell', () => {
    const keys = cells.map((c) => `${c.col},${c.row}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('lays every floor of a dungeon out, next to one another', () => {
    const floors = cells.filter((c) => c.dungeon === 'd1' && c.kind === 'floor');
    expect(floors.map((c) => c.code)).toEqual(['d1', 'd2', 'd3']);
    for (let i = 1; i < floors.length; i++) {
      const gap = Math.abs(floors[i].col - floors[i - 1].col) + Math.abs(floors[i].row - floors[i - 1].row);
      expect(gap).toBeLessThanOrEqual(2);
    }
  });

  it('puts the passage map on the way in, and draws one path through it', () => {
    const { cells: all, lines } = layoutGrid(input);
    expect(all.find((c) => c.code === 'lobby')?.kind).toBe('passage');
    const line = lines.find((l) => l.dungeon === 'd1')!;
    expect(line.anchor).toBe('town');
    const codes = line.points.map((p) => all.find((c) => c.col === p.col && c.row === p.row)?.code);
    expect(codes).toEqual(['town', 'lobby', 'd1']);
  });
});

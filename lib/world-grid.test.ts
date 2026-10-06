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

  it('puts a passage against the map it opens off, on the side its door is on', () => {
    for (const side of [[1, 0], [0, 1], [-1, 0]] as [number, number][]) {
      const { cells: all } = layoutGrid({ ...input, exitSide: (from, to) => (from === 'town' && to === 'lobby' ? side : null) });
      const town = all.find((c) => c.code === 'town')!;
      const lobby = all.find((c) => c.code === 'lobby')!;
      expect(Math.max(Math.abs(lobby.col - town.col), Math.abs(lobby.row - town.row))).toBe(1);
      if (side[0]) expect(Math.sign(lobby.col - town.col)).toBe(side[0]);
      if (side[1]) expect(Math.sign(lobby.row - town.row)).toBe(side[1]);
    }
  });

  it('boxes a region with maps of its own in a row off the grid, joined by a line that crosses no map', () => {
    const { cells: all, lines, frames } = layoutGrid({ ...input, outposts: [{ code: 'far', from: 'f_south', chain: ['far_f1', 'far_d1'] }] });
    const row = ['far', 'far_f1', 'far_d1'].map((code) => all.find((c) => c.code === code)!);
    expect(new Set(row.map((c) => c.row)).size).toBe(1);
    expect(row[1].col - row[0].col).toBe(1);
    const others = all.filter((c) => !['far', 'far_f1', 'far_d1'].includes(c.code));
    expect(row[0].col).toBeGreaterThan(Math.max(...others.map((c) => c.col)) + 1);
    expect(frames).toEqual([{ code: 'far', col: row[0].col, row: row[0].row, cols: 3, rows: 1 }]);
    const line = lines.find((l) => l.dungeon === 'far')!;
    expect(line.always).toBe(true);
    // Every cell the line runs through, between its ends, is empty.
    const busy = new Set(all.map((c) => `${c.col},${c.row}`));
    for (let i = 1; i < line.points.length; i++) {
      const [a, b] = [line.points[i - 1], line.points[i]];
      for (let c = Math.min(a.col, b.col); c <= Math.max(a.col, b.col); c++) {
        for (let r = Math.min(a.row, b.row); r <= Math.max(a.row, b.row); r++) {
          const end = (c === line.points[0].col && r === line.points[0].row) || (c === row[0].col && r === row[0].row);
          if (!end) expect(busy.has(`${c},${r}`)).toBe(false);
        }
      }
    }
  });

  it('puts a town reached by warp NPC near the town it is reached from, with a path', () => {
    const { cells: all, lines } = layoutGrid({ ...input, outposts: [{ code: 'far', from: 'town' }] });
    const far = all.find((c) => c.code === 'far')!;
    const town = all.find((c) => c.code === 'town')!;
    expect(far.kind).toBe('town');
    expect(Math.max(Math.abs(far.col - town.col), Math.abs(far.row - town.row))).toBeLessThanOrEqual(3);
    const line = lines.find((l) => l.dungeon === 'far')!;
    expect(line.anchor).toBe('town');
    expect(line.points).toEqual([{ col: town.col, row: town.row }, { col: far.col, row: far.row }]);
  });
});

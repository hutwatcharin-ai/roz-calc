// The "map grid" view of the world map: every map drawn as its own picture on
// a plain grid, the way ratemyserver's world map does it (owner's pick,
// 22 Sep 2026). Towns get a cell of their own, and each dungeon's floors sit
// as a cluster of pictures in free cells near the way in, with a line back to
// it -- visible at a glance, never laid over another map.
//
// Pure layout, no database: tiles come from the atlas layout (already on a
// ~58 px grid), towns and dungeons from the warp table.

export interface GridCell {
  code: string;
  /** 'passage': a map walked through on the way in (a dock, a tower lobby). */
  kind: 'field' | 'town' | 'floor' | 'passage';
  col: number;
  row: number;
  /** For a floor: the dungeon it belongs to (its first floor's code). */
  dungeon?: string;
}

/** The way into one dungeon: from the map it opens off, through any passage
 *  maps, to its first floor. Drawn only while that dungeon is in focus. */
export interface GridLine {
  dungeon: string;
  anchor: string;
  points: { col: number; row: number }[];
}

export interface GridInput {
  /** Atlas field tiles with their atlas pixel centres. */
  tiles: { code: string; x: number; y: number }[];
  /** Towns and the field tiles they open onto by walking. */
  towns: { code: string; fields: string[] }[];
  /** Each dungeon once: where its way in is, and its floors in order. */
  dungeons: { key: string; entranceMap: string; fallbackTile: string; floors: string[]; via?: string[] }[];
}

const STEP_X = 58.5;
const STEP_Y = 58;
const key = (col: number, row: number) => `${col},${row}`;

export function layoutGrid(input: GridInput): { cells: GridCell[]; lines: GridLine[]; cols: number; rows: number } {
  // Codes already on the grid are never placed twice; a later dungeon that
  // passes the same dock reuses its cell.
  const taken = new Map<string, GridCell>();
  const place = (cell: GridCell) => taken.set(key(cell.col, cell.row), cell);
  const free = (col: number, row: number) => !taken.has(key(col, row));
  const where = new Map<string, { col: number; row: number }>();

  // Nearest free cell to (col,row), searched ring by ring; ties go to the
  // cell that keeps the cluster tight (smaller summed distance to `near`).
  // How many fields and towns touch a cell. Dungeon floors are steered away
  // from those, so clusters form at the edge of the world rather than in its
  // gaps -- a floor between two fields reads as if it were one.
  function crowding(col: number, row: number) {
    let n = 0;
    for (let dc = -1; dc <= 1; dc++) {
      for (let dr = -1; dr <= 1; dr++) {
        const c = taken.get(key(col + dc, row + dr));
        if (c && c.kind !== 'floor') n += 1;
      }
    }
    return n;
  }

  function nearestFree(col: number, row: number, near: { col: number; row: number }[] = [], avoidCrowd = false) {
    for (let r = 0; r < 40; r++) {
      const ring: [number, number][] = [];
      for (let dc = -r; dc <= r; dc++) {
        for (let dr = -r; dr <= r; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== r) continue;
          if (free(col + dc, row + dr)) ring.push([col + dc, row + dr]);
        }
      }
      // A crowded ring is passed over while a quieter one is still near.
      const usable = avoidCrowd && r < 6 ? ring.filter(([c, rr]) => crowding(c, rr) <= 1) : ring;
      if (usable.length) {
        const score = ([c, rr]: [number, number]) =>
          Math.abs(c - col) + Math.abs(rr - row) + near.reduce((s, n) => s + Math.abs(c - n.col) + Math.abs(rr - n.row), 0) / 4
          + (avoidCrowd ? crowding(c, rr) * 1.5 : 0);
        usable.sort((a, b) => score(a) - score(b) || a[1] - b[1] || a[0] - b[0]);
        return { col: usable[0][0], row: usable[0][1] };
      }
    }
    return { col, row };
  }

  // Fields: snap the atlas positions to the grid they were drawn on.
  const minX = Math.min(...input.tiles.map((t) => t.x));
  const minY = Math.min(...input.tiles.map((t) => t.y));
  for (const tile of [...input.tiles].sort((a, b) => a.y - b.y || a.x - b.x)) {
    const col = Math.round((tile.x - minX) / STEP_X);
    const row = Math.round((tile.y - minY) / STEP_Y);
    const spot = free(col, row) ? { col, row } : nearestFree(col, row);
    place({ code: tile.code, kind: 'field', ...spot });
    where.set(tile.code, spot);
  }

  // Towns: the free cell touching their fields that sits closest to all of them.
  for (const town of input.towns) {
    const around = town.fields.map((f) => where.get(f)).filter(Boolean) as { col: number; row: number }[];
    if (!around.length) continue;
    const candidates: { col: number; row: number }[] = [];
    for (const a of around) {
      for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
        if (free(a.col + dc, a.row + dr)) candidates.push({ col: a.col + dc, row: a.row + dr });
      }
    }
    const cost = (c: { col: number; row: number }) => around.reduce((s, a) => s + Math.abs(c.col - a.col) + Math.abs(c.row - a.row), 0);
    const spot = candidates.sort((a, b) => cost(a) - cost(b) || a.row - b.row || a.col - b.col)[0]
      ?? nearestFree(around[0].col, around[0].row, around);
    place({ code: town.code, kind: 'town', ...spot });
    where.set(town.code, spot);
  }

  // Dungeons: the passage maps first (a dock, a lobby), then the floors,
  // chained through free cells steered away from the fields. Each dungeon
  // keeps its whole way in as one path, anchor to first floor.
  const lines: GridLine[] = [];
  for (const dungeon of input.dungeons) {
    const anchorCode = where.has(dungeon.entranceMap) ? dungeon.entranceMap
      : dungeon.via?.find((code) => where.has(code) && taken.get(key(where.get(code)!.col, where.get(code)!.row))?.kind === 'town')
        ?? dungeon.fallbackTile;
    const anchor = where.get(anchorCode);
    if (!anchor) continue;
    const via = dungeon.via ?? [];
    const passages = via.slice(via.indexOf(anchorCode) + 1);
    const points = [anchor];
    let prev = anchor;
    const cluster: { col: number; row: number }[] = [];
    for (const code of passages) {
      const spot = where.get(code) ?? nearestFree(prev.col, prev.row, [anchor, ...cluster], true);
      if (!where.has(code)) {
        place({ code, kind: 'passage', dungeon: dungeon.key, ...spot });
        where.set(code, spot);
      }
      points.push(spot);
      cluster.push(spot);
      prev = spot;
    }
    dungeon.floors.forEach((floor, i) => {
      const spot = nearestFree(prev.col, prev.row, [anchor, ...cluster], true);
      place({ code: floor, kind: 'floor', dungeon: dungeon.key, ...spot });
      where.set(floor, spot);
      cluster.push(spot);
      if (i === 0) points.push(spot);
      prev = spot;
    });
    lines.push({ dungeon: dungeon.key, anchor: anchorCode, points });
  }

  // Shift everything so the grid starts at 0,0.
  const cells = [...taken.values()];
  const c0 = Math.min(...cells.map((c) => c.col));
  const r0 = Math.min(...cells.map((c) => c.row));
  for (const c of cells) { c.col -= c0; c.row -= r0; }
  for (const l of lines) l.points = l.points.map((p) => ({ col: p.col - c0, row: p.row - r0 }));
  return {
    cells,
    lines,
    cols: Math.max(...cells.map((c) => c.col)) + 1,
    rows: Math.max(...cells.map((c) => c.row)) + 1,
  };
}

// Reads an in-game screenshot of the NPC sell window (owner, 5 Oct 2026:
// "read it on the site itself, no analysis API"). Pure pixel work, no OCR and
// no outside service:
//
//   1. find the window by its title text (SELL_TITLE, exact bitmap)
//   2. each row sits 32 px below the last; read the price text at the right
//      against the digit bitmaps (SELL_GLYPHS) -- the game font is crisp, so
//      a glyph is either an exact digit or it is not one
//   3. name the row by its 24x24 icon against every item icon (the atlas),
//      top half only: the stack count is drawn over the bottom half
//
// The left number is the plain NPC price; "125 -> 155" shows a Merchant's
// Overcharge on the right, which is not the item's price. Positions were
// measured on a 1024x768 client (5 Oct 2026 screenshots).

import { SELL_GLYPHS, SELL_TITLE } from './sell-glyphs';

export interface Pixels {
  width: number;
  height: number;
  /** RGBA, row-major, as canvas getImageData returns it. */
  data: Uint8ClampedArray;
}

export interface IconAtlas {
  cell: number;
  cols: number;
  ids: number[];
  /** RGBA of the atlas image. */
  pixels: Pixels;
}

export interface SellRow {
  index: number;
  /** What the price glyphs read as, e.g. "125->155Z"; null when a glyph was unknown. */
  text: string | null;
  /** The plain NPC price (left of the arrow). */
  price: number | null;
  /** Items whose icon matches, best first; ties (same picture) by lowest id. */
  candidates: number[];
  /** Mean colour difference of the best icon, 0 = identical. */
  iconScore: number;
  /** Top-left of the row's icon in the screenshot, for a crop preview. */
  iconAt: { x: number; y: number };
}

const DARK = 110;
const ROW_PITCH = 32;
const TEXT_DY = 23;
const PRICE_X0 = 120;
const PRICE_X1 = 236;
const ICON_DX = 14;
const ICON_DY = -8;
const BG_DX = 90;
const ICON_ROWS = 12;
const TIE = 0.6;
const MAX_ROWS = 14;

const parseBitmap = (code: string) => code.split('.').map((row) => [...row].map((c) => c === '1'));
const TITLE = parseBitmap(SELL_TITLE);
const GLYPHS = Object.entries(SELL_GLYPHS).map(([char, code]) => ({ char, code }));

function gray(p: Pixels): Uint8Array {
  const g = new Uint8Array(p.width * p.height);
  for (let i = 0, j = 0; i < g.length; i++, j += 4) g[i] = (p.data[j] * 299 + p.data[j + 1] * 587 + p.data[j + 2] * 114) / 1000;
  return g;
}

/** Where the window title is, by exact bitmap with a little JPEG slack. */
export function findAnchor(p: Pixels, g = gray(p)): { x: number; y: number } | null {
  const th = TITLE.length;
  const tw = TITLE[0].length;
  const darkCells: [number, number][] = [];
  const lightCells: [number, number][] = [];
  TITLE.forEach((row, y) => row.forEach((on, x) => (on ? darkCells : lightCells).push([x, y])));
  const total = darkCells.length + lightCells.length;
  let best: { x: number; y: number; miss: number } | null = null;
  for (let y = 0; y + th <= p.height; y++) {
    for (let x = 0; x + tw <= p.width; x++) {
      // Cheap reject on the first few dark pixels before the full count.
      let miss = 0;
      for (let i = 0; i < 6 && miss === 0; i++) {
        const [dx, dy] = darkCells[i];
        if (g[(y + dy) * p.width + x + dx] >= DARK) miss++;
      }
      if (miss) continue;
      for (const [dx, dy] of darkCells) if (g[(y + dy) * p.width + x + dx] >= DARK) miss++;
      for (const [dx, dy] of lightCells) if (g[(y + dy) * p.width + x + dx] < DARK) miss++;
      if (miss / total < 0.03 && (!best || miss < best.miss)) best = { x, y, miss };
    }
  }
  return best && { x: best.x, y: best.y };
}

/** The price glyphs of one row, read right to left until a wide gap. */
export function readPrice(p: Pixels, g: Uint8Array, x0: number, x1: number, y: number): string | null {
  const w = x1 - x0;
  const dark = (x: number, r: number) => g[(y + r) * p.width + x0 + x] < DARK;
  const colOn = Array.from({ length: w }, (_, x) => Array.from({ length: 9 }, (_, r) => dark(x, r)).some(Boolean));
  const runs: [number, number][] = [];
  for (let x = 0; x < w; ) {
    if (!colOn[x]) {
      x++;
      continue;
    }
    const s = x;
    while (x < w && colOn[x]) x++;
    runs.push([s, x]);
  }
  const kept: [number, number][] = [];
  for (let i = runs.length - 1; i >= 0; i--) {
    if (kept.length && kept[kept.length - 1][0] - runs[i][1] >= 8) break;
    kept.push(runs[i]);
  }
  if (!kept.length) return null;
  kept.reverse();
  let text = '';
  for (const [s, e] of kept) {
    const code = Array.from({ length: 9 }, (_, r) => Array.from({ length: e - s }, (_, i) => (dark(s + i, r) ? '1' : '0')).join('')).join('.');
    const hit = GLYPHS.find((gl) => gl.code === code);
    if (!hit) return null;
    text += hit.char;
  }
  return text;
}

/** "125->155Z" -> 125, "0Z" -> 0. */
export function plainPrice(text: string | null): number | null {
  const m = text && /^(\d+)(?:->\d+)?Z$/.exec(text);
  return m ? Number(m[1]) : null;
}

/** Icon candidates for the icon whose top-left is (ix, iy). */
export function matchIcon(p: Pixels, atlas: IconAtlas, ix: number, iy: number, bgAt: { x: number; y: number }, live?: Set<number>): { candidates: number[]; score: number } {
  const { cell, cols, ids, pixels: a } = atlas;
  const bgI = (bgAt.y * p.width + bgAt.x) * 4;
  const bg = [p.data[bgI], p.data[bgI + 1], p.data[bgI + 2]];
  const scores = new Float32Array(ids.length);
  for (let n = 0; n < ids.length; n++) {
    const ax = (n % cols) * cell;
    const ay = Math.floor(n / cols) * cell;
    let sum = 0;
    for (let y = 0; y < ICON_ROWS; y++) {
      for (let x = 0; x < cell; x++) {
        const ai = ((ay + y) * a.width + ax + x) * 4;
        const al = a.data[ai + 3] / 255;
        const si = ((iy + y) * p.width + ix + x) * 4;
        for (let c = 0; c < 3; c++) sum += Math.abs(a.data[ai + c] * al + bg[c] * (1 - al) - p.data[si + c]);
      }
    }
    scores[n] = sum / (ICON_ROWS * cell * 3);
  }
  let best = Infinity;
  for (let n = 0; n < ids.length; n++) if (scores[n] < best && (!live || live.has(ids[n]))) best = scores[n];
  const candidates = ids
    .map((id, n) => ({ id, s: scores[n] }))
    .filter((c) => c.s <= best + TIE && (!live || live.has(c.id)))
    .sort((x, y) => x.id - y.id)
    .map((c) => c.id);
  return { candidates, score: best };
}

/** Reads every visible row of the sell window. Null when no window is found. */
export function readSellWindow(p: Pixels, atlas: IconAtlas, live?: Set<number>): { anchor: { x: number; y: number }; rows: SellRow[] } | null {
  const g = gray(p);
  const anchor = findAnchor(p, g);
  if (!anchor) return null;
  const rows: SellRow[] = [];
  for (let k = 0; k < MAX_ROWS; k++) {
    const ty = anchor.y + TEXT_DY + ROW_PITCH * k;
    if (ty + 9 >= p.height) break;
    const text = readPrice(p, g, anchor.x + PRICE_X0, anchor.x + PRICE_X1, ty);
    // Past the last row there is no " Z" at the end of the line.
    if (text === null && rows.length > 0 && !hasInk(p, g, anchor.x + PRICE_X0, anchor.x + PRICE_X1, ty)) break;
    const iconAt = { x: anchor.x + ICON_DX, y: ty + ICON_DY };
    const { candidates, score } = matchIcon(p, atlas, iconAt.x, iconAt.y, { x: anchor.x + BG_DX, y: ty + ICON_DY }, live);
    rows.push({ index: k, text, price: plainPrice(text), candidates, iconScore: score, iconAt });
    if (text !== null && !text.endsWith('Z')) break;
  }
  // Trailing rows with neither a price nor a believable icon are past the list.
  while (rows.length && rows[rows.length - 1].price === null && rows[rows.length - 1].iconScore > 12) rows.pop();
  return { anchor, rows };
}

function hasInk(p: Pixels, g: Uint8Array, x0: number, x1: number, y: number): boolean {
  for (let r = 0; r < 9; r++) for (let x = x0; x < x1; x++) if (g[(y + r) * p.width + x] < DARK) return true;
  return false;
}

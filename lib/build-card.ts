// The picture a shared build shows in a Facebook post or a LINE chat
// (owner, 7 Oct 2026): the class, stats, the status window's main numbers and
// the gear, as one 1200x630 PNG.
//
// Drawn as SVG by hand and rasterised with resvg (WebAssembly), not with
// next/og: the per-monster card on 2 Sep 2026 crashed the production
// container inside @vercel/og (502, reverted in 09b36e98), and Satori cannot
// read the game's GIF icons. resvg also shapes Thai properly (vowels and tone
// marks stacked), which Satori's text-to-path does not. GIF icons are decoded
// here and drawn as pixel rectangles, which keeps them crisp when enlarged.
//
// Server only: reads fonts, icons and the wasm from disk.

import fs from 'fs';
import path from 'path';
import { GifReader } from 'omggif';
import { initWasm, Resvg } from '@resvg/resvg-wasm';
import { SLOTS, calcBuild, gearById, type Build, type Slot } from '@/lib/build-calc';
import { STATS, classStats } from '@/lib/class-stats';

const ROOT = process.cwd();
const W = 1200;
const H = 630;

let ready: Promise<void> | null = null;
let fonts: Uint8Array[] = [];

function init(): Promise<void> {
  if (!ready) {
    ready = initWasm(fs.readFileSync(path.join(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm'))).then(() => {
      fonts = ['Sarabun-Regular.ttf', 'Sarabun-Bold.ttf'].map((f) => fs.readFileSync(path.join(ROOT, 'assets/fonts', f)));
    });
  }
  return ready;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** A public image as SVG: GIF pixels as rectangles, PNG embedded. Empty when missing. */
function picture(publicPath: string | null | undefined, x: number, y: number, size: number): string {
  if (!publicPath || publicPath.includes('..')) return '';
  const file = path.join(ROOT, 'public', publicPath);
  if (!fs.existsSync(file)) return '';
  const buf = fs.readFileSync(file);
  if (publicPath.endsWith('.png')) {
    return `<image x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet" style="image-rendering:optimizeSpeed" href="data:image/png;base64,${buf.toString('base64')}"/>`;
  }
  if (!publicPath.endsWith('.gif')) return '';
  try {
    const gif = new GifReader(new Uint8Array(buf));
    const w = gif.width;
    const h = gif.height;
    const px = new Uint8Array(w * h * 4);
    gif.decodeAndBlitFrameRGBA(0, px);
    const scale = size / Math.max(w, h);
    const ox = x + (size - w * scale) / 2;
    const oy = y + (size - h * scale) / 2;
    const out: string[] = [];
    for (let row = 0; row < h; row++) {
      let col = 0;
      while (col < w) {
        const i = (row * w + col) * 4;
        const r = px[i];
        const g = px[i + 1];
        const b = px[i + 2];
        // Transparent, or the magenta the game uses as transparency.
        if (px[i + 3] < 128 || (r > 250 && g < 5 && b > 250)) {
          col++;
          continue;
        }
        let run = 1;
        while (col + run < w) {
          const j = (row * w + col + run) * 4;
          if (px[j] !== r || px[j + 1] !== g || px[j + 2] !== b || px[j + 3] < 128) break;
          run++;
        }
        out.push(`<rect x="${(ox + col * scale).toFixed(2)}" y="${(oy + row * scale).toFixed(2)}" width="${(run * scale + 0.3).toFixed(2)}" height="${(scale + 0.3).toFixed(2)}" fill="#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}"/>`);
        col += run;
      }
    }
    return `<g>${out.join('')}</g>`;
  } catch {
    return '';
  }
}

const C = { bg: '#0b0724', panel: '#120a2e', cyan: '#3DE8FF', pink: '#FF3D9A', yellow: '#FFE53D', text: '#F4F2FF', dim: '#B3A9E6', faint: '#8F86C4' };

function text(x: number, y: number, s: string, size: number, fill: string, opts: { bold?: boolean; anchor?: 'start' | 'end' | 'middle'; spacing?: number } = {}): string {
  return `<text x="${x}" y="${y}" font-family="Sarabun" font-size="${size}" font-weight="${opts.bold ? 700 : 400}" fill="${fill}"${opts.anchor ? ` text-anchor="${opts.anchor}"` : ''}${opts.spacing ? ` letter-spacing="${opts.spacing}"` : ''}>${esc(s)}</text>`;
}

// Short words for an empty slot box (54 px wide).
const EMPTY_LABEL: Record<Slot, string> = {
  weapon: 'อาวุธ', shield: 'มือซ้าย', head_upper: 'หัวบน', head_middle: 'หัวกลาง', head_lower: 'หัวล่าง',
  armor: 'เสื้อ', garment: 'คลุม', footgear: 'รองเท้า', accessory_1: 'ประดับ', accessory_2: 'ประดับ',
};

function clip(s: string, n: number): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/** The card as SVG text. */
export function buildCardSvg(build: Build, id: string): string {
  const r = calcBuild(build);
  const cls = classStats(build.cls);
  const parts: string[] = [];

  parts.push(`<defs>
    <radialGradient id="glowP" cx="0.9" cy="1.1" r="0.7"><stop offset="0" stop-color="${C.pink}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.pink}" stop-opacity="0"/></radialGradient>
    <radialGradient id="glowC" cx="0" cy="0" r="0.6"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0.22"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
    <radialGradient id="stage" cx="0.5" cy="0.8" r="0.6"><stop offset="0" stop-color="${C.cyan}" stop-opacity="0.35"/><stop offset="1" stop-color="${C.cyan}" stop-opacity="0"/></radialGradient>
    <pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#000" fill-opacity="0.22"/></pattern>
  </defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="${C.bg}"/><rect width="${W}" height="${H}" fill="url(#glowP)"/><rect width="${W}" height="${H}" fill="url(#glowC)"/>`);
  parts.push(`<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="22" fill="none" stroke="${C.pink}" stroke-width="4" transform="translate(6 6)"/>`);
  parts.push(`<rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="22" fill="none" stroke="${C.cyan}" stroke-width="4"/>`);

  // Left: who.
  parts.push(text(60, 82, '▶ BUILD SIMULATOR', 20, C.pink, { bold: true, spacing: 5 }));
  parts.push(text(60, 138, clip(cls?.name ?? build.cls, 14).toUpperCase(), 50, C.yellow, { bold: true, spacing: 2 }));
  parts.push(text(60, 176, `Base Lv ${build.lv} · Job Lv ${build.job}`, 24, C.dim));
  parts.push(`<rect x="60" y="196" width="300" height="296" rx="16" fill="${C.panel}" stroke="${C.cyan}" stroke-width="3"/><rect x="60" y="196" width="300" height="296" rx="16" fill="url(#stage)"/>`);
  parts.push(picture(`/images/jobs/${build.cls}.png`, 85, 214, 250));

  // Middle: stats with gauges.
  parts.push(text(410, 82, 'STATS', 20, C.cyan, { bold: true, spacing: 5 }));
  STATS.forEach((s, i) => {
    const y = 124 + i * 62;
    const own = build.st[s];
    const bonus = r.total[s] - own;
    parts.push(text(410, y + 10, s.toUpperCase(), 28, C.cyan, { bold: true }));
    parts.push(`<rect x="490" y="${y - 6}" width="200" height="14" rx="7" fill="#ffffff" fill-opacity="0.08"/>`);
    parts.push(`<rect x="490" y="${y - 6}" width="${Math.min(200, (own / 130) * 200).toFixed(1)}" height="14" rx="7" fill="${C.cyan}"/>`);
    if (bonus > 0) parts.push(`<rect x="${(490 + Math.min(200, (own / 130) * 200)).toFixed(1)}" y="${y - 6}" width="${Math.min(200 - Math.min(200, (own / 130) * 200), (bonus / 130) * 200).toFixed(1)}" height="14" rx="7" fill="${C.pink}"/>`);
    parts.push(text(750, y + 12, String(r.total[s]), 34, C.yellow, { bold: true, anchor: 'end' }));
  });

  // Right: the status window's headline numbers.
  parts.push(text(790, 82, 'STATUS', 20, C.pink, { bold: true, spacing: 5 }));
  const tiles: [string, string][] = [
    ['HIT', String(r.hit)], ['FLEE', String(r.flee)],
    ['ATK', `${r.atk.status} + ${r.atk.equip}`], ['MATK', `${r.matk.status} + ${r.matk.equip}`],
    ['ASPD', r.aspd === null ? '—' : String(r.aspd)], ['CRI', String(r.crit)],
    ['HP', r.hp === null ? '—' : r.hp.toLocaleString('en-US')], ['SP', r.sp === null ? '—' : r.sp.toLocaleString('en-US')],
  ];
  tiles.forEach(([label, value], i) => {
    const x = 790 + (i % 2) * 190;
    const y = 100 + Math.floor(i / 2) * 98;
    const big = i < 2;
    parts.push(`<rect x="${x}" y="${y}" width="178" height="86" rx="12" fill="${C.panel}" stroke="${big ? C.yellow : C.cyan}" stroke-opacity="${big ? 0.8 : 0.35}" stroke-width="2"/>`);
    parts.push(text(x + 14, y + 28, label, 18, C.faint, { bold: true, spacing: 2 }));
    parts.push(text(x + 14, y + 70, value, value.length > 9 ? 26 : 34, C.yellow, { bold: true }));
  });

  // Bottom: the ten slots.
  parts.push(`<line x1="60" y1="512" x2="${W - 60}" y2="512" stroke="${C.cyan}" stroke-opacity="0.25" stroke-width="2"/>`);
  SLOTS.forEach((slot, i) => {
    const x = 60 + i * 64;
    const y = 530;
    const w = build.g[slot];
    const item = w ? gearById(w.id) : null;
    parts.push(`<rect x="${x}" y="${y}" width="54" height="54" rx="10" fill="${C.panel}" stroke="${item ? C.cyan : C.faint}" stroke-opacity="${item ? 0.9 : 0.35}" stroke-width="2"${item ? '' : ' stroke-dasharray="4 4"'}/>`);
    if (item) {
      parts.push(picture(item.i, x + 7, y + 7, 40));
      if (w!.r > 0) {
        parts.push(`<rect x="${x + 26}" y="${y + 38}" width="34" height="22" rx="6" fill="${C.yellow}"/>`);
        parts.push(text(x + 43, y + 55, `+${w!.r}`, 16, '#241E00', { bold: true, anchor: 'middle' }));
      }
    } else {
      parts.push(text(x + 27, y + 33, EMPTY_LABEL[slot], 13, C.faint, { anchor: 'middle' }));
    }
  });
  parts.push(text(W - 60, 552, 'จำลองบิลด์ Ragnarok Zero', 22, C.dim, { bold: true, anchor: 'end' }));
  parts.push(text(W - 60, 584, `rozerothai.com/b/${id}`, 24, C.cyan, { bold: true, anchor: 'end' }));

  parts.push(`<rect width="${W}" height="${H}" fill="url(#scan)"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${parts.join('')}</svg>`;
}

/** The card as PNG bytes. */
export async function buildCardPng(build: Build, id: string): Promise<Uint8Array> {
  await init();
  const resvg = new Resvg(buildCardSvg(build, id), {
    font: { fontBuffers: fonts, defaultFontFamily: 'Sarabun', loadSystemFonts: false },
    fitTo: { mode: 'original' },
  });
  const png = resvg.render().asPng();
  resvg.free();
  return png;
}

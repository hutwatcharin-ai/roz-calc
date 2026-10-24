// Pure TypeScript compositor (no Node or DOM APIs) that reproduces
// scripts/ro_sprite.py draw_layers() / scripts/dressup/reference.py render().
import type { Atlas, FrameData, PartData, Placed } from './types';

const PRECISION_BITS = 7;

function actKey(part: PartData, action: number): string {
  // Python: act.actions[action] if it exists, else act.actions[0]
  return part.acts[String(action)] ? String(action) : '0';
}

function frames(part: PartData, action: number): FrameData[] {
  return part.acts[actKey(part, action)];
}

export function frameAt(part: PartData, action: number, ms: number): number {
  const list = frames(part, action);
  const delay = part.delay[actKey(part, action)] || 40;
  return Math.floor(ms / delay) % list.length;
}

type Img = { w: number; h: number; d: Uint8ClampedArray };

function mirrorH(i: Img): Img {
  const d = new Uint8ClampedArray(i.d.length);
  for (let y = 0; y < i.h; y++) {
    for (let x = 0; x < i.w; x++) {
      const s = (y * i.w + (i.w - 1 - x)) * 4;
      const t = (y * i.w + x) * 4;
      d[t] = i.d[s]; d[t + 1] = i.d[s + 1]; d[t + 2] = i.d[s + 2]; d[t + 3] = i.d[s + 3];
    }
  }
  return { w: i.w, h: i.h, d };
}

// PIL Image.resize(..., NEAREST): source = floor((x + 0.5) * scale)
function resizeNearest(i: Img, nw: number, nh: number): Img {
  const d = new Uint8ClampedArray(nw * nh * 4);
  const fx = i.w / nw;
  const fy = i.h / nh;
  for (let y = 0; y < nh; y++) {
    const sy = Math.min(i.h - 1, Math.floor((y + 0.5) * fy));
    for (let x = 0; x < nw; x++) {
      const sx = Math.min(i.w - 1, Math.floor((x + 0.5) * fx));
      const s = (sy * i.w + sx) * 4;
      const t = (y * nw + x) * 4;
      d[t] = i.d[s]; d[t + 1] = i.d[s + 1]; d[t + 2] = i.d[s + 2]; d[t + 3] = i.d[s + 3];
    }
  }
  return { w: nw, h: nh, d };
}

// PIL Image.rotate(-rot, expand=True, resample=NEAREST)
function rotate(i: Img, rot: number): Img {
  const angleDeg = (((-rot) % 360) + 360) % 360;
  const { w, h } = i;
  if (angleDeg === 0) return i;
  if (angleDeg === 180 || angleDeg === 90 || angleDeg === 270) {
    const nw = angleDeg === 180 ? w : h;
    const nh = angleDeg === 180 ? h : w;
    const d = new Uint8ClampedArray(nw * nh * 4);
    for (let y = 0; y < nh; y++) {
      for (let x = 0; x < nw; x++) {
        let sx: number, sy: number;
        if (angleDeg === 180) { sx = w - 1 - x; sy = h - 1 - y; }
        else if (angleDeg === 90) { sx = w - 1 - y; sy = x; }
        else { sx = y; sy = h - 1 - x; }
        const s = (sy * w + sx) * 4;
        const t = (y * nw + x) * 4;
        d[t] = i.d[s]; d[t + 1] = i.d[s + 1]; d[t + 2] = i.d[s + 2]; d[t + 3] = i.d[s + 3];
      }
    }
    return { w: nw, h: nh, d };
  }
  const ang = -(angleDeg * Math.PI) / 180;
  const cos = Math.cos(ang);
  const sin = Math.sin(ang);
  const a = cos, b = sin, d0 = -sin, e = cos;
  const tf = (x: number, y: number, c: number, f: number): [number, number] =>
    [a * x + b * y + c, d0 * x + e * y + f];
  const cx = w / 2, cy = h / 2;
  let [c, f] = tf(-cx, -cy, 0, 0);
  c += cx; f += cy;
  const xs: number[] = [], ys: number[] = [];
  for (const [x, y] of [[0, 0], [w, 0], [w, h], [0, h]]) {
    const [px, py] = tf(x, y, c, f);
    xs.push(px); ys.push(py);
  }
  const nw = Math.ceil(Math.max(...xs)) - Math.floor(Math.min(...xs));
  const nh = Math.ceil(Math.max(...ys)) - Math.floor(Math.min(...ys));
  [c, f] = tf(-(nw - w) / 2, -(nh - h) / 2, c, f);
  const out = new Uint8ClampedArray(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      const xin = Math.floor(a * (x + 0.5) + b * (y + 0.5) + c);
      const yin = Math.floor(d0 * (x + 0.5) + e * (y + 0.5) + f);
      if (xin < 0 || yin < 0 || xin >= w || yin >= h) continue;
      const s = (yin * w + xin) * 4;
      const t = (y * nw + x) * 4;
      out[t] = i.d[s]; out[t + 1] = i.d[s + 1]; out[t + 2] = i.d[s + 2]; out[t + 3] = i.d[s + 3];
    }
  }
  return { w: nw, h: nh, d: out };
}

const div255 = (v: number) => (v + (v >> 8)) >> 8;

// Pillow AlphaComposite.c (src over dst), 8-bit integer math
function over(dst: Uint8ClampedArray, di: number, sr: number, sg: number, sb: number, sa: number): void {
  if (sa === 0) return;
  const da = dst[di + 3];
  const blend = da * (255 - sa);
  const outa255 = sa * 255 + blend;
  const coef1 = Math.floor((sa * 255 * 255 * (1 << PRECISION_BITS)) / outa255);
  const coef2 = 255 * (1 << PRECISION_BITS) - coef1;
  const half = 0x80 << PRECISION_BITS;
  dst[di] = div255(sr * coef1 + dst[di] * coef2 + half) >> PRECISION_BITS;
  dst[di + 1] = div255(sg * coef1 + dst[di + 1] * coef2 + half) >> PRECISION_BITS;
  dst[di + 2] = div255(sb * coef1 + dst[di + 2] * coef2 + half) >> PRECISION_BITS;
  dst[di + 3] = div255(outa255 + 0x80);
}

// Python round(): half to even
function pyRound(v: number): number {
  const f = Math.floor(v);
  const diff = v - f;
  if (diff < 0.5) return f;
  if (diff > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}

export function composeFrame(
  placed: Placed[],
  action: number,
  size = { w: 200, h: 200 },
  origin = { x: 100, y: 150 },
): Atlas {
  const canvas: Atlas = { w: size.w, h: size.h, data: new Uint8ClampedArray(size.w * size.h * 4) };
  if (placed.length === 0) return canvas;
  const bodyList = frames(placed[0].part, action);
  const bodyAnchor = bodyList[placed[0].frame % bodyList.length][1];

  for (const p of placed) {
    const list = frames(p.part, action);
    const [layers, anchor] = list[p.frame % list.length];
    let shiftX = 0, shiftY = 0;
    if (p.anchored && bodyAnchor && anchor) {
      shiftX = bodyAnchor[0] - anchor[0];
      shiftY = bodyAnchor[1] - anchor[1];
    }
    for (const [x, y, ax, ay, aw, ah, mirror, sx, sy, rot, r, g, b, al] of layers) {
      const d = new Uint8ClampedArray(aw * ah * 4);
      for (let row = 0; row < ah; row++) {
        const s = ((ay + row) * p.atlas.w + ax) * 4;
        d.set(p.atlas.data.subarray(s, s + aw * 4), row * aw * 4);
      }
      let img: Img = { w: aw, h: ah, d };
      if (mirror) img = mirrorH(img);
      if (sx !== 1 || sy !== 1) {
        img = resizeNearest(
          img,
          Math.max(1, pyRound(img.w * Math.abs(sx))),
          Math.max(1, pyRound(img.h * Math.abs(sy))),
        );
      }
      if (rot) img = rotate(img, rot);
      const tint = !(r === 255 && g === 255 && b === 255 && al === 255);
      const px = origin.x + x + shiftX - Math.floor(img.w / 2);
      const py = origin.y + y + shiftY - Math.floor(img.h / 2);
      for (let iy = 0; iy < img.h; iy++) {
        const cy = py + iy;
        if (cy < 0 || cy >= canvas.h) continue;
        for (let ix = 0; ix < img.w; ix++) {
          const cx = px + ix;
          if (cx < 0 || cx >= canvas.w) continue;
          const s = (iy * img.w + ix) * 4;
          let sr = img.d[s], sg = img.d[s + 1], sb = img.d[s + 2], sa = img.d[s + 3];
          if (tint) {
            sr = Math.floor((sr * r) / 255);
            sg = Math.floor((sg * g) / 255);
            sb = Math.floor((sb * b) / 255);
            sa = Math.floor((sa * al) / 255);
          }
          over(canvas.data, (cy * canvas.w + cx) * 4, sr, sg, sb, sa);
        }
      }
    }
  }
  return canvas;
}

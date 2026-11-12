// A hat effect (aura, landmark, effect wings) pre-rendered by scripts/dressup/fxrender.py:
// per frame an ordinary-alpha piece `n` and an additive piece `a` in one atlas. The stage
// draws `a` on a canvas with mix-blend-mode: plus-lighter, so the light adds as in game.

/** [atlas x, atlas y, w, h, dx, dy]: dx, dy place the piece's top-left from the feet */
export type FxRect = [number, number, number, number, number, number];

export type FxData = {
  v: 1;
  fps: number;
  /** drawn behind the character (isRenderBeforeCharacter) */
  before: boolean;
  frames: { n: FxRect | null; a: FxRect | null }[];
};

/** The frame shown `ms` after the effect started, looping. */
export function fxFrameAt(fx: FxData, ms: number): number {
  const n = fx.frames.length;
  return n ? Math.floor((ms * fx.fps) / 1000) % n : 0;
}

/** Draw one rect of the atlas with its top-left at (feet + dx, feet + dy). */
export function drawFxRect(ctx: CanvasRenderingContext2D, atlas: CanvasImageSource, r: FxRect | null, feetX: number, feetY: number) {
  if (!r) return;
  const [ax, ay, w, h, dx, dy] = r;
  ctx.drawImage(atlas, ax, ay, w, h, feetX + dx, feetY + dy, w, h);
}

/** The fx canvases are this many times the 200x200 stage, the stage in their middle third. */
export const FX_SCALE = 3;
/** Where the stage's (0, 0) sits on an fx canvas. */
export const FX_OFFSET = { x: 200, y: 250 };

/**
 * The zoom (at most 1) at which every frame of the effects fits the 200x200 view, zooming
 * about `origin` (stage px) with the feet at `feet`. Never below 1 / FX_SCALE: the fx canvases
 * end there.
 */
export function fxFit(effects: FxData[], origin: { x: number; y: number }, feet: { x: number; y: number }): number {
  let fit = 1;
  const side = (o: number, size: number, lo: number, hi: number) => {
    if (lo < 0) fit = Math.min(fit, o / (o - lo));
    if (hi > size) fit = Math.min(fit, (size - o) / (hi - o));
  };
  for (const fx of effects) {
    for (const f of fx.frames) {
      for (const r of [f.n, f.a]) {
        if (!r) continue;
        const x = feet.x + r[4], y = feet.y + r[5];
        side(origin.x, 200, x, x + r[2]);
        side(origin.y, 200, y, y + r[3]);
      }
    }
  }
  return Math.max(1 / FX_SCALE, Math.floor(fit * 100) / 100);
}

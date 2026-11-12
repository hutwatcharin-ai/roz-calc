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

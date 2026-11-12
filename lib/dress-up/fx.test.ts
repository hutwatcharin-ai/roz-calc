import { describe, expect, it } from 'vitest';
import { fxFit, fxFrameAt, type FxData } from './fx';

const fx = (frames: number, fps = 10): FxData => ({
  v: 1, fps, before: false, frames: Array.from({ length: frames }, () => ({ n: null, a: null })),
});

describe('fxFrameAt', () => {
  it('runs at the effect fps and loops', () => {
    expect(fxFrameAt(fx(5), 0)).toBe(0);
    expect(fxFrameAt(fx(5), 250)).toBe(2);
    expect(fxFrameAt(fx(5), 600)).toBe(1);
  });

  it('an effect with no frames stays on frame 0', () => {
    expect(fxFrameAt(fx(0), 1234)).toBe(0);
  });
});

describe('fxFit', () => {
  const one = (r: FxData['frames'][number]['n']): FxData => ({ v: 1, fps: 30, before: false, frames: [{ n: r, a: null }] });
  const feet = { x: 100, y: 150 };
  const mid = { x: 100, y: 100 };

  it('is 1 when the effect stays on the stage', () => {
    expect(fxFit([one([0, 0, 80, 80, -40, -120])], mid, feet)).toBe(1);
    expect(fxFit([], mid, feet)).toBe(1);
  });

  it('zooms out until the widest frame fits', () => {
    // x -100..300 on the stage, zooming about x 100: half size
    expect(fxFit([one([0, 0, 400, 10, -200, -10])], mid, feet)).toBe(0.5);
  });

  it('looks at the additive piece too and never goes below a third', () => {
    const fx: FxData = { v: 1, fps: 30, before: false, frames: [{ n: null, a: [0, 0, 10, 2000, 0, -1500] }] };
    expect(fxFit([fx], mid, feet)).toBeCloseTo(1 / 3);
  });
});

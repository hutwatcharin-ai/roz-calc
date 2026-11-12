import { describe, expect, it } from 'vitest';
import { fxFrameAt, type FxData } from './fx';

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

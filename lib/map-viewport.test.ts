import { describe, expect, it } from 'vitest';
import { MAX_SCALE, clampViewport, resetViewport, zoomAt } from './map-viewport';

describe('map viewport', () => {
  it('resets to fit and centre the atlas', () => expect(resetViewport(640, 512)).toEqual({ scale: 0.5, x: 0, y: 0 }));
  it('clamps scale and drag bounds', () => expect(clampViewport({ scale: 1, x: -9999, y: 9999 }, 640, 512)).toEqual({ scale: 1, x: -640, y: 0 }));
  it('does not zoom past the maximum', () => expect(zoomAt({ scale: 1, x: 0, y: 0 }, 99, 100, 100, 640, 512).scale).toBe(MAX_SCALE));
});

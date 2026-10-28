import { describe, expect, it } from 'vitest';
import { headLayers, isHeadLayer } from './headgear-slots';

describe('headLayers', () => {
  it('reads one layer for a plain hat, glasses or mask', () => {
    expect(headLayers(2220)).toEqual(['u']); // Hat
    expect(headLayers(2201)).toEqual(['m']); // Sunglasses
    expect(headLayers(2265)).toEqual(['l']); // Gangster Mask
  });

  it('lists every layer a hat covers, so it shows under each', () => {
    expect(headLayers(2288)).toEqual(['m', 'l']);
  });

  it('knows nothing of an id it has no entry for', () => {
    expect(headLayers(1)).toEqual([]);
  });

  it('accepts only u, m and l from a URL', () => {
    expect(['u', 'm', 'l', 'x', undefined].map(isHeadLayer)).toEqual([true, true, true, false, false]);
  });
});

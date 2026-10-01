import { describe, expect, it } from 'vitest';
import { statSegments } from './stat-rank';

const peers = Array.from({ length: 10 }, (_, i) => ({ id: i + 100, level: 30, value: (i + 1) * 100 }));

describe('statSegments', () => {
  it('lights all ten for the strongest of its level', () => {
    expect(statSegments(5000, 30, peers, 1)).toBe(10);
  });
  it('lights one for the weakest, never zero', () => {
    expect(statSegments(1, 30, peers, 1)).toBe(1);
  });
  it('sits in the middle for a middling value', () => {
    expect(statSegments(550, 30, peers, 1)).toBe(5);
  });
  it('ignores monsters more than ten levels away', () => {
    const far = peers.map((p) => ({ ...p, level: 80 }));
    expect(statSegments(550, 30, far, 1)).toBeNull();
  });
  it('says nothing for an unpublished value', () => {
    expect(statSegments(0, 30, peers, 1)).toBeNull();
    expect(statSegments(null, 30, peers, 1)).toBeNull();
  });
  it('leaves the monster itself out of its own pool', () => {
    expect(statSegments(1000, 30, peers, 109)).toBe(10);
  });
});

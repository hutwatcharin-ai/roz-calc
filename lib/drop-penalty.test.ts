import { describe, it, expect } from 'vitest';
import { dropPenalty, dropPenaltyDetail } from './drop-penalty';

describe('dropPenalty', () => {
  it('reports no penalty inside the confirmed safe band', () => {
    expect(dropPenalty(50, 50)).toBe('none');
    expect(dropPenalty(50, 69)).toBe('none');
    expect(dropPenalty(50, 31)).toBe('none');
  });

  it('reports halved drops beyond the confirmed far band', () => {
    expect(dropPenalty(50, 91)).toBe('halved');
    expect(dropPenalty(99, 1)).toBe('halved');
  });

  it('refuses to interpolate between the two confirmed points', () => {
    // Players confirmed +/-19 (no penalty) and beyond +/-40 (halved). Nothing
    // confirms the middle, and a smooth curve through it would read as a game
    // value rather than as the guess it would be.
    expect(dropPenalty(50, 70)).toBe('unknown');
    expect(dropPenalty(50, 90)).toBe('unknown');
    expect(dropPenalty(50, 20)).toBe('unknown');
  });

  it('treats the boundaries as stated, not as approximations', () => {
    expect(dropPenalty(50, 69)).toBe('none'); // gap 19
    expect(dropPenalty(50, 70)).toBe('unknown'); // gap 20
    expect(dropPenalty(50, 90)).toBe('unknown'); // gap 40
    expect(dropPenalty(50, 91)).toBe('halved'); // gap 41
  });
});

describe('dropPenaltyDetail', () => {
  it('says how far apart the levels are, not just the verdict', () => {
    expect(dropPenaltyDetail(50, 95)).toContain('45');
    expect(dropPenaltyDetail(50, 95)).toContain('ครึ่ง');
  });

  it('says outright that the middle band is unverified', () => {
    expect(dropPenaltyDetail(50, 75)).toContain('ยังไม่มีใครยืนยัน');
  });
});

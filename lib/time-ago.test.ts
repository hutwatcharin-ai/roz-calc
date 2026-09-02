import { describe, expect, it } from 'vitest';
import { timeAgoTh } from './time-ago';

const NOW = new Date('2026-09-02T12:00:00Z');

describe('timeAgoTh', () => {
  it('buckets into minutes, hours, days, months', () => {
    expect(timeAgoTh(new Date(NOW.getTime() - 30_000).toISOString(), NOW)).toBe('เมื่อสักครู่');
    expect(timeAgoTh(new Date(NOW.getTime() - 5 * 60_000).toISOString(), NOW)).toBe('5 นาทีที่แล้ว');
    expect(timeAgoTh(new Date(NOW.getTime() - 3 * 3_600_000).toISOString(), NOW)).toBe('3 ชม.ที่แล้ว');
    expect(timeAgoTh(new Date(NOW.getTime() - 2 * 86_400_000).toISOString(), NOW)).toBe('2 วันที่แล้ว');
    expect(timeAgoTh(new Date(NOW.getTime() - 60 * 86_400_000).toISOString(), NOW)).toBe('2 เดือนที่แล้ว');
  });

  it('a future or malformed timestamp degrades to "just now" instead of a negative label', () => {
    expect(timeAgoTh(new Date(NOW.getTime() + 60_000).toISOString(), NOW)).toBe('เมื่อสักครู่');
    expect(timeAgoTh('not-a-date', NOW)).toBe('เมื่อสักครู่');
  });
});

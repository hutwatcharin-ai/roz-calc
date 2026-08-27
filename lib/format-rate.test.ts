import { describe, it, expect } from 'vitest';
import { formatExpPerHour, formatKillTime, formatKillsPerHour } from './format-rate';

describe('formatKillsPerHour', () => {
  it('never rounds a real rate down to zero', () => {
    // The case that produced this function: a 1,200-damage player against Lord
    // Of Death's 112,838,250 HP kills 0.096 per hour. Printing "0" beside
    // "943,858 EXP/ชั่วโมง" is a contradiction the arithmetic never made.
    expect(formatKillsPerHour(0.0957)).toBe('0.10');
    expect(formatKillsPerHour(0.004)).toBe('0.00');
  });

  it('keeps one decimal in the single digits and drops it above ten', () => {
    expect(formatKillsPerHour(3.24)).toBe('3.2');
    expect(formatKillsPerHour(9000)).toBe('9,000');
  });
});

describe('formatKillTime', () => {
  it('moves up a unit rather than printing a huge second count', () => {
    expect(formatKillTime(37613)).toBe('10.4 ชั่วโมง');
    expect(formatKillTime(150)).toBe('2.5 นาที');
    expect(formatKillTime(42)).toBe('42 วินาที');
    expect(formatKillTime(0.4)).toBe('0.4 วินาที');
  });

  it('shows a dash rather than a number for a non-time', () => {
    expect(formatKillTime(0)).toBe('—');
    expect(formatKillTime(Number.NaN)).toBe('—');
  });
});

describe('formatExpPerHour', () => {
  it('keeps a sub-unit rate visible instead of showing zero', () => {
    expect(formatExpPerHour(0.4)).toBe('0.40');
    expect(formatExpPerHour(943858.1)).toBe('943,858');
  });
});

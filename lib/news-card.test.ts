import { describe, expect, it } from 'vitest';
import { dateThFull, wrap } from './news-card';

describe('wrap', () => {
  it('keeps a name between middle dots on one line', () => {
    expect(wrap('กิจกรรม ต.ค. · Baphomet Cult · Amon Ra · Kumamon', 20, 3)).toEqual([
      'กิจกรรม ต.ค. ·',
      'Baphomet Cult ·',
      'Amon Ra · Kumamon',
    ]);
  });

  it('leaves no one-character last line', () => {
    expect(wrap('Guild Hall of Fame ซีซั่น 1', 22, 3)).toEqual(['Guild Hall of Fame', 'ซีซั่น 1']);
  });

  it('folds overflow into the last allowed line', () => {
    expect(wrap('a b c d e f', 1, 2)).toHaveLength(2);
  });
});

describe('dateThFull', () => {
  it('writes the Thai-time date in the Buddhist year', () => {
    expect(dateThFull('2026-10-15T08:00:00+07:00')).toBe('15 ต.ค. 2569');
    // 23:30 on the 31st UTC is already the 1st in Thailand.
    expect(dateThFull('2026-10-31T23:30:00Z')).toBe('1 พ.ย. 2569');
  });
});

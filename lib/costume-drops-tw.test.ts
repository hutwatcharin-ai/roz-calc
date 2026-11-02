import { describe, expect, it } from 'vitest';
import { thaiDate, twMonsterLabel, twReports, twReportsByMonster, twReportsFor } from './costume-drops-tw';

describe('costume-drops-tw', () => {
  it('has the 11 reported pieces, each with at least one monster', () => {
    expect(twReports()).toHaveLength(11);
    for (const r of twReports()) expect(r.monsters.length).toBeGreaterThan(0);
  });

  it('finds a report by the Bound id and ignores missing ids', () => {
    expect(twReportsFor([null, 400850]).map((r) => r.item_id)).toEqual([400850]);
    expect(twReportsFor([undefined, 1])).toEqual([]);
  });

  it('finds reports by monster', () => {
    expect(twReportsByMonster(1035).map((r) => r.name_zh)).toEqual(['糞便帽']);
    expect(twReportsByMonster(999999)).toEqual([]);
  });

  it('keeps a monster Global does not have, under its Chinese name', () => {
    const hand = twReportsFor([400872])[0];
    expect(hand.monsters[0].id).toBeNull();
    expect(twMonsterLabel(hand.monsters[0])).toBe('黑狐');
  });

  it('writes Thai Buddhist-era dates', () => {
    expect(thaiDate('2025-10-04')).toBe('4 ต.ค. 2568');
  });
});

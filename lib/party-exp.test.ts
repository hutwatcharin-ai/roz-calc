import { describe, it, expect } from 'vitest';
import { PARTY_EXP } from '@/lib/party-exp';

describe('PARTY_EXP', () => {
  it('covers 2 to 12 members with no gap', () => {
    expect(PARTY_EXP.map((row) => row.members)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it('has an each-column that is the total divided by the party, to the point', () => {
    // The transcription check: the two published columns are one number seen
    // twice, so a mistyped digit in either breaks this. The tolerance is what
    // rounding each member's share to a whole percent can cost -- half a point
    // per member, no more -- which is why a nine-man party can be 4 off (14.56
    // printed as 15) while nothing else may drift further.
    for (const row of PARTY_EXP) {
      expect(Math.abs(row.each * row.members - row.total)).toBeLessThanOrEqual(row.members / 2);
    }
  });

  it('never pays a member as much as hunting alone', () => {
    // The reason the table is on the page at all.
    for (const row of PARTY_EXP) expect(row.each).toBeLessThan(100);
  });
});

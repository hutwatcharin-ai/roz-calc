// What sharing a kill does to the EXP each player gets.
//
// A party earns more EXP in total than one player would, and each member gets
// a fraction of that larger number. Both halves matter to a decision: two
// people together earn 110% of a solo kill, but 55% each -- so partying is a
// loss per head from the first extra member, and what it buys is killing
// faster.
//
// Source: roz-global.info (mirrored 8 Sep 2026), the only source we hold that
// prints it. The total column sits between 130% and 132% from four members up,
// which reads as rounding rather than a rule that wobbles: multiply each
// listed per-person share by the party size and you land back inside a point
// of the listed total, every row. Presented as the guide's own figures, with
// that noted, rather than smoothed into a formula nobody published.

export interface PartyExpRow {
  members: number;
  /** Percent of a solo kill's EXP the whole party earns together. */
  total: number;
  /** Percent of a solo kill's EXP one member takes home. */
  each: number;
}

export const PARTY_EXP: PartyExpRow[] = [
  { members: 2, total: 110, each: 55 },
  { members: 3, total: 120, each: 40 },
  { members: 4, total: 130, each: 33 },
  { members: 5, total: 130, each: 26 },
  { members: 6, total: 131, each: 22 },
  { members: 7, total: 131, each: 19 },
  { members: 8, total: 130, each: 16 },
  { members: 9, total: 131, each: 15 },
  { members: 10, total: 130, each: 13 },
  { members: 11, total: 132, each: 12 },
  { members: 12, total: 131, each: 11 },
];

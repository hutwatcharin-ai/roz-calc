// Zero means "we were not told", for the stats where zero is not a real value.
//
// 39 monsters in the table carry hp = 0 and base_exp = 0: the Mj and Mq
// variants, the Ztw and B event monsters, Tao Gunka, Whisper 1185. The source
// prints "—" for every one of them, so the zero is this database's old
// unknown-value sentinel and not a monster with no hit points. The ten
// Nordfeld monsters imported on 8 Sep use null for the same thing, because
// migration 0010 made the columns nullable.
//
// Both readings existed in the code and disagreed: the monster page rendered
// "—" for a zero, while the monster list wrote "HP 0 · EXP 0" on the same
// monster -- a number a player can act on, for a monster nobody has measured.
// One function now, used by both.
//
// This applies to hp and to the two EXP columns. It does NOT apply to
// everything: a monster really can have DEF 0 or ATK 0, and those columns
// carry null when unknown, so they are formatted with `stat` below.

/** hp / base_exp / job_exp: 0 and null both mean unknown. */
export function unknownIfZero(value: number | null | undefined): string {
  return value === null || value === undefined || value === 0 ? '—' : value.toLocaleString('en-US');
}

/** Columns where 0 is a real value and only null is unknown. */
export function stat(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('en-US');
}

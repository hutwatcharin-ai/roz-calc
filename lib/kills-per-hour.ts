// Kills per hour from monster HP and the player's own damage.
//
// Competing tools open by asking the player for this number, which a player who
// has not gone and stood somewhere cannot answer. We have every monster's HP,
// so we work it out instead (spec 3.15.3).

export interface KillRateInput {
  monsterHp: number;
  damagePerHit: number;
  attacksPerSecond: number;
  /**
   * Percent chance a swing lands, from the mob's hit_100 threshold against the
   * player's HIT (lib/hit-flee.ts). Optional: without it every swing is
   * assumed to land, which is what this file did until 4 Sep 2026 -- and that
   * overstated the rate by exactly the miss rate, ~20% on a mob whose hit_100
   * sits 20 above the player's HIT.
   */
  hitChancePercent?: number | null;
}

export interface KillRate {
  /** Landed hits needed to exhaust the mob's HP. */
  hitsToKill: number;
  /** Swings needed including misses. Equals hitsToKill at 100% hit chance. */
  attacksToKill: number;
  secondsToKill: number;
  killsPerHour: number;
}

// Must be shown wherever a kill rate or an EXP/hour figure appears. The number
// counts swinging time only -- no walking, no respawn waits, no misses -- so the
// real figure is always lower. No correction factor is applied: we have neither
// respawn rates nor monster density, and a plausible-looking 0.7 would be a
// guess dressed up as precision.
export const KILL_RATE_DISCLAIMER =
  'เพดานบน คิดเฉพาะเวลาที่ตีอยู่ ไม่รวมเวลาเดินหามอนและรอเกิดใหม่ ของจริงจะน้อยกว่านี้เสมอ';

function isUsable(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function killRate(input: KillRateInput): KillRate | null {
  const { monsterHp, damagePerHit, attacksPerSecond, hitChancePercent } = input;

  // monsterHp of 0 is the unknown-HP marker transformMonster writes when the
  // raw feed says "???" -- not a monster that dies to nothing.
  if (!isUsable(monsterHp) || !isUsable(damagePerHit) || !isUsable(attacksPerSecond)) {
    return null;
  }

  const hitsToKill = Math.ceil(monsterHp / damagePerHit);

  // A missing or unusable hit chance means "we do not know", and the honest
  // fallback there is the old behaviour -- every swing lands -- not a guessed
  // penalty. A known chance is applied: at 80% it takes 1.25 swings to land
  // one hit, so the kill takes a quarter longer.
  const usableChance =
    typeof hitChancePercent === 'number' && Number.isFinite(hitChancePercent) && hitChancePercent > 0
      ? Math.min(100, hitChancePercent)
      : 100;
  const attacksToKill = Math.ceil(hitsToKill / (usableChance / 100));
  const secondsToKill = attacksToKill / attacksPerSecond;

  return {
    hitsToKill,
    attacksToKill,
    secondsToKill,
    killsPerHour: 3600 / secondsToKill,
  };
}

// expPerKill of 0 is the unknown-EXP marker transformMonster writes when the
// raw feed says "" or "???" -- not a monster that gives no experience. 202 of
// 524 monsters carry that marker, every one of them from a sentinel, not a
// literal zero in the feed. Reporting "0 EXP/ชั่วโมง" for one of those would
// state a game value we do not have.
export function expPerHour(killsPerHour: number, expPerKill: number): number | null {
  if (!isUsable(expPerKill)) return null;
  return killsPerHour * expPerKill;
}

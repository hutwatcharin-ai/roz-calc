// Kills per hour from monster HP and the player's own damage.
//
// Competing tools open by asking the player for this number, which a player who
// has not gone and stood somewhere cannot answer. We have every monster's HP,
// so we work it out instead (spec 3.15.3).

export interface KillRateInput {
  monsterHp: number;
  damagePerHit: number;
  attacksPerSecond: number;
}

export interface KillRate {
  hitsToKill: number;
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
  const { monsterHp, damagePerHit, attacksPerSecond } = input;

  // monsterHp of 0 is the unknown-HP marker transformMonster writes when the
  // raw feed says "???" -- not a monster that dies to nothing.
  if (!isUsable(monsterHp) || !isUsable(damagePerHit) || !isUsable(attacksPerSecond)) {
    return null;
  }

  const hitsToKill = Math.ceil(monsterHp / damagePerHit);
  const secondsToKill = hitsToKill / attacksPerSecond;

  return {
    hitsToKill,
    secondsToKill,
    killsPerHour: 3600 / secondsToKill,
  };
}

export function expPerHour(killsPerHour: number, expPerKill: number): number {
  return killsPerHour * expPerKill;
}

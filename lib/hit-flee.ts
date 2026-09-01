// HIT / FLEE math for Ragnarok Zero (renewal engine), verified against the
// rAthena source (status.cpp base hit/flee, battle.cpp hitrate) on 2026-09-01:
//
//   player HIT  = 175 + BaseLv + DEX + floor(LUK/3)
//   player FLEE = 100 + BaseLv + AGI + floor(LUK/5)
//   mob HIT     = 150 + Lv + DEX
//   mob FLEE    = 100 + Lv + AGI
//   hit chance% = 80 + attacker HIT - defender FLEE, clamped to [5, 100]
//
// So an attacker never misses at HIT >= FLEE + 20, and a defender caps dodge
// (95%) at FLEE >= HIT + 75. Server-side tuning by Gravity can deviate; every
// surface that shows these numbers must say they are computed, not observed.

export function playerHit(level: number, dex: number, luk: number): number {
  return 175 + level + dex + Math.floor(luk / 3);
}

export function playerFlee(level: number, agi: number, luk: number): number {
  return 100 + level + agi + Math.floor(luk / 5);
}

// Monster stats can be unknown (null) -- 28 of 524 rows. Null in, null out:
// inventing a FLEE for a monster we do not know would be a made-up safety claim.
export function mobFlee(level: number | null, agi: number | null): number | null {
  if (level == null || agi == null) return null;
  return 100 + level + agi;
}

export function mobHit(level: number | null, dex: number | null): number | null {
  if (level == null || dex == null) return null;
  return 150 + level + dex;
}

/** HIT the attacker needs to hit this defender 100% of the time. */
export function hitToNeverMiss(defenderFlee: number): number {
  return defenderFlee + 20;
}

/** FLEE the defender needs to dodge this attacker 95% of the time (the cap). */
export function fleeToCapDodge(attackerHit: number): number {
  return attackerHit + 75;
}

export function hitChancePct(attackerHit: number, defenderFlee: number): number {
  const raw = 80 + attackerHit - defenderFlee;
  return Math.min(100, Math.max(5, raw));
}

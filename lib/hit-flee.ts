// HIT / FLEE math for Ragnarok Zero (renewal engine).
//
// Player-side formulas, verified against rAthena source (status.cpp) 2026-09-01:
//
//   player HIT  = 175 + BaseLv + DEX + floor(LUK/3)
//   player FLEE = 100 + BaseLv + AGI + floor(LUK/5)
//
// Monster side: the monsters table does NOT hold the mob's own HIT/FLEE.
// It holds midgardhub's player-facing thresholds (their CSV columns are
// literally named hit_100 / flee_95, discovered 2026-09-01 — we mis-read
// them as raw mob stats for a day):
//
//   hit_100  = the player HIT needed to hit this mob 100% of the time
//   flee_95  = the player FLEE needed to dodge this mob 95% (the cap)
//
// Hit chance moves 1% per point (rAthena linear hitrate), so:
//   your chance to hit  = 100 - (hit_100 - yourHIT), clamped [5, 100]
//   mob's chance on you = 5 + (flee_95 - yourFLEE), clamped [5, 100]
//
// Never add +20/+75 to these columns — that was the old bug: the thresholds
// already ARE the targets to display.

export function playerHit(level: number, dex: number, luk: number): number {
  return 175 + level + dex + Math.floor(luk / 3);
}

export function playerFlee(level: number, agi: number, luk: number): number {
  return 100 + level + agi + Math.floor(luk / 5);
}

/** % chance your attack lands, from the mob's hit_100 threshold. */
export function hitChanceVsMob(myHit: number, hit100: number): number {
  return Math.min(100, Math.max(5, 100 + myHit - hit100));
}

/** % chance the mob's attack lands on you, from its flee_95 threshold. */
export function mobHitChance(flee95: number, myFlee: number): number {
  return Math.min(100, Math.max(5, 5 + flee95 - myFlee));
}

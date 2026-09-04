// Ranking hunting maps for a player's level.
//
// prontera.info's leveling planner ranks by "EXP density within ±10 levels".
// Reverse-engineering its published order for level 50 (12 maps) against the
// numbers its own page prints, the closest fit was a spawn-weighted EXP sum
// tapered by how far each monster's level sits from the player's -- 94% of
// pairs in the right order, against 82% for an untapered sum. That is the
// fallback here, for a visitor who has not told us anything about their
// character.
//
// With a character in the bar we can do better than density, because we have
// the two things density stands in for: the monster's HP against the player's
// damage, and its hit_100 against the player's HIT. Then the ranking is an
// actual EXP/hour, and spawn amount says how much of the map is that monster.
//
// Neither number is a promise: killRate counts swinging time only (see
// KILL_RATE_DISCLAIMER), and the population share assumes you fight what you
// walk into rather than hunting one species.

import { killRate, expPerHour } from './kills-per-hour';
import { hitChanceVsMob } from './hit-flee';

export interface SpotMonster {
  monster_id: number;
  name_en: string;
  level: number;
  hp: number | null;
  base_exp: number | null;
  hit_100: number | null;
  is_aggressive: boolean | null;
  /** How many of this monster the map holds. Null where no source lists it. */
  amount: number | null;
}

export interface Spot {
  map_code: string;
  map_name: string;
  monsters: SpotMonster[];
}

export interface CharacterInput {
  level: number;
  damagePerHit: number;
  attacksPerSecond: number;
  hit: number | null;
}

export interface ScoredMonster extends SpotMonster {
  /** EXP/hour killing only this monster, misses counted. Null when unknown. */
  expPerHour: number | null;
  hitChance: number | null;
}

/**
 * Zone variants of one map -- gef_fild10 alongside gef_f10_a, _b and _z --
 * carry the same name and the same monsters, and listing all four pushed three
 * real maps off the top ten. They collapse into the variant that carries the
 * most population data; the rest are counted, not hidden, because "this map
 * has four zones" is worth knowing when you arrive and find it crowded.
 *
 * Grouped on the display name AND the exact monster set: two different maps
 * that happen to share a name (a field and its battleground copy) hold
 * different monsters and stay apart.
 */
export function dedupeZoneVariants(spots: Spot[]): (Spot & { zoneCount: number })[] {
  const groups = new Map<string, Spot[]>();
  for (const spot of spots) {
    const species = spot.monsters
      .map((m) => m.monster_id)
      .sort((a, b) => a - b)
      .join(',');
    const key = `${spot.map_name}|${species}`;
    groups.set(key, [...(groups.get(key) ?? []), spot]);
  }

  return [...groups.values()].map((group) => {
    const best = group.reduce((a, b) => {
      const aTotal = a.monsters.reduce((n, m) => n + (m.amount ?? 0), 0);
      const bTotal = b.monsters.reduce((n, m) => n + (m.amount ?? 0), 0);
      return bTotal > aTotal ? b : a;
    });
    return { ...best, zoneCount: group.length };
  });
}

export interface ScoredSpot extends Spot {
  scored: ScoredMonster[];
  /** Total monsters on the map, counting only those we have an amount for. */
  spawnTotal: number;
  /** Best single monster's EXP/hour, or null with no character. */
  bestExpPerHour: number | null;
  /**
   * EXP/hour if you fight whatever you meet, each monster weighted by how many
   * of it the map holds. Null with no character.
   */
  mixedExpPerHour: number | null;
  /** Spawn-weighted EXP total, tapered by level distance. The no-character sort. */
  density: number;
  /** How many species on the map attack on sight. */
  aggressiveCount: number;
}

/**
 * Level-distance taper. 1 at the player's own level, falling to 0 at ±LEVEL_SPAN.
 * The span is wider than the ±10 filter prontera states, because its published
 * order only reproduces with the wider taper.
 */
export const LEVEL_SPAN = 15;

export function levelWeight(monsterLevel: number, playerLevel: number): number {
  return Math.max(0, 1 - Math.abs(monsterLevel - playerLevel) / LEVEL_SPAN);
}

export function scoreSpot(spot: Spot, playerLevel: number, character: CharacterInput | null): ScoredSpot {
  let density = 0;
  let spawnTotal = 0;
  let aggressiveCount = 0;
  let weightedExp = 0;
  let weightedPopulation = 0;
  let bestExpPerHour: number | null = null;

  const scored: ScoredMonster[] = spot.monsters.map((monster) => {
    const amount = monster.amount ?? 0;
    spawnTotal += amount;
    if (monster.is_aggressive) aggressiveCount += 1;
    // base_exp 0 is this database's unknown marker, not a monster worth
    // nothing -- it must not pull a map's density down as if it were a zero.
    if (monster.base_exp) {
      density += amount * monster.base_exp * levelWeight(monster.level, playerLevel);
    }

    let hitChance: number | null = null;
    let exp: number | null = null;
    if (character) {
      hitChance =
        character.hit !== null && monster.hit_100 !== null
          ? hitChanceVsMob(character.hit, monster.hit_100)
          : null;
      const rate = killRate({
        monsterHp: monster.hp ?? 0,
        damagePerHit: character.damagePerHit,
        attacksPerSecond: character.attacksPerSecond,
        hitChancePercent: hitChance,
      });
      exp = rate ? expPerHour(rate.killsPerHour, monster.base_exp ?? 0) : null;
      if (exp !== null) {
        if (bestExpPerHour === null || exp > bestExpPerHour) bestExpPerHour = exp;
        if (amount > 0) {
          weightedExp += exp * amount;
          weightedPopulation += amount;
        }
      }
    }

    return { ...monster, expPerHour: exp, hitChance };
  });

  return {
    ...spot,
    scored,
    spawnTotal,
    bestExpPerHour,
    mixedExpPerHour: weightedPopulation > 0 ? weightedExp / weightedPopulation : null,
    density,
    aggressiveCount,
  };
}

/**
 * Best spots first. With a character that means the mixed EXP/hour -- what the
 * map pays if you fight what you meet; without one, the density fallback.
 * Maps that answer neither sort last rather than being dropped: "we have no
 * numbers for this map" is not the same claim as "this map is bad".
 */
export function rankSpots(spots: Spot[], playerLevel: number, character: CharacterInput | null): ScoredSpot[] {
  const scored = spots.map((spot) => scoreSpot(spot, playerLevel, character));
  return scored.sort((a, b) => {
    if (character) {
      const av = a.mixedExpPerHour ?? -1;
      const bv = b.mixedExpPerHour ?? -1;
      if (av !== bv) return bv - av;
    }
    if (a.density !== b.density) return b.density - a.density;
    return a.map_name.localeCompare(b.map_name);
  });
}

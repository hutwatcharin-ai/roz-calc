// What "a good place to farm" means on /guides/farm-guide.
//
// It used to mean the highest EXP per hit point, and that ranking put three
// things at the top that nobody can farm:
//
//   Blue Plant led levels 1-15 on 52 EXP per HP -- a plant that does not move,
//     with eight of them on its busiest map
//   Eclipse led 31-45 on a map that contains exactly one of it
//   21 of the 35 monsters the page listed had no known spawn at all, so the
//     "where" column read "—": go and kill this, we cannot say where
//
// EXP per HP answers "how much EXP for the damage I deal". It says nothing
// about whether there is a second one to kill afterwards. So the ranking now
// multiplies it by how many of that monster stand on its busiest map, and a
// monster we cannot place is left out rather than recommended blind.
//
// The score is a comparison key, not a measured rate: nothing here claims
// EXP per hour. The page prints both halves -- EXP/HP and the count -- so a
// reader can see why a row is where it is.

export interface FarmCandidate {
  monsterId: number;
  name: string;
  level: number;
  hp: number | null;
  baseExp: number | null;
  expPerHp: number | null;
  isAggressive: boolean | null;
  imageUrl: string | null;
}

export interface SpawnPlace {
  monsterId: number;
  map: string | null;
  amount: number | null;
}

export interface FarmPick extends FarmCandidate {
  /** The map with the most of this monster on it. */
  bestMap: string;
  /** How many stand there. */
  amount: number;
  /** expPerHp x amount. A ranking key, not a rate. */
  score: number;
}

/** The busiest map for each monster, ignoring spawn rows with no name or no count. */
export function busiestMaps(spawns: SpawnPlace[]): Map<number, { map: string; amount: number }> {
  const best = new Map<number, { map: string; amount: number }>();
  for (const spawn of spawns) {
    if (!spawn.map || !spawn.amount || spawn.amount <= 0) continue;
    const current = best.get(spawn.monsterId);
    if (!current || spawn.amount > current.amount) best.set(spawn.monsterId, { map: spawn.map, amount: spawn.amount });
  }
  return best;
}

/**
 * The top `limit` monsters for a level band: EXP per HP weighted by how many
 * of them share a map, and only monsters we can point at a map for.
 */
export function farmPicks(
  candidates: FarmCandidate[],
  spawns: SpawnPlace[],
  band: { lo: number; hi: number },
  limit = 5,
): FarmPick[] {
  const best = busiestMaps(spawns);
  return candidates
    .filter((c) => c.level >= band.lo && c.level <= band.hi && (c.expPerHp ?? 0) > 0 && best.has(c.monsterId))
    .map((c) => {
      const place = best.get(c.monsterId)!;
      return { ...c, bestMap: place.map, amount: place.amount, score: (c.expPerHp ?? 0) * place.amount };
    })
    .sort((a, b) => b.score - a.score || b.amount - a.amount)
    .slice(0, limit);
}

/** Level bands, 15 wide, stopping at the level cap. */
export function farmBands(levelCap: number, width = 15): { lo: number; hi: number }[] {
  const bands: { lo: number; hi: number }[] = [];
  for (let lo = 1; lo <= levelCap; lo += width) {
    bands.push({ lo, hi: Math.min(lo + width - 1, levelCap) });
  }
  return bands;
}

/** Candidates inside the bands that had to be dropped for having no known map. */
export function unplaceable(candidates: FarmCandidate[], spawns: SpawnPlace[], levelCap: number): number {
  const best = busiestMaps(spawns);
  return candidates.filter((c) => c.level <= levelCap && (c.expPerHp ?? 0) > 0 && !best.has(c.monsterId)).length;
}

/**
 * The same ranking for a free level range rather than a fixed band, which is
 * what the home page's finder needs.
 *
 * Monsters we cannot place come back separately instead of being dropped: the
 * range is the reader's own choice there, and a range that quietly returns
 * nothing looks like missing data. The page lists them after the ranked rows
 * and says their map is unknown.
 */
export function rankFarmRange(
  candidates: FarmCandidate[],
  spawns: SpawnPlace[],
  limit = 20,
): { ranked: FarmPick[]; unplaced: FarmCandidate[] } {
  const best = busiestMaps(spawns);
  const usable = candidates.filter((c) => (c.expPerHp ?? 0) > 0);
  const ranked = usable
    .filter((c) => best.has(c.monsterId))
    .map((c) => {
      const place = best.get(c.monsterId)!;
      return { ...c, bestMap: place.map, amount: place.amount, score: (c.expPerHp ?? 0) * place.amount };
    })
    .sort((a, b) => b.score - a.score || b.amount - a.amount)
    .slice(0, limit);
  const unplaced = usable
    .filter((c) => !best.has(c.monsterId))
    .sort((a, b) => (b.expPerHp ?? 0) - (a.expPerHp ?? 0))
    .slice(0, Math.max(0, limit - ranked.length));
  return { ranked, unplaced };
}

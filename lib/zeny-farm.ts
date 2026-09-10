// Which map pays best for the junk that drops off its monsters.
//
// The site can already say where the EXP is (lib/farm-picks). This is the
// other half of the same question, asked by a player who needs zeny rather
// than levels: kill things, sell what falls, which field is worth the trip.
//
// The score is deliberately the same shape as the EXP one: value per HP,
// weighted by how many monsters stand there. HP is the only proxy for time we
// hold -- nothing in our data knows a player's damage -- and density is what
// separates a map you can farm continuously from one where you walk between
// kills.
//
// What the number is NOT: zeny per hour. That needs a kill speed we would have
// to invent, and an invented number would carry more weight than the measured
// ones underneath it.

/** A drop as the table holds it: rate is per-10,000, so 500 is 5%. */
export interface DropRow {
  itemId: number;
  rate: number | null;
  sellPrice: number | null;
}

export interface MonsterValue {
  id: number;
  name: string;
  level: number | null;
  hp: number | null;
  /** Expected zeny of sellable drops from one kill. */
  perKill: number;
  /** Drops we could not price, which is why perKill is a floor. */
  unpriced: number;
}

export interface SpawnRow {
  mapCode: string;
  monsterId: number;
  amount: number | null;
}

export interface MapPick {
  mapCode: string;
  /** Sum over the map's monsters of perKill / HP * amount. */
  score: number;
  mobs: number;
  /** The monsters that carry most of the score, best first. */
  top: { id: number; name: string; perKill: number; amount: number }[];
}

/**
 * Expected zeny from one kill.
 *
 * A drop with no rate, or an item with no sell price, contributes nothing --
 * counted separately so a page can say the figure is a floor rather than a
 * total. 3,347 of 3,757 drop rows carry a rate and 1,945 of 4,921 items carry
 * a sell price, so this is not a rare case.
 */
export function zenyPerKill(drops: DropRow[]): { perKill: number; unpriced: number } {
  let perKill = 0;
  let unpriced = 0;
  for (const drop of drops) {
    if (drop.rate === null || !drop.sellPrice) {
      unpriced += 1;
      continue;
    }
    perKill += (drop.rate / 10000) * drop.sellPrice;
  }
  return { perKill, unpriced };
}

/**
 * Maps a player cannot simply walk into, so a ranking must not offer them.
 *
 * The treasure rooms outrank every real field by a factor of five, and they
 * only exist inside War of Emperium; a memorial dungeon needs a party and a
 * quest to enter. Left in, the top of this list would be places the reader
 * cannot go.
 */
const CLOSED_TO_WALK_INS = [
  { test: /^treasure/, why: 'ห้องสมบัติ WoE' },
  { test: /^gld_?dun|^gld2?_/, why: 'ดันเจี้ยนกิลด์' },
  { test: /^(prt|pay|gef|alde)_gld/, why: 'ปราสาท WoE' },
  { test: /^(ma_|md_|1@|2@)/, why: 'Memorial Dungeon' },
  { test: /^job_|^que_|^new_|^force_/, why: 'แมพเควส/ทดสอบ' },
];

export function walkInReason(mapCode: string): string | null {
  return CLOSED_TO_WALK_INS.find((rule) => rule.test.test(mapCode))?.why ?? null;
}

/**
 * The maps worth the trip, best first.
 *
 * `canonical` folds the channel copies (gef_f10_a, _b and _z are one field
 * with three doors); without it the top ten is the same map four times.
 */
export function rankMaps(
  spawns: SpawnRow[],
  values: Map<number, MonsterValue>,
  options: { canonicalOf?: (code: string) => string; minMobs?: number } = {},
): MapPick[] {
  const canonical = options.canonicalOf ?? ((code: string) => code);
  const minMobs = options.minMobs ?? 10;
  // Channels hold the same monsters in the same numbers, so folding them has
  // to take the largest count, never the sum: adding gef_f10_a to _b to _z put
  // 1,848 Lunatics on a field that holds about 500 and pushed it up the list.
  const largest = new Map<string, { code: string; monsterId: number; amount: number }>();
  for (const spawn of spawns) {
    const monster = values.get(spawn.monsterId);
    if (!monster || !monster.hp || monster.perKill <= 0) continue;
    const code = canonical(spawn.mapCode);
    if (walkInReason(code)) continue;
    const amount = spawn.amount ?? 1;
    const key = `${code}|${spawn.monsterId}`;
    const current = largest.get(key);
    if (!current || amount > current.amount) largest.set(key, { code, monsterId: spawn.monsterId, amount });
  }

  const byMap = new Map<string, MapPick>();
  for (const { code, monsterId, amount } of largest.values()) {
    const monster = values.get(monsterId) as MonsterValue;
    const pick = byMap.get(code) ?? { mapCode: code, score: 0, mobs: 0, top: [] };
    pick.score += (monster.perKill / (monster.hp as number)) * amount;
    pick.mobs += amount;
    pick.top.push({ id: monster.id, name: monster.name, perKill: monster.perKill, amount });
    byMap.set(code, pick);
  }
  return [...byMap.values()]
    .filter((pick) => pick.mobs >= minMobs)
    .map((pick) => ({
      ...pick,
      // A map's own best earners, by what one kill is worth times how many
      // there are -- the two numbers a reader checks the score against.
      top: [...pick.top].sort((a, b) => b.perKill * b.amount - a.perKill * a.amount).slice(0, 4),
    }))
    .sort((a, b) => b.score - a.score);
}

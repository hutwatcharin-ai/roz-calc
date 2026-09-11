// Where to leave the bot all night for zeny: kill what stands on the map,
// sell what drops to an NPC, no hoping for rare loot.
//
// The model, as settled with the site owner on 11 Sep 2026:
//
// 1. MVPs and monsters that spawn one at a time never earn. A bot does not
//    wait for a single respawn, and before this rule eight of the top ten
//    "best monsters" were exactly those (Dragon Fly's 15% Clip, Bacsojin).
// 2. Without the player's numbers: rank by zeny per HP times headcount -- the
//    same shape as the EXP ranking -- and show the average zeny per kill.
// 3. With damage, attack rate and FLEE: zeny per hour. The bot fights what it
//    meets in proportion to headcount, so the time per kill is the headcount-
//    weighted average, and a drop only counts if a whole night would see it at
//    least STEADY_DROPS_PER_NIGHT times.
// 4. A map is out when any monster on it -- earner or not, MVP included --
//    lands hits on the player past the AFK dodge cap, or has no FLEE figure to
//    judge by. Slow kills do not remove a map; they lower its zeny per hour.

import { afkVerdict, type AfkStyle } from './afk-safety';
import { killRate } from './kills-per-hour';

/**
 * A drop as the table holds it: rate is a PERCENT, so 70 is 70% (Poring's
 * Jellopy). rAthena's own scale is per-10,000, and this file was first written
 * against that -- every zeny figure on the draft page came out a hundred times
 * too small until the Poring row was checked by hand on 11 Sep 2026.
 */
export interface DropRow {
  itemId: number;
  rate: number | null;
  sellPrice: number | null;
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
    perKill += (drop.rate / 100) * drop.sellPrice;
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

export const NIGHT_HOURS = 8;
/** A drop a whole night would see fewer times than this is luck, not income. */
export const STEADY_DROPS_PER_NIGHT = 3;
/** Fewer monsters than this and the bot spends the night walking. */
export const MIN_MOBS = 10;

/** A drop that has both a rate (percent) and a sell price. */
export interface PricedDrop {
  rate: number;
  sell: number;
}

export interface ZenyMonster {
  id: number;
  name: string;
  level: number | null;
  /** null when the table holds its unknown-HP marker. */
  hp: number | null;
  sprite: string | null;
  isMvp: boolean;
  /** No spawn point anywhere holds more than one: a mini-boss or a set piece. */
  solo: boolean;
  isAggressive: boolean | null;
  flee95: number | null;
  hit100: number | null;
  drops: PricedDrop[];
  /** Drops left out for want of a rate or a price. */
  unpriced: number;
  /** Expected zeny per kill over every priced drop. */
  perKill: number;
  /** The drop that earns most, for the "what am I picking up" line. */
  best: { name: string; icon: string | null; category: string | null; value: number } | null;
}

export interface ZenyMapData {
  /** Canonical code: channel copies are already folded, largest count kept. */
  code: string;
  name: string;
  image: string | null;
  spawns: { id: number; amount: number }[];
}

export interface ZenyData {
  monsters: Record<number, ZenyMonster>;
  maps: ZenyMapData[];
  /** Monsters on walk-in maps that never rank, for the line that says so. */
  excluded: { mvp: number; solo: number };
  coverage: { pricedItems: number; totalItems: number; ratedDrops: number; totalDrops: number };
}

export interface ZenyPlayer {
  style: AfkStyle;
  damagePerHit: number;
  /** Attacks per second (melee) or casts per second (magic). */
  perSecond: number;
  /** Melee only. */
  hit: number | null;
  flee: number;
}

export interface MapBlocker {
  id: number;
  name: string;
  reason: 'dodge' | 'unknown_flee';
  /** % chance it lands on the player; null when its FLEE is unknown. */
  theirHitPct: number | null;
}

export interface ScoredMap {
  code: string;
  name: string;
  image: string | null;
  /** Headcount the bot farms: not MVP, not solo, HP known. */
  mobs: number;
  /** Average zeny per kill over that headcount. */
  avgPerKill: number;
  /** The no-numbers ranking key: zeny per HP times headcount. */
  score: number;
  /** null without the player's numbers. */
  zenyPerHour: number | null;
  /** Best earners on the map; perKill is the figure used (steady drops only with numbers). */
  top: { id: number; perKill: number; amount: number }[];
  /** null without numbers; empty when the map passes. */
  blockers: MapBlocker[] | null;
  /** Same earners in the same numbers under another code are the same place. */
  fingerprint: string;
  channels: number;
}

export function scoreMap(map: ZenyMapData, monsters: Record<number, ZenyMonster>, player: ZenyPlayer | null): ScoredMap {
  const met = map.spawns
    .map((spawn) => ({ m: monsters[spawn.id], amount: spawn.amount }))
    .filter((row): row is { m: ZenyMonster; amount: number } => row.m !== undefined && row.amount > 0);
  const farmed = met.filter((row) => !row.m.isMvp && !row.m.solo && row.m.hp !== null && row.m.hp > 0);

  const mobs = farmed.reduce((sum, row) => sum + row.amount, 0);
  const score = farmed.reduce((sum, row) => sum + (row.m.perKill / (row.m.hp as number)) * row.amount, 0);
  const fingerprint = farmed
    .filter((row) => row.m.perKill > 0)
    .map((row) => `${row.m.id}x${row.amount}`)
    .sort()
    .join(',');

  const perKillOf = new Map(farmed.map((row) => [row.m.id, row.m.perKill]));
  let avgPerKill = mobs > 0 ? farmed.reduce((sum, row) => sum + row.m.perKill * row.amount, 0) / mobs : 0;
  let zenyPerHour: number | null = null;
  let blockers: MapBlocker[] | null = null;

  if (player) {
    // Held to the strict cap if anything here might come to us: an unknown
    // aggression flag counts as aggressive, the same as the AFK finder.
    const aggroKinds = met.filter((row) => row.m.isAggressive !== false).length;
    const myHitPct = new Map<number, number | null>();
    blockers = [];
    for (const row of met) {
      const verdict = afkVerdict({
        style: player.style,
        monster: {
          hp: row.m.hp,
          flee95: row.m.flee95,
          hit100: row.m.hit100,
          isAggressive: row.m.isAggressive,
          mapAggroCount: aggroKinds,
        },
        me: { flee: player.flee, hit: player.hit, damagePerHit: player.damagePerHit },
        // Hit count is not a gate here: a slow kill costs zeny per hour, not the bot.
        maxHits: Number.POSITIVE_INFINITY,
      });
      myHitPct.set(row.m.id, verdict.myHitPct);
      if (verdict.fails.includes('unknown_flee')) {
        blockers.push({ id: row.m.id, name: row.m.name, reason: 'unknown_flee', theirHitPct: null });
      } else if (verdict.fails.includes('dodge')) {
        blockers.push({ id: row.m.id, name: row.m.name, reason: 'dodge', theirHitPct: verdict.theirHitPct });
      }
    }

    let headcount = 0;
    let secondsWeighted = 0;
    const timed: { m: ZenyMonster; amount: number }[] = [];
    for (const row of farmed) {
      const rate = killRate({
        monsterHp: row.m.hp as number,
        damagePerHit: player.damagePerHit,
        attacksPerSecond: player.perSecond,
        hitChancePercent: myHitPct.get(row.m.id) ?? null,
      });
      if (!rate) continue;
      headcount += row.amount;
      secondsWeighted += rate.secondsToKill * row.amount;
      timed.push(row);
    }

    if (headcount > 0) {
      const avgSeconds = secondsWeighted / headcount;
      const killsPerNight = (NIGHT_HOURS * 3600) / avgSeconds;
      let zenyWeighted = 0;
      for (const row of timed) {
        const kills = killsPerNight * (row.amount / headcount);
        const steady = row.m.drops
          .filter((drop) => (drop.rate / 100) * kills >= STEADY_DROPS_PER_NIGHT)
          .reduce((sum, drop) => sum + (drop.rate / 100) * drop.sell, 0);
        perKillOf.set(row.m.id, steady);
        zenyWeighted += steady * row.amount;
      }
      avgPerKill = zenyWeighted / headcount;
      zenyPerHour = (avgPerKill / avgSeconds) * 3600;
    } else {
      avgPerKill = 0;
      zenyPerHour = 0;
    }
  }

  const top = farmed
    .map((row) => ({ id: row.m.id, perKill: perKillOf.get(row.m.id) ?? 0, amount: row.amount }))
    .filter((row) => row.perKill > 0)
    .sort((a, b) => b.perKill * b.amount - a.perKill * a.amount)
    .slice(0, 4);

  return {
    code: map.code,
    name: map.name,
    image: map.image,
    mobs,
    avgPerKill,
    score,
    zenyPerHour,
    top,
    blockers,
    fingerprint,
    channels: 1,
  };
}

// Channels the canonical rule keeps apart (an event channel holds one extra
// monster, so it is not strictly a copy) still read as one place. They fold
// here, after the gate, so a safe door is never hidden behind an unsafe one.
function collapse(list: ScoredMap[]): ScoredMap[] {
  const out: ScoredMap[] = [];
  const byPrint = new Map<string, ScoredMap>();
  for (const map of list) {
    const twin = byPrint.get(map.fingerprint);
    if (twin) {
      const channels = twin.channels + 1;
      // Prefer the shortest code: iz_dun02 rather than iz_d02_a.
      if (map.code.length < twin.code.length) Object.assign(twin, map);
      twin.channels = channels;
      continue;
    }
    const copy = { ...map };
    byPrint.set(map.fingerprint, copy);
    out.push(copy);
  }
  return out;
}

export function rankZenyMaps(data: ZenyData, player: ZenyPlayer | null): { ranked: ScoredMap[]; blocked: ScoredMap[] } {
  const scored = data.maps
    .map((map) => scoreMap(map, data.monsters, player))
    .filter((map) => map.mobs >= MIN_MOBS && map.top.length > 0);
  const key = (map: ScoredMap) => (player ? map.zenyPerHour ?? 0 : map.score);
  scored.sort((a, b) => key(b) - key(a));

  const ranked = collapse(scored.filter((map) => !map.blockers || map.blockers.length === 0));
  const safe = new Set(ranked.map((map) => map.fingerprint));
  const blocked = collapse(scored.filter((map) => map.blockers && map.blockers.length > 0 && !safe.has(map.fingerprint)));
  return { ranked, blocked };
}

/** The monsters worth most per kill among those a bot can farm. */
export function topEarners(data: ZenyData, limit: number): ZenyMonster[] {
  return Object.values(data.monsters)
    .filter((m) => !m.isMvp && !m.solo && m.perKill > 0)
    .sort((a, b) => b.perKill - a.perKill)
    .slice(0, limit);
}

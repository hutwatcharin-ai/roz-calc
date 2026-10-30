// The fallback gate for the two overnight modes, used when the player has
// given FLEE but not enough for the damage model (lib/farm-engine/survival):
// a map is out when a monster the bot farms lands hits past the AFK dodge cap,
// or has no FLEE figure to judge by.
//
// It used to count everything standing on the map, MVP included. An MVP or a
// one-at-a-time spawn is met now and then, not farmed (owner, 19 Oct 2026):
// it now only tags the map (mapTags.bosses), the way the ranking already
// treated it.

import { afkVerdict, type SkillRisk } from '../afk-safety';
import { killsInOneHit } from './basics';
import type { Blocker } from './survival';
import type { MapRow, PlayerInput } from './types';

export type { Blocker } from './survival';

/** farmed: the monsters the bot fights (basics.farmedOn), not MVPs or solo spawns. */
export function mapBlockers(farmed: MapRow[], player: PlayerInput): Blocker[] | null {
  if (player.flee === null) return null;
  // An unknown aggression flag counts as aggressive, as in the AFK rule.
  const aggroKinds = farmed.filter((row) => row.m.isAggressive !== false).length;
  const blockers: Blocker[] = [];
  for (const row of farmed) {
    // Plants, mushrooms and eggs never attack: nothing to dodge
    // (owner, 19 Oct 2026: Shining Plant was taking Zenhai Marsh out).
    if (row.m.attackDelay === 0) continue;
    const verdict = afkVerdict({
      style: player.style,
      monster: {
        hp: row.m.hp,
        flee95: row.m.flee95,
        hit100: row.m.hit100,
        isAggressive: row.m.isAggressive,
        mapAggroCount: aggroKinds,
      },
      me: { flee: player.flee, hit: player.hit, damagePerHit: player.damage ?? 1 },
      maxHits: Number.POSITIVE_INFINITY,
    });
    if (verdict.fails.includes('unknown_flee')) {
      blockers.push({ id: row.m.id, name: row.m.name, reason: 'unknown_flee', theirHitPct: null });
    } else if (verdict.fails.includes('dodge')) {
      blockers.push({ id: row.m.id, name: row.m.name, reason: 'dodge', theirHitPct: verdict.theirHitPct });
    }
  }
  return blockers;
}

export interface MapTags {
  aggressiveKinds: number;
  risks: { risk: SkillRisk; names: string[] }[];
  /** MVPs and one-at-a-time spawns on the map: met now and then, not farmed, not judged. */
  bosses: string[];
  /** Farmed monsters that wait to be hit and die to the first hit: dodging is not asked of them. */
  oneHit: string[];
}

const RISK_ORDER: SkillRisk[] = ['summons', 'locks', 'explodes', 'transforms'];

export function mapTags(met: MapRow[], player?: PlayerInput, farmed: MapRow[] = []): MapTags {
  const names = new Map<SkillRisk, string[]>();
  for (const row of met) {
    for (const { risk } of row.m.risks) {
      const list = names.get(risk) ?? [];
      if (!list.includes(row.m.name)) list.push(row.m.name);
      names.set(risk, list);
    }
  }
  return {
    aggressiveKinds: met.filter((row) => row.m.isAggressive === true).length,
    risks: RISK_ORDER.filter((risk) => names.has(risk)).map((risk) => ({ risk, names: names.get(risk) as string[] })),
    bosses: [...new Set(met.filter((row) => row.m.isMvp || row.m.solo).map((row) => row.m.name))],
    oneHit: player
      ? [...new Set(farmed.filter((row) => row.m.isAggressive === false && killsInOneHit(row.m, player)).map((row) => row.m.name))]
      : [],
  };
}

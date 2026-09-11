// "Will the bot survive the night here?" -- one answer for both overnight modes.
//
// A map is out when anything standing on it, MVP included, lands hits past the
// AFK dodge cap, or has no FLEE figure to judge by. Slow kills and misses do
// not remove a map: they lower its per-hour figure, which says so already.
// Checked against real data on 11 Sep 2026: adding the hit and hit-count
// rules left the top three unchanged for weak, mid and strong characters.

import { afkVerdict, type SkillRisk } from '../afk-safety';
import type { MapRow, PlayerInput } from './types';

export interface Blocker {
  id: number;
  name: string;
  reason: 'dodge' | 'unknown_flee';
  /** % it lands on the player; null when its FLEE is unknown. */
  theirHitPct: number | null;
}

export function mapBlockers(met: MapRow[], player: PlayerInput): Blocker[] | null {
  if (player.flee === null) return null;
  // An unknown aggression flag counts as aggressive, as in the AFK rule.
  const aggroKinds = met.filter((row) => row.m.isAggressive !== false).length;
  const blockers: Blocker[] = [];
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
}

const RISK_ORDER: SkillRisk[] = ['summons', 'locks', 'explodes', 'transforms'];

export function mapTags(met: MapRow[]): MapTags {
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
  };
}

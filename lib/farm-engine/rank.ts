// Map rankings for the three map modes. One scorer, three questions:
//
//   level  where do I level by hand now      EXP, tapered to ±15 levels, no gate
//   afk    where does a bot collect EXP overnight and survive
//   zeny   where does a bot collect zeny overnight and survive
//
// Without the player's speed, maps rank by what is on them (density for level,
// value per HP times headcount for the overnight modes). With it, by the
// per-hour figure: total value over total time, killing what the map holds in
// proportion to headcount.
//
// The overnight modes count walking between kills too (19 Oct 2026). Counting
// swing time alone made a one-hit monster look like 10,000 kills an hour, and
// low-level monsters give more EXP per HP (4.7 at Lv 0-9 against 0.6-1.1 at
// Lv 40-90), so the Lv 1-25 shelf topped the list however strong the player.

import {
  canRate,
  collapseChannels,
  dropFactor,
  dropTag,
  farmedOn,
  headcount,
  levelWeight,
  metOn,
  secondsPerKill,
  steadyPerKill,
  type DropTag,
} from './basics';
import { mapBlockers, mapTags, type Blocker, type MapTags } from './safety';
import { mapSurvival, survivalContext, walkSeconds, type MapSurvival, type SurvivalContext } from './survival';
import { MIN_MOBS, NIGHT_HOURS, type FarmData, type FarmMap, type MapRow, type PlayerInput } from './types';

/** Maps whose monsters average this many levels under the player are hidden by default in the overnight modes. */
export const LOW_MAP_GAP = 20;

export type RankMode = 'level' | 'afk' | 'zeny';

export interface RankOptions {
  /** The level the level mode ranks for (bar level, URL level or the default). */
  level: number;
  cleanOnly?: boolean;
  noRiskOnly?: boolean;
  /** Overnight modes: hide maps LOW_MAP_GAP+ levels under the player (needs the player's level). */
  hideLowMaps?: boolean;
}

export interface RankedMap {
  code: string;
  name: string;
  image: string | null;
  /** Farmed headcount: not MVP, not solo, HP and count known. */
  mobs: number;
  /** Average EXP (level, afk) or zeny (zeny) per kill over that headcount. */
  avgPerKill: number;
  /** EXP or zeny per hour; null without the player's damage and speed. Zeny is after potions. */
  perHour: number | null;
  /** Headcount-weighted level of the farmed monsters; null when none has a level. */
  avgLevel: number | null;
  /** The damage model's answer (overnight modes, enough numbers filled in); null otherwise. */
  survival: MapSurvival | null;
  sortKey: number;
  /** Best contributors; value is the per-kill figure used. */
  top: { id: number; value: number; amount: number }[];
  /** null when the mode does not gate or FLEE is unknown; empty when the map passes. */
  blockers: Blocker[] | null;
  tags: MapTags;
  /** Level drop tags present among the zeny contributors. */
  dropTags: DropTag[];
  fingerprint: string;
  channels: number;
}

function scoreMap(
  map: FarmMap,
  data: FarmData,
  player: PlayerInput,
  mode: RankMode,
  opts: RankOptions,
  ctx: SurvivalContext,
): RankedMap | null {
  const farmed = farmedOn(map, data.monsters);
  const mobs = headcount(farmed);
  if (mobs < MIN_MOBS) return null;

  const zenyMode = mode === 'zeny';
  const factor = (row: MapRow) => dropFactor(player.level, row.m.level);
  const baseValue = (row: MapRow) => (zenyMode ? row.m.perKill * factor(row) : row.m.baseExp ?? 0);
  const contributors = farmed.filter((row) => baseValue(row) > 0);
  if (contributors.length === 0) return null;

  let density = 0;
  for (const row of farmed) {
    if (row.m.level !== null && row.m.baseExp) density += row.amount * row.m.baseExp * levelWeight(row.m.level, opts.level);
  }
  if (mode === 'level' && density <= 0) return null;

  const score = farmed.reduce((sum, row) => sum + (baseValue(row) / (row.m.hp as number)) * row.amount, 0);
  const valueOf = new Map(farmed.map((row) => [row.m.id, baseValue(row)]));
  let avgPerKill = farmed.reduce((sum, row) => sum + baseValue(row) * row.amount, 0) / mobs;
  let perHour: number | null = null;

  const overnight = mode !== 'level';
  const survival = overnight ? mapSurvival(map, data, player, ctx) : null;
  const walk = overnight ? walkSeconds(map, mobs, player, ctx) : 0;

  if (canRate(player)) {
    let count = 0;
    let seconds = 0;
    const timed: (MapRow & { s: number })[] = [];
    for (const row of farmed) {
      const fight = survival?.fightSeconds.get(row.m.id) ?? secondsPerKill(row.m, player);
      if (fight === null) continue;
      const s = fight + walk;
      count += row.amount;
      seconds += s * row.amount;
      timed.push({ ...row, s });
    }
    if (count > 0) {
      const avgSeconds = seconds / count;
      const killsPerNight = (NIGHT_HOURS * 3600) / avgSeconds;
      let total = 0;
      for (const row of timed) {
        const value = zenyMode ? steadyPerKill(row.m, killsPerNight * (row.amount / count), factor(row)) : row.m.baseExp ?? 0;
        valueOf.set(row.m.id, value);
        total += value * row.amount;
      }
      avgPerKill = total / count;
      perHour = (avgPerKill / avgSeconds) * 3600;
      if (zenyMode && survival) perHour -= survival.potionCostPerHour;
    }
  }

  let levelSum = 0;
  let levelCount = 0;
  for (const row of farmed) {
    if (row.m.level === null) continue;
    levelSum += row.m.level * row.amount;
    levelCount += row.amount;
  }

  const met = metOn(map, data.monsters);
  const tagsPresent = new Set(contributors.map((row) => dropTag(player.level, row.m.level)).filter((t): t is DropTag => t !== null));

  return {
    code: map.code,
    name: map.name,
    image: map.image,
    mobs,
    avgPerKill,
    perHour,
    avgLevel: levelCount > 0 ? levelSum / levelCount : null,
    survival,
    sortKey: perHour !== null ? perHour : mode === 'level' ? density : score,
    top: contributors
      .map((row) => ({ id: row.m.id, value: valueOf.get(row.m.id) ?? 0, amount: row.amount }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value * b.amount - a.value * a.amount)
      .slice(0, 4),
    blockers: !overnight ? null : survival ? survival.blockers : mapBlockers(farmed, player),
    tags: mapTags(met),
    dropTags: zenyMode ? (['halved', 'unconfirmed'] as DropTag[]).filter((t) => tagsPresent.has(t)) : [],
    fingerprint: contributors
      .map((row) => `${row.m.id}x${row.amount}`)
      .sort()
      .join(','),
    channels: 1,
  };
}

export function rankMaps(
  data: FarmData,
  player: PlayerInput,
  mode: RankMode,
  opts: RankOptions,
): { ranked: RankedMap[]; blocked: RankedMap[]; hiddenLow: number } {
  const ctx = survivalContext(data);
  let scored = data.maps.map((map) => scoreMap(map, data, player, mode, opts, ctx)).filter((m): m is RankedMap => m !== null);
  let hiddenLow = 0;
  if (opts.hideLowMaps && mode !== 'level' && player.level !== null) {
    const floor = player.level - LOW_MAP_GAP;
    const kept = scored.filter((m) => m.avgLevel === null || m.avgLevel >= floor);
    hiddenLow = collapseChannels(scored.filter((m) => !kept.includes(m))).length;
    scored = kept;
  }
  if (opts.cleanOnly) scored = scored.filter((m) => m.tags.aggressiveKinds === 0);
  if (opts.noRiskOnly) scored = scored.filter((m) => m.tags.risks.length === 0);
  scored.sort((a, b) => b.sortKey - a.sortKey || a.name.localeCompare(b.name));

  // Fold after the gate, so a safe channel is never hidden behind an unsafe copy.
  const ranked = collapseChannels(scored.filter((m) => !m.blockers || m.blockers.length === 0));
  const safe = new Set(ranked.map((m) => m.fingerprint));
  const blocked = collapseChannels(scored.filter((m) => m.blockers !== null && m.blockers.length > 0 && !safe.has(m.fingerprint)));
  return { ranked, blocked, hiddenLow };
}

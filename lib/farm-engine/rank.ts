// Map rankings for the three map modes. One scorer, three questions:
//
//   level  where do I level by hand now      EXP of what the player can kill, no gate
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
  canFight,
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
import { canSurvive, mapSurvival, survivalContext, walkSeconds, type MapSurvival, type SurvivalContext } from './survival';
import { bestTargets, type BotRun, type BotSettings } from './bot-session';
import { MIN_MOBS, NIGHT_HOURS, type FarmData, type FarmMap, type MapRow, type PlayerInput } from './types';

/**
 * The best maps in a ranking are where everyone goes: monsters there die to
 * other players soon after they spawn (owner, 28 Oct 2026). The tool cannot
 * see crowds, so the top of each ranking carries a "popular" tag; the figure
 * itself stays the one-player estimate.
 */
export const POPULAR_TOP = 5;

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
  /**
   * Overnight modes: the bot's settings. With them and enough of the
   * player's numbers, each map is judged as a run of the built-in bot
   * (lib/farm-engine/bot-session) on the best set of monsters to tick.
   */
  bot?: BotSettings;
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
  /** The bot run on the best ticked set (overnight modes with bot settings); the longest failing run when none works. */
  bot: BotRun | null;
  sortKey: number;
  /** Best contributors; value is the per-kill figure used. */
  top: { id: number; value: number; amount: number }[];
  /** null when the mode does not gate or FLEE is unknown; empty when the map passes. */
  blockers: Blocker[] | null;
  /** The level mode: what the survival model would have taken the map out for, shown as warnings. */
  warnings: Blocker[];
  tags: MapTags;
  /** Level drop tags present among the zeny contributors. */
  dropTags: DropTag[];
  fingerprint: string;
  channels: number;
  /** One of the POPULAR_TOP best of the ranking: other players crowd it (owner, 28 Oct 2026). */
  popular: boolean;
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
  if (mode === 'level' && !canRate(player) && density <= 0) return null;

  const score = farmed.reduce((sum, row) => sum + (baseValue(row) / (row.m.hp as number)) * row.amount, 0);
  const valueOf = new Map(farmed.map((row) => [row.m.id, baseValue(row)]));
  let avgPerKill = farmed.reduce((sum, row) => sum + baseValue(row) * row.amount, 0) / mobs;
  let perHour: number | null = null;

  const overnight = mode !== 'level';
  if (overnight && opts.bot && canSurvive(player)) return botMap(map, data, player, mode, opts.bot, ctx, farmed, mobs, contributors);
  // The level mode fights what the player can kill (28 Oct 2026): with
  // their damage, whatever dies in MAX_HITS_TO_KILL hits and is hit often
  // enough, at any level, since Zero takes nothing off EXP for a level gap;
  // without it, the level band. They walk between those, and the survival
  // model warns but never removes a map: someone at the keyboard drinks and
  // retreats.
  const inBand = (row: MapRow) =>
    mode !== 'level' || (canRate(player) ? canFight(row.m, player) : row.m.level !== null && levelWeight(row.m.level, opts.level) > 0);
  const fought = farmed.filter(inBand);
  if (mode === 'level' && canRate(player) && !fought.some((row) => (row.m.baseExp ?? 0) > 0)) return null;
  const survival = canSurvive(player) ? mapSurvival(map, data, player, ctx, inBand) : null;
  const walk = canRate(player) ? walkSeconds(map, headcount(fought), player, ctx) : 0;

  if (canRate(player)) {
    let count = 0;
    let seconds = 0;
    const timed: (MapRow & { s: number })[] = [];
    for (const row of fought) {
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
    bot: null,
    sortKey: perHour !== null ? perHour : mode === 'level' ? density : score,
    // The level mode names what the player fights, not a monster it left out.
    top: (mode === 'level' ? contributors.filter(inBand) : contributors)
      .map((row) => ({ id: row.m.id, value: valueOf.get(row.m.id) ?? 0, amount: row.amount }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value * b.amount - a.value * a.amount)
      .slice(0, 4),
    blockers: !overnight ? null : survival ? survival.blockers : mapBlockers(farmed, player),
    warnings: !overnight && survival ? survival.blockers : [],
    tags: mapTags(met),
    dropTags: zenyMode ? (['halved', 'unconfirmed'] as DropTag[]).filter((t) => tagsPresent.has(t)) : [],
    fingerprint: contributors
      .map((row) => `${row.m.id}x${row.amount}`)
      .sort()
      .join(','),
    channels: 1,
    popular: false,
  };
}

/** Why a bot run is not offered, as the blocked list shows it. */
function runBlockers(run: BotRun): Blocker[] {
  if (run.dangers.length > 0) {
    return run.dangers.map((d) => ({
      id: d.id,
      name: d.name,
      reason: d.kind === 'burst' ? 'burst' : d.kind,
      theirHitPct: null,
      damage: d.damage,
    }));
  }
  return [{ id: run.targets[0], name: '', reason: 'short', theirHitPct: null, hours: run.hours }];
}

/** An overnight map judged as a run of the built-in bot. */
function botMap(
  map: FarmMap,
  data: FarmData,
  player: PlayerInput,
  mode: RankMode,
  bot: BotSettings,
  ctx: SurvivalContext,
  farmed: MapRow[],
  mobs: number,
  contributors: MapRow[],
): RankedMap {
  const zenyMode = mode === 'zeny';
  const factor = (m: FarmData['monsters'][number]) => dropFactor(player.level, m.level);
  const { best, worst } = bestTargets(
    map,
    data,
    player,
    bot,
    ctx,
    NIGHT_HOURS,
    (run) => (zenyMode ? run.zeny : run.exp),
    factor,
    (m) => (zenyMode ? m.perKill > 0 : (m.baseExp ?? 0) > 0),
  );
  const run = best ?? worst;
  const picked = run ? farmed.filter((row) => run.targets.includes(row.m.id)) : farmed;
  const value = (row: MapRow) => (zenyMode ? row.m.perKill * factor(row.m) : row.m.baseExp ?? 0);
  const count = headcount(picked);
  let levelSum = 0;
  let levelCount = 0;
  for (const row of picked) {
    if (row.m.level === null) continue;
    levelSum += row.m.level * row.amount;
    levelCount += row.amount;
  }
  const tagsPresent = new Set(picked.map((row) => dropTag(player.level, row.m.level)).filter((t): t is DropTag => t !== null));
  return {
    code: map.code,
    name: map.name,
    image: map.image,
    mobs: count || mobs,
    avgPerKill: count ? picked.reduce((s, row) => s + value(row) * row.amount, 0) / count : 0,
    perHour: best ? (zenyMode ? best.zenyPerHour : best.expPerHour) : null,
    avgLevel: levelCount > 0 ? levelSum / levelCount : null,
    survival: null,
    bot: run,
    sortKey: best ? (zenyMode ? best.zeny : best.exp) : -Infinity,
    top: picked
      .map((row) => ({ id: row.m.id, value: value(row), amount: row.amount }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value * b.amount - a.value * a.amount)
      .slice(0, 4),
    blockers: best ? [] : run ? runBlockers(run) : [{ id: 0, name: '', reason: 'short', theirHitPct: null, hours: 0 }],
    warnings: [],
    tags: mapTags(metOn(map, data.monsters)),
    dropTags: zenyMode ? (['halved', 'unconfirmed'] as DropTag[]).filter((t) => tagsPresent.has(t)) : [],
    fingerprint: contributors
      .map((row) => `${row.m.id}x${row.amount}`)
      .sort()
      .join(','),
    channels: 1,
    popular: false,
  };
}

export function rankMaps(
  data: FarmData,
  player: PlayerInput,
  mode: RankMode,
  opts: RankOptions,
): { ranked: RankedMap[]; blocked: RankedMap[]; hiddenLow: number } {
  const ctx = survivalContext(data);
  // Channel copies hold the same monsters on the same ground: score one and
  // reuse it (the bot search tries every ticked set, so this halves the work).
  const seen = new Map<string, RankedMap | null>();
  let scored = data.maps
    .map((map) => {
      const key = `${map.walkCells}|${map.spawns.map((s) => `${s.id}x${s.amount}`).sort().join(',')}`;
      const hit = seen.get(key);
      if (hit !== undefined) return hit ? { ...hit, code: map.code, name: map.name, image: map.image } : null;
      const out = scoreMap(map, data, player, mode, opts, ctx);
      seen.set(key, out);
      return out;
    })
    .filter((m): m is RankedMap => m !== null);
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
  const ranked = collapseChannels(scored.filter((m) => !m.blockers || m.blockers.length === 0)).map((m, i) =>
    i < POPULAR_TOP ? { ...m, popular: true } : m,
  );
  const safe = new Set(ranked.map((m) => m.fingerprint));
  const blocked = collapseChannels(scored.filter((m) => m.blockers !== null && m.blockers.length > 0 && !safe.has(m.fingerprint)));
  return { ranked, blocked, hiddenLow };
}

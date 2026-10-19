// One run of RO Zero's built-in bot on one map, the way the bot actually
// behaves (owner's settings screens, 19 Oct 2026 -- docs/GAME_MODEL.md 6.5):
//
//   - it hunts only the monsters ticked in its Monsters tab and lets every
//     other monster be: an aggressive one it was not told to hunt follows it
//     and keeps hitting, because the bot never kills it
//   - it teleports when nothing is fought for N seconds, when one hit does
//     more than X, or when N monsters are on it -- with the Creamy Card for
//     SP, or with Fly Wings from the bag
//   - it drinks the potions set in its Potion tab
//   - it goes back to town, and stays there, when the potions run out or the
//     bag reaches the weight set in its loot tab (unless told to keep hunting
//     without looting, which goes on until 90%)
//
// So the answer is a run, not a rate: how long until it stops, why, and what
// it made by then. lib/farm-engine/survival holds the per-hit numbers this
// shares with the older model (damage after DEF, FLEE under a crowd).
//
// Search between kills: monsters stand at random over the walkable cells, so
// the distance to the nearest ticked one is distributed P(d > r) =
// exp(-density x pi x r^2). The bot walks to it unless it is further than
// the idle-teleport timer lets it walk, in which case it teleports and looks
// again from a random spot.
//
// Followers: an unticked aggressive monster joins when the bot passes within
// its view range -- a strip 2 x range wide along the walk, and the circle
// round each fight. They pile up kill after kill and all drop away at the
// next teleport, so on average half a segment's worth is on the bot.

import { mobHitChance } from '../hit-flee';
import { farmedOn, secondsPerKill } from './basics';
import {
  CASTER_RANGE,
  DEFAULT_MOB_WALK,
  DEFAULT_VIEW_RANGE,
  MAX_CAST_PENALTY,
  POTION_WEIGHT_SHARE,
  REGEN_TICK_SECONDS,
  WALK_CELLS_PER_SECOND,
  crowdedFlee,
  damageTaken,
  playerDefense,
  type SurvivalContext,
} from './survival';
import type { FarmData, FarmMap, FarmMonster, MapRow, PlayerInput } from './types';

/** The bot's own settings, by the tab they sit on. */
export interface BotSettings {
  /** Basic tab: teleport when nothing is fought for this many seconds; null = off. */
  idleTeleport: number | null;
  /** Basic tab: teleport when one hit does more than this; null = off. */
  teleportOnDamage: number | null;
  /** Basic tab: teleport when this many monsters are attacking; null = off. */
  teleportOnMobs: number | null;
  /** Teleport with the Creamy Card (SP) rather than Fly Wings (zeny). */
  creamy: boolean;
  /** Loot tab: pick drops up at all. */
  loot: boolean;
  /** Loot tab: weight % at which looting stops. */
  stopWeightPct: number;
  /** Loot tab: keep hunting without looting past that weight (until 90%). */
  keepHunting: boolean;
}

/** The owner's own screens, 19 Oct 2026. */
export const DEFAULT_BOT: BotSettings = {
  idleTeleport: 5,
  teleportOnDamage: null,
  teleportOnMobs: null,
  creamy: true,
  loot: true,
  stopWeightPct: 85,
  keepHunting: true,
};

/** rAthena skill_db: Teleport costs 10 SP. Not measured in Zero. */
export const TELEPORT_SP = 10;
/** Seconds lost to a teleport while the map reloads. An estimate, not measured. */
export const TELEPORT_SECONDS = 1;
/** rAthena natural_healsp_interval. */
export const SP_TICK_SECONDS = 8;
/** Longest run reported; past this the page says "all day". */
export const MAX_RUN_HOURS = 24;
/**
 * Most monster kinds on one map the engine tries ticking combinations of,
 * the most numerous first. 2^7 runs a map keeps the AFK list under a second
 * on a laptop; past seven kinds the rest are a handful of monsters each.
 */
export const MAX_PICK = 7;
/** A kill the bot has to restart this often is not worth modelling further. */
const MIN_SUCCESS = 0.02;

export type StopReason = 'hp' | 'weight' | 'none';
export type Danger = 'one_shot' | 'burst' | 'followers' | 'unknown_atk' | 'interrupted';

export interface DangerNote {
  kind: Danger;
  id: number;
  name: string;
  damage?: number;
}

export interface BotRun {
  targets: number[];
  /** Aggressive monsters left unticked: they follow and hit, and never die. */
  followers: { id: number; name: string }[];
  killsPerHour: number;
  expPerHour: number;
  /** Zeny an hour while it loots, after potions and Fly Wings. */
  zenyPerHour: number;
  /** Seconds from one kill to the next target, teleports included. */
  searchSeconds: number;
  teleportsPerHour: number;
  /** Followers on the bot during a fight, on average. */
  avgFollowers: number;
  /** Ticked aggressive monsters fighting alongside the target, on average. */
  pileOn: number;
  potionsPerHour: number;
  potionCostPerHour: number;
  wingCostPerHour: number;
  /** Potions it sets out with: typed, else what half the max weight holds; null = no limit known. */
  potionsCarried: number | null;
  /** SP short an hour for teleporting after natural regen; <= 0 keeps up. */
  spShortPerHour: number;
  /** Hours until it goes back to town, capped at MAX_RUN_HOURS. */
  hours: number;
  stop: StopReason;
  /** Hours until looting stops; Infinity when no weight limit is known. */
  lootHours: number;
  /** EXP and zeny over the run or the window, whichever is shorter. */
  exp: number;
  zeny: number;
  /** Fatal problems: a run with any of these is not offered. */
  dangers: DangerNote[];
}

function erf(x: number): number {
  // Abramowitz-Stegun 7.1.26, |error| < 1.5e-7.
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}

/**
 * Cells walked and teleports made per kill while searching, for targets at
 * `density` a cell and a bot that teleports past `reach` cells (Infinity:
 * no idle teleport).
 */
export function searchModel(density: number, reach: number): { cells: number; teleports: number } {
  if (density <= 0) return { cells: Infinity, teleports: 0 };
  const k = Math.sqrt(density * Math.PI);
  if (reach === Infinity) return { cells: 0.5 / Math.sqrt(density), teleports: 0 };
  const walked = (Math.sqrt(Math.PI) / (2 * k)) * erf(k * reach);
  const far = Math.exp(-density * Math.PI * reach * reach);
  return { cells: walked / (1 - far), teleports: far / (1 - far) };
}

interface Hits {
  /** Landed hits a second. */
  landed: number;
  /** HP a second. */
  dps: number;
  /** One hit at the top of its ATK range, after DEF. */
  hitMax: number;
}

/** Mix of per-kind figures, weighted. */
function mix(rows: { w: number; h: Hits | undefined }[], pick: (h: Hits) => number): number {
  return rows.reduce((sum, r) => sum + r.w * (r.h ? pick(r.h) : 0), 0);
}

/** The bot on `map` hunting `targets`, its run measured against a `window` of hours. */
export function botRun(
  map: FarmMap,
  data: FarmData,
  player: PlayerInput,
  bot: BotSettings,
  targets: number[],
  ctx: SurvivalContext,
  window: number,
  dropFactor: (m: FarmMonster) => number = () => 1,
): BotRun | null {
  if (player.damage === null || player.perSecond === null || player.flee === null || player.maxHp === null) return null;
  const all = farmedOn(map, data.monsters);
  const ticked = all.filter((row) => targets.includes(row.m.id));
  const n = ticked.reduce((sum, row) => sum + row.amount, 0);
  if (n === 0) return null;

  const maxHp = player.maxHp;
  const def = playerDefense(player);
  const cells = map.walkCells ?? all.reduce((sum, row) => sum + row.amount, 0) * ctx.cellsPerMob;
  const range = (row: MapRow) => row.m.viewRange ?? DEFAULT_VIEW_RANGE;
  const aggressive = (row: MapRow) => row.m.isAggressive !== false && row.m.attackDelay !== 0;
  const circle = (row: MapRow) => (row.amount / cells) * Math.PI * range(row) ** 2;

  const reach = bot.idleTeleport !== null ? bot.idleTeleport * WALK_CELLS_PER_SECOND : Infinity;
  const search = searchModel(n / cells, reach);
  const searchSeconds = search.cells / WALK_CELLS_PER_SECOND + search.teleports * TELEPORT_SECONDS;

  const pileRows = ticked.filter(aggressive);
  const pileOn = pileRows.reduce((sum, row) => sum + circle(row), 0);
  const followRows = all.filter((row) => aggressive(row) && !targets.includes(row.m.id));
  const picked = followRows.map((row) => (row.amount / cells) * 2 * range(row) * search.cells + circle(row));
  const gainPerKill = picked.reduce((a, b) => a + b, 0);

  const dangers: DangerNote[] = [];
  for (const row of [...ticked, ...followRows]) {
    if (row.m.atk === null) dangers.push({ kind: 'unknown_atk', id: row.m.id, name: row.m.name });
  }
  if (dangers.length) return failed();

  const hitsAt = (flee: number) => {
    const out = new Map<number, Hits>();
    for (const row of [...ticked, ...followRows]) {
      const dmg = damageTaken(row.m, def) as number;
      const hitMax = damageTaken({ ...row.m, atk: row.m.atkMax ?? row.m.atk }, def) as number;
      const hitPct = row.m.flee95 === null ? 100 : mobHitChance(row.m.flee95, flee);
      const delay = row.m.attackDelay ?? ctx.attackDelay;
      const landed = delay > 0 ? (hitPct / 100) * (1000 / delay) : 0;
      out.set(row.m.id, { landed, dps: landed * dmg, hitMax });
    }
    return out;
  };

  // Followers and teleports feed each other (followers lower FLEE, which
  // raises the hits that trip teleports, which clear the followers). Three
  // rounds settle it.
  let followers = 0;
  let round = evaluate(0);
  for (let i = 0; i < 3; i++) {
    followers = round.nextFollowers;
    round = evaluate(followers);
  }
  if (gainPerKill > 0 && round.teleportsPerKill === 0 && bot.teleportOnMobs === null) {
    dangers.push({ kind: 'followers', id: followRows[0].m.id, name: followRows.map((r) => r.m.name).join(', ') });
  }
  dangers.push(...round.dangers);

  // Potions and how long they last.
  const perHour = 3600 / round.cycle;
  const regen = Math.max(1, Math.floor(maxHp / 200)) * (3600 / REGEN_TICK_SECONDS) * (round.fighting / round.cycle);
  const net = round.damage * perHour - regen;
  const potion = player.potionId !== null ? data.potions.find((x) => x.id === player.potionId) ?? null : null;
  const heal = potion ? Math.floor((potion.heal * (100 + 2 * (player.vit ?? 1))) / 100) : 0;
  const potionsPerHour = net > 0 && heal ? net / heal : 0;
  const potionCostPerHour = potionsPerHour * (potion?.price ?? 0);
  const potionsCarried = !potion
    ? null
    : player.potions ?? (player.maxWeight && potion.weight ? Math.floor((player.maxWeight * POTION_WEIGHT_SHARE) / potion.weight) : null);
  let hpHours = Infinity;
  if (net > 0 && !(potion && potionsCarried === null)) hpHours = (maxHp + (potionsCarried ?? 0) * heal) / net;

  const teleportsPerHour = round.teleportsPerKill * round.kills * perHour;
  const wingCostPerHour = bot.creamy ? 0 : teleportsPerHour * (data.flyWingPrice ?? 0);
  const spRegen = player.maxSp ? (Math.floor(player.maxSp / 100) + 1) * (3600 / SP_TICK_SECONDS) : 0;
  const spShortPerHour = bot.creamy ? teleportsPerHour * TELEPORT_SP - spRegen : 0;

  // The bag: loot in, potions out.
  let lootHours = Infinity;
  const lootRate = bot.loot ? round.loot * perHour - potionsPerHour * (potion?.weight ?? 0) : 0;
  if (player.maxWeight && lootRate > 0) {
    lootHours = Math.max(0, ((player.maxWeight * bot.stopWeightPct) / 100 - (player.weightNow ?? 0)) / lootRate);
  }

  let hours = hpHours;
  let stop: StopReason = 'hp';
  if (!bot.keepHunting && lootHours < hours) {
    hours = lootHours;
    stop = 'weight';
  }
  if (hours >= MAX_RUN_HOURS) {
    hours = MAX_RUN_HOURS;
    stop = 'none';
  }

  const costPerHour = potionCostPerHour + wingCostPerHour;
  const income = bot.loot ? round.zeny * perHour : 0;
  const span = Math.min(hours, window);
  return {
    targets,
    followers: followRows.map((row) => ({ id: row.m.id, name: row.m.name })),
    killsPerHour: round.kills * perHour,
    expPerHour: round.exp * perHour,
    zenyPerHour: income - costPerHour,
    searchSeconds,
    teleportsPerHour,
    avgFollowers: followers,
    pileOn,
    potionsPerHour,
    potionCostPerHour,
    wingCostPerHour,
    potionsCarried,
    spShortPerHour,
    hours,
    stop,
    lootHours,
    exp: round.exp * perHour * span,
    zeny: income * Math.min(span, lootHours) - costPerHour * span,
    dangers,
  };

  function evaluate(onBot: number) {
    const flee = crowdedFlee(player.flee as number, 1 + pileOn + onBot);
    const hits = hitsAt(flee);
    const pile = pileRows.map((row) => ({ w: circle(row), h: hits.get(row.m.id) }));
    const follow = followRows.map((row, i) => ({ w: gainPerKill > 0 ? (picked[i] / gainPerKill) * onBot : 0, h: hits.get(row.m.id) }));
    const limit = bot.teleportOnDamage;
    const crowdDps = mix(pile, (h) => h.dps) + mix(follow, (h) => h.dps);
    const crowdLanded = mix(pile, (h) => h.landed) + mix(follow, (h) => h.landed);
    // Followers that trip the damage limit, per second of fighting.
    const trips = limit === null ? 0 : mix(follow, (h) => (h.hitMax > limit ? h.landed : 0));

    const notes: DangerNote[] = [];
    let cycle = 0;
    let fighting = 0;
    let damage = 0;
    let retries = 0;
    let exp = 0;
    let zeny = 0;
    let loot = 0;
    for (const row of ticked) {
      const h = hits.get(row.m.id) as Hits;
      const share = row.amount / n;
      let fight = secondsPerKill(row.m, player) as number;
      let exposed = fight;
      if (player.style === 'magic') {
        const free = (Math.max(0, CASTER_RANGE - (row.m.attackRange ?? 1)) * (row.m.walkSpeed ?? DEFAULT_MOB_WALK)) / 1000;
        exposed = Math.max(0, fight - free);
        const penalty = Math.exp((h.landed + crowdLanded) / (player.perSecond as number));
        if (exposed > 0 && penalty > MAX_CAST_PENALTY) notes.push({ kind: 'interrupted', id: row.m.id, name: row.m.name });
        exposed *= penalty;
        fight = Math.min(fight, free) + exposed;
      }
      // A hit past the damage limit sends the bot away mid-fight: the kill
      // only lands if no such hit does first.
      const ownTrips = limit !== null && h.hitMax > limit ? h.landed : 0;
      const success = Math.max(Math.exp(-(ownTrips + trips) * exposed), MIN_SUCCESS);
      const attempts = 1 / success;
      const hurt = (h.dps + crowdDps) * exposed;
      cycle += share * attempts * (fight + searchSeconds);
      fighting += share * attempts * fight;
      damage += share * attempts * hurt;
      retries += share * (attempts - 1);
      exp += share * (row.m.baseExp ?? 0);
      zeny += share * row.m.perKill * dropFactor(row.m);
      loot += share * row.m.lootWeight;
      if (h.hitMax >= maxHp) notes.push({ kind: 'one_shot', id: row.m.id, name: row.m.name, damage: h.hitMax });
      else if (limit === null && hurt > maxHp) notes.push({ kind: 'burst', id: row.m.id, name: row.m.name, damage: Math.round(hurt) });
    }

    // Teleports per kill: idle searches plus aborted fights. Followers grow
    // gainPerKill a kill between teleports; a crowd limit caps them and
    // teleports once each time it is reached.
    let teleportsPerKill = search.teleports + retries;
    let nextFollowers = 0;
    if (gainPerKill > 0) {
      const segment = teleportsPerKill > 0 ? 1 / teleportsPerKill : Infinity;
      const cap = bot.teleportOnMobs !== null ? Math.max(0.5, bot.teleportOnMobs - 1 - pileOn) : Infinity;
      if (gainPerKill * segment > cap) {
        teleportsPerKill += gainPerKill / cap - (segment === Infinity ? 0 : teleportsPerKill);
        nextFollowers = cap / 2;
      } else {
        nextFollowers = segment === Infinity ? 50 : (gainPerKill * (segment + 1)) / 2;
      }
    }
    return { cycle, fighting, damage, exp, zeny, loot, kills: 1, teleportsPerKill, nextFollowers, dangers: notes };
  }

  function failed(): BotRun {
    return {
      targets,
      followers: followRows.map((row) => ({ id: row.m.id, name: row.m.name })),
      killsPerHour: 0,
      expPerHour: 0,
      zenyPerHour: 0,
      searchSeconds,
      teleportsPerHour: 0,
      avgFollowers: 0,
      pileOn,
      potionsPerHour: 0,
      potionCostPerHour: 0,
      wingCostPerHour: 0,
      potionsCarried: null,
      spShortPerHour: 0,
      hours: 0,
      stop: 'hp',
      lootHours: Infinity,
      exp: 0,
      zeny: 0,
      dangers,
    };
  }
}

/** A run the overnight lists can offer: nothing fatal, and it lasts at least an hour. */
export function usableRun(run: BotRun | null): boolean {
  return run !== null && run.dangers.length === 0 && run.hours >= 1;
}

/**
 * The ticked set worth the most over `window` hours on `map`: every
 * combination of the farmable kinds (at most 2^MAX_PICK). `score` says
 * what "worth" is -- EXP for the AFK mode, zeny for the money mode.
 */
export function bestTargets(
  map: FarmMap,
  data: FarmData,
  player: PlayerInput,
  bot: BotSettings,
  ctx: SurvivalContext,
  window: number,
  score: (run: BotRun) => number,
  dropFactor?: (m: FarmMonster) => number,
  /** Kinds worth ticking for what they give; aggressive ones are always tried too. */
  useful: (m: FarmMonster) => boolean = () => true,
): { best: BotRun | null; worst: BotRun | null } {
  // A kind that is fatal on its own (one hit kills, no ATK figure) is fatal
  // in any set: leave it out before trying combinations.
  const fatalAlone = (id: number) =>
    botRun(map, data, player, bot, [id], ctx, window, dropFactor)?.dangers.some((d) => d.id === id && (d.kind === 'one_shot' || d.kind === 'unknown_atk')) ?? false;
  const kinds = farmedOn(map, data.monsters)
    .filter((row) => useful(row.m) || (row.m.isAggressive !== false && row.m.attackDelay !== 0))
    .filter((row) => !fatalAlone(row.m.id))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, MAX_PICK)
    .map((row) => row.m.id);
  let best = null as BotRun | null;
  let fallback = null as BotRun | null;
  for (let mask = 1; mask < 1 << kinds.length; mask++) {
    const targets = kinds.filter((_, i) => mask & (1 << i));
    const run = botRun(map, data, player, bot, targets, ctx, window, dropFactor);
    if (!run) continue;
    if (usableRun(run)) {
      if (!best || score(run) > score(best)) best = run;
    } else if (!fallback || run.hours > fallback.hours) fallback = run;
  }
  return { best, worst: best ? null : fallback };
}

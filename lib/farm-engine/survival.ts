// "Will the bot live through the night here, and what will it drink doing it?"
//
// Replaces the dodge-only gate for the two overnight modes (owner, 19 Oct
// 2026: "whatever I type in, it hands me weak maps"). That gate wanted every
// monster on the map, MVP included, to miss 80-90% of the time. Only a
// full-AGI character passes it on a map worth farming, so a VIT knight, a
// priest or a caster always got the Lv 1-25 shelf. Most bots do not live by
// dodging: they live by taking hits they can afford and drinking potions.
//
// So this works out the damage the bot takes instead, from the player's FLEE,
// Max HP and DEF against each monster's ATK, hit chance and attack speed:
//
//   lands       5 + flee_95 - FLEE (lib/hit-flee), FLEE cut 10% per attacker
//               past the second (rAthena agi_penalty, as the build simulator)
//   per hit     ATK x (4000 + hard DEF) / (4000 + 10 x hard DEF) - soft DEF
//               (renewal, the same as lib/build-calc does for the player)
//   per second  one attack every AttackDelay ms -- rAthena's classic value,
//               the only public one; Zero's own is not published. Plants
//               and mushrooms never attack
//   a caster    is hit only once the monster has walked into its own range:
//               the first (9 - range) cells at the monster's walk speed are
//               free casting. After that every landed hit breaks a cast
//   pile-on     aggressive monsters within their view range of the fight join
//               it: density on the map's walkable cells x pi x range^2
//
// A map is out when one fight takes more than half the HP bar, or when the
// HP and the potions carried run out before the night is over. Slow or
// expensive maps stay in: their per-hour figure already says so.
//
// Nothing here has been measured in Zero. The page says which inputs are
// classic RO's, and the player can override the one that matters most for
// ranking, the walking time.

import { mobHitChance } from '../hit-flee';
import { canRate, farmedOn, headcount, secondsPerKill } from './basics';
import { NIGHT_HOURS, type FarmData, type FarmMap, type FarmMonster, type MapRow, type PlayerInput } from './types';

/** rAthena DEFAULT_WALK_SPEED: 150 ms a cell for a player with no speed buff. */
export const WALK_CELLS_PER_SECOND = 1000 / 150;
/** rAthena's usual view range for a monster whose own is not known. */
export const DEFAULT_VIEW_RANGE = 10;
/** rAthena natural_healhp_interval; no natural regen while walking. */
export const REGEN_TICK_SECONDS = 6;
/** One fight may take at most this share of the HP bar. */
export const BURST_SHARE = 0.5;
/** Share of max weight the potion stack may fill: past half, natural HP regen stops (rAthena). */
export const POTION_WEIGHT_SHARE = 0.5;
/** Past this, a caster spends its night restarting casts. */
export const MAX_CAST_PENALTY = 4;
/** Cells a caster's bolt reaches from (rAthena skill_db: Fire/Cold/Lightning Bolt, Soul Strike, Holy Light). */
export const CASTER_RANGE = 9;
/** rAthena's usual monster walk speed, ms a cell, when its own is not known. */
export const DEFAULT_MOB_WALK = 200;

export interface Defense {
  hard: number;
  soft: number;
}

/**
 * The status window's DEF split into the part that divides (gear) and the
 * part that subtracts (level and VIT). Soft DEF is floor((Lv + VIT)/2 +
 * AGI/5) (GAME_MODEL 8.6, measured); AGI is read back from FLEE = 100 + Lv +
 * AGI + LUK/5, which counts LUK/5 as AGI -- a point or two of soft DEF.
 * A blank DEF is no gear: soft DEF only.
 */
export function playerDefense(player: PlayerInput): Defense {
  const level = player.level ?? 1;
  const vit = player.vit ?? 1;
  const agi = player.flee !== null ? Math.max(0, player.flee - 100 - level) : 0;
  const estimate = Math.floor((level + vit) / 2 + agi / 5);
  if (player.def === null) return { hard: 0, soft: estimate };
  const soft = Math.min(estimate, player.def);
  return { hard: player.def - soft, soft };
}

/** One landed hit after DEF; null when the monster's ATK is unknown. */
export function damageTaken(m: FarmMonster, def: Defense): number | null {
  if (m.atk === null) return null;
  return Math.max(1, Math.floor((m.atk * (4000 + def.hard)) / (4000 + 10 * def.hard)) - def.soft);
}

/** FLEE left with this many attackers (fractional: an average over the night). */
export function crowdedFlee(flee: number, attackers: number): number {
  return Math.max(0, flee * (1 - 0.1 * Math.max(0, attackers - 2)));
}

/** The survival model needs a kill speed, FLEE and Max HP; DEF, VIT and potions refine it. */
export function canSurvive(player: PlayerInput): boolean {
  return canRate(player) && player.flee !== null && player.maxHp !== null;
}

/** Medians the model falls back on, worked out once per payload. */
export interface SurvivalContext {
  attackDelay: number;
  cellsPerMob: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

export function survivalContext(data: FarmData): SurvivalContext {
  // 0 is a monster that never attacks: not a speed to average.
  const delays = Object.values(data.monsters)
    .map((m) => m.attackDelay)
    .filter((d): d is number => d !== null && d > 0);
  const spacing: number[] = [];
  for (const map of data.maps) {
    const mobs = headcount(farmedOn(map, data.monsters));
    if (map.walkCells && mobs > 0) spacing.push(map.walkCells / mobs);
  }
  return { attackDelay: delays.length ? median(delays) : 1500, cellsPerMob: spacing.length ? median(spacing) : 300 };
}

/**
 * Seconds from one kill to the next target: the mean distance to the nearest
 * of N monsters spread over the walkable cells (0.5 / sqrt(density) for a
 * random spread) at a player's walking speed. Ignores walls between them and
 * other players taking kills, so it is a floor; the player can type their own.
 */
export function walkSeconds(map: FarmMap, mobs: number, player: PlayerInput, ctx: SurvivalContext): number {
  if (player.walkSeconds !== null) return player.walkSeconds;
  if (mobs <= 0) return 0;
  const cellsPerMob = map.walkCells ? map.walkCells / mobs : ctx.cellsPerMob;
  return (0.5 * Math.sqrt(cellsPerMob)) / WALK_CELLS_PER_SECOND;
}

export type BlockReason = 'burst' | 'runs_out' | 'unknown_atk' | 'interrupted' | 'dodge' | 'unknown_flee';

export interface Blocker {
  id: number;
  name: string;
  reason: BlockReason;
  /** dodge: % it lands on the player. */
  theirHitPct: number | null;
  /** burst: HP one fight with it costs. */
  damage?: number;
  /** runs_out: hours until HP and potions are gone. */
  hours?: number;
}

export interface MapSurvival {
  blockers: Blocker[];
  walkSeconds: number;
  /** Aggressive monsters fighting alongside the target, on average. */
  extraAttackers: number;
  /** FLEE after the pile-on penalty. */
  fleeUsed: number;
  /** HP lost an hour after natural regen; <= 0 means the bot never drinks. */
  netDamagePerHour: number;
  potionsPerHour: number;
  potionCostPerHour: number;
  /** Potions the bot sets out with: typed, else what half the max weight holds; null = no limit known. */
  potionsCarried: number | null;
  /** Hours until HP and carried potions are gone; Infinity when it never loses ground. */
  hoursAlive: number;
  /** Seconds a fight with each farmed monster takes, cast restarts included. */
  fightSeconds: Map<number, number>;
  /** The fight that hurts most. */
  worst: { id: number; name: string; damage: number; hitPct: number } | null;
  /** Monsters whose attack speed is the median stand-in. */
  assumedDelay: string[];
  /** Monsters with no flee_95: counted as always landing. */
  assumedFlee: string[];
}

interface Threat {
  row: MapRow;
  hitPct: number;
  /** Landed hits a second. */
  landed: number;
  /** HP a second. */
  dps: number;
}

export function mapSurvival(map: FarmMap, data: FarmData, player: PlayerInput, ctx: SurvivalContext): MapSurvival | null {
  if (!canSurvive(player)) return null;
  const farmed = farmedOn(map, data.monsters);
  const mobs = headcount(farmed);
  if (mobs === 0) return null;
  const maxHp = player.maxHp as number;
  const flee = player.flee as number;
  const def = playerDefense(player);
  const walk = walkSeconds(map, mobs, player, ctx);
  const cells = map.walkCells ?? mobs * ctx.cellsPerMob;

  // Unknown aggression counts as aggressive, as everywhere in the farm tool.
  const aggressive = farmed.filter((row) => row.m.isAggressive !== false);
  const joining = (row: MapRow) => (row.amount / cells) * Math.PI * (row.m.viewRange ?? DEFAULT_VIEW_RANGE) ** 2;
  const extraAttackers = aggressive.reduce((sum, row) => sum + joining(row), 0);
  const fleeUsed = crowdedFlee(flee, 1 + extraAttackers);

  const blockers: Blocker[] = [];
  const assumedDelay: string[] = [];
  const assumedFlee: string[] = [];
  const threats = new Map<number, Threat>();
  for (const row of farmed) {
    const dmg = damageTaken(row.m, def);
    if (dmg === null) {
      blockers.push({ id: row.m.id, name: row.m.name, reason: 'unknown_atk', theirHitPct: null });
      continue;
    }
    if (row.m.attackDelay === null) assumedDelay.push(row.m.name);
    if (row.m.flee95 === null) assumedFlee.push(row.m.name);
    const hitPct = row.m.flee95 === null ? 100 : mobHitChance(row.m.flee95, fleeUsed);
    const delay = row.m.attackDelay ?? ctx.attackDelay;
    const perSecond = delay > 0 ? 1000 / delay : 0;
    const landed = (hitPct / 100) * perSecond;
    threats.set(row.m.id, { row, hitPct, landed, dps: landed * dmg });
  }
  if (blockers.length > 0) {
    return {
      blockers,
      walkSeconds: walk,
      extraAttackers,
      fleeUsed,
      netDamagePerHour: 0,
      potionsPerHour: 0,
      potionCostPerHour: 0,
      potionsCarried: null,
      hoursAlive: 0,
      fightSeconds: new Map(),
      worst: null,
      assumedDelay,
      assumedFlee,
    };
  }

  let extraDps = 0;
  let extraLanded = 0;
  for (const row of aggressive) {
    const t = threats.get(row.m.id) as Threat;
    extraDps += joining(row) * t.dps;
    extraLanded += joining(row) * t.landed;
  }

  const fightSeconds = new Map<number, number>();
  let worst: MapSurvival['worst'] = null;
  let cycle = 0;
  let fighting = 0;
  let damage = 0;
  for (const t of threats.values()) {
    let seconds = secondsPerKill(t.row.m, player) as number;
    // The part of the fight the monster can hit back in.
    let exposed = seconds;
    if (player.style === 'magic') {
      const reach = Math.max(0, CASTER_RANGE - (t.row.m.attackRange ?? 1));
      const free = (reach * (t.row.m.walkSpeed ?? DEFAULT_MOB_WALK)) / 1000;
      exposed = Math.max(0, seconds - free);
      // A landed hit breaks the cast and it starts again. Hits arrive at
      // random, so the chance a cast of c seconds goes through is
      // exp(-rate x c) and the casts needed grow by exp(rate x c). The whole
      // cast-plus-delay counts as breakable: a ceiling on the penalty.
      const penalty = Math.exp((t.landed + extraLanded) / (player.perSecond as number));
      if (exposed > 0 && penalty > MAX_CAST_PENALTY) {
        blockers.push({ id: t.row.m.id, name: t.row.m.name, reason: 'interrupted', theirHitPct: Math.round(t.hitPct) });
      }
      exposed *= penalty;
      seconds = Math.min(seconds, free) + exposed;
    }
    fightSeconds.set(t.row.m.id, seconds);
    const hurt = (t.dps + extraDps) * exposed;
    if (!worst || hurt > worst.damage) worst = { id: t.row.m.id, name: t.row.m.name, damage: hurt, hitPct: t.hitPct };
    const share = t.row.amount / mobs;
    cycle += share * (seconds + walk);
    fighting += share * seconds;
    damage += share * hurt;
  }

  if (worst && worst.damage > BURST_SHARE * maxHp) {
    blockers.push({ id: worst.id, name: worst.name, reason: 'burst', theirHitPct: Math.round(worst.hitPct), damage: Math.round(worst.damage) });
  }

  const perHour = 3600 / cycle;
  const regenPerHour = Math.max(1, Math.floor(maxHp / 200)) * (3600 / REGEN_TICK_SECONDS) * (fighting / cycle);
  const netDamagePerHour = damage * perHour - regenPerHour;

  const potion = player.potionId !== null ? data.potions.find((p) => p.id === player.potionId) ?? null : null;
  // rAthena: a potion heals 2% more per point of VIT.
  const healEach = potion ? Math.floor((potion.heal * (100 + 2 * (player.vit ?? 1))) / 100) : null;
  const potionsPerHour = netDamagePerHour > 0 && healEach ? netDamagePerHour / healEach : 0;
  const potionCostPerHour = potionsPerHour * (potion?.price ?? 0);

  // The stack: what the player typed, else what fits in half the max weight
  // (past half, natural regen stops), else unknown -- and unknown is no limit,
  // with the night's total on the card for the player to judge.
  const potionsCarried = !potion
    ? null
    : player.potions ?? (player.maxWeight && potion.weight ? Math.floor((player.maxWeight * POTION_WEIGHT_SHARE) / potion.weight) : null);

  let hoursAlive = Infinity;
  if (netDamagePerHour > 0) {
    if (healEach && potionsCarried === null) hoursAlive = Infinity;
    else hoursAlive = (maxHp + (healEach && potionsCarried ? potionsCarried * healEach : 0)) / netDamagePerHour;
  }
  if (hoursAlive < NIGHT_HOURS) {
    const by = worst as NonNullable<typeof worst>;
    blockers.push({ id: by.id, name: by.name, reason: 'runs_out', theirHitPct: null, hours: hoursAlive });
  }

  return {
    blockers,
    walkSeconds: walk,
    extraAttackers,
    fleeUsed,
    netDamagePerHour,
    potionsPerHour,
    potionCostPerHour,
    potionsCarried,
    hoursAlive,
    fightSeconds,
    worst,
    assumedDelay,
    assumedFlee,
  };
}

// The farm tool's data and inputs, shared by all four modes (spec:
// docs/superpowers/specs/2026-09-11-farm-tool-integration-design.md).
//
// One payload feeds every mode so the same monster can never carry two
// different numbers on two tabs -- which is what happened when the plan read a
// database view and the zeny mode computed its own.

import type { RiskySkill } from '../afk-safety';

/** A drop with both a rate and a price. rate is a PERCENT: 70 means 70%. */
export interface PricedDrop {
  rate: number;
  sell: number;
}

export interface FarmMonster {
  id: number;
  name: string;
  level: number | null;
  /** null for the importer's unknown-HP marker. */
  hp: number | null;
  /** null for the unknown-EXP marker (0 in the table). */
  baseExp: number | null;
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
  /** Expected zeny per kill over every priced drop, before any level penalty. */
  perKill: number;
  best: { name: string; icon: string | null; category: string | null; value: number } | null;
  risks: RiskySkill[];
  /** Average of the physical attack range; null when the table has none. */
  atk: number | null;
  /** Top of the range: what a bot's "teleport when hit for more than" setting is tripped by. */
  atkMax: number | null;
  /** Expected weight picked up per kill, over every drop with a rate (priced or not). */
  lootWeight: number;
  /** ms between its attacks, from rAthena (classic RO); 0 never attacks (plants); null when rAthena has no such monster. */
  attackDelay: number | null;
  /** Cells an aggressive one sees a player from (rAthena view range); null when unknown. */
  viewRange: number | null;
  /** ms it takes to walk one cell (rAthena); null when unknown. */
  walkSpeed: number | null;
  /** Cells it attacks from (rAthena); null when unknown. */
  attackRange: number | null;
  /** Every hit does 1 damage, whatever the player's damage: plants and mushrooms. */
  oneDamage: boolean;
  /** Attack skills it casts on the player (rAthena mob_skill_db; data/mob-skills.json). */
  skills: MobSkill[];
  /** Its magic hit as a share of its ATK (rAthena MATK / ATK); null when it casts no magic. */
  magicRatio: number | null;
}

/** One attack skill a monster casts, from rAthena (scripts/build-mob-skills.mjs). */
export interface MobSkill {
  /** 0 weapon, FLEE applies; 1 weapon ignoring FLEE; 2 always critical (no FLEE, no DEF); 3 magic (no FLEE, no DEF). */
  kind: 0 | 1 | 2 | 3;
  /** Damage ratio, 100 = one normal hit. */
  ratio: number;
  hits: number;
  /** Chance per attack it would make, out of 10,000. */
  rate: number;
  /** Cooldown, ms. */
  delay: number;
  /** Extra hit chance, % of the normal one (NPC_ attribute attacks: 20). */
  hitBonus: number;
  /** Share of a fight its condition holds (1, or X/100 for "HP below X%"). */
  share: number;
}

export interface FarmSpawn {
  id: number;
  /** null where no source lists a count: unknown, not one. */
  amount: number | null;
}

export interface FarmMap {
  /** Canonical code; channel copies are folded, largest known count kept. */
  code: string;
  name: string;
  image: string | null;
  spawns: FarmSpawn[];
  /** Walkable cells, counted from the map's .gat in the client; null when the client has no file under this code. */
  walkCells: number | null;
}

/** An HP potion the bot can carry: what it heals before VIT, what it costs, what it weighs. */
export interface FarmPotion {
  id: number;
  name: string;
  icon: string | null;
  heal: number;
  price: number | null;
  weight: number | null;
}

export interface FarmData {
  /** Every non-Challenge monster, including ones on no walk-in map (the plan can hold any). */
  monsters: Record<number, FarmMonster>;
  /** Walk-in maps only. */
  maps: FarmMap[];
  /** closedMaps: walk-in maps left out because they are not open on Global yet. */
  excluded: { mvp: number; solo: number; closedMaps: number };
  coverage: { pricedItems: number; totalItems: number; ratedDrops: number; totalDrops: number };
  potions: FarmPotion[];
  /** NPC price of a Fly Wing, for bots teleporting without the Creamy Card. */
  flyWingPrice: number | null;
}

export type BotStyle = 'melee' | 'magic';

export interface PlayerInput {
  style: BotStyle;
  level: number | null;
  damage: number | null;
  /** Attacks per second (melee) or casts per second (magic). */
  perSecond: number | null;
  /** Melee only; null for magic. */
  hit: number | null;
  flee: number | null;
  /** The survival model's inputs (lib/farm-engine/survival); all optional. */
  maxHp: number | null;
  /** DEF as the status window shows it. */
  def: number | null;
  vit: number | null;
  /** The HP potion the bot drinks, by item id, and how many it carries. */
  potionId: number | null;
  potions: number | null;
  /** Max weight from the status window; sizes the potion stack when the count is blank. */
  maxWeight: number | null;
  /** Weight already carried when the bot sets out (status window). */
  weightNow: number | null;
  /** Max SP: natural SP regen for Creamy Card teleports. */
  maxSp: number | null;
  /** Seconds the bot walks between kills; null works it out from the map. */
  walkSeconds: number | null;
}

/** A monster standing on a map, with its count (0 when unknown). */
export interface MapRow {
  m: FarmMonster;
  amount: number;
}

export const NIGHT_HOURS = 8;
/** A drop a whole night would see fewer times than this is luck, not income. */
export const STEADY_DROPS_PER_NIGHT = 3;
/** Fewer monsters than this and the bot spends the night walking. */
export const MIN_MOBS = 10;
/**
 * The level mode's band while the player's damage is unknown (28 Oct 2026).
 * Zero takes nothing off EXP for a level gap (docs/GAME_MODEL.md), so this is
 * only a stand-in for "probably too strong": full weight from LEVEL_BELOW
 * under to LEVEL_FLAT_ABOVE over, tapering to nothing at LEVEL_ABOVE over.
 * It replaced a ±15 taper that hid gef_fild06 (Lv 84-91) from the Lv 60s
 * who level there.
 */
export const LEVEL_BELOW = 10;
export const LEVEL_FLAT_ABOVE = 15;
export const LEVEL_ABOVE = 30;
/** With damage filled in, the level mode fights what dies in this many hits... */
export const MAX_HITS_TO_KILL = 15;
/** ...and what the player lands this % of swings on. */
export const MIN_HIT_PERCENT = 70;
export const DEFAULT_LEVEL = 50;

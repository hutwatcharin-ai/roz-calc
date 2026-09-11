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
}

export interface FarmData {
  /** Every non-Challenge monster, including ones on no walk-in map (the plan can hold any). */
  monsters: Record<number, FarmMonster>;
  /** Walk-in maps only. */
  maps: FarmMap[];
  /** closedMaps: walk-in maps left out because they are not open on Global yet. */
  excluded: { mvp: number; solo: number; closedMaps: number };
  coverage: { pricedItems: number; totalItems: number; ratedDrops: number; totalDrops: number };
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
/** Level taper width for the level mode (reproduces prontera.info's order). */
export const LEVEL_SPAN = 15;
export const DEFAULT_LEVEL = 50;

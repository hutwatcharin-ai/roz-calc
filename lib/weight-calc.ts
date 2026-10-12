// The maths behind /tools/weight (owner, 12 Oct 2026): how much a character
// can carry, what the picked things weigh, and how much room is left before
// the two lines the game draws -- 70% (natural HP/SP regen stops) and 90%
// (no attacks, no skills), both confirmed in game by the owner.
//
// The cap is the simulator's (lib/build-calc): 2,000 + 30 per point of STR
// the player put in (job and gear STR do not count) + the class bonus +
// Enlarge Weight Limit, checked against the owner's Blacksmith (5,030). The
// Gym Membership Card adds 200 a use up to 10 (docs/GAME_MODEL.md).
//
// Weights are the numbers the game shows and some are 0.1 (an Arrow), so
// sums run in tenths to keep 0.1 + 0.2 from drifting.

import { classStats } from '@/lib/class-stats';

export const REGEN_LINE = 70;
export const ATTACK_LINE = 90;
export const GYM_PER_USE = 200;
export const EWL_PER_LEVEL = 200;
/** Classes that have Enlarge Weight Limit (the Merchant line). */
export const EWL_CLASSES = new Set(['merchant', 'blacksmith', 'alchemist']);

export interface CapInput {
  cls: string;
  /** STR the player put in (1-99). */
  str: number;
  /** Enlarge Weight Limit level, 0-10; ignored for classes without it. */
  ewl: number;
  /** Gym Membership Card uses, 0-10. */
  gym: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.floor(Number.isFinite(v) ? v : lo)));

export function weightCap({ cls, str, ewl, gym }: CapInput): number {
  const bonus = classStats(cls)?.weightBonus ?? 0;
  const enlarge = EWL_CLASSES.has(cls) ? clamp(ewl, 0, 10) * EWL_PER_LEVEL : 0;
  return 2000 + clamp(str, 1, 99) * 30 + bonus + enlarge + clamp(gym, 0, 10) * GYM_PER_USE;
}

const tenths = (w: number) => Math.round(w * 10);

export interface Carried {
  weight: number;
  qty: number;
}

export interface Load {
  cap: number;
  total: number;
  left: number;
  /** Share of the cap carried, in percent (can pass 100). */
  pct: number;
  regen: boolean;
  attack: boolean;
}

export function load(cap: number, rows: Carried[]): Load {
  const t = rows.reduce((s, r) => s + tenths(r.weight) * clamp(r.qty, 0, 1_000_000), 0);
  const total = t / 10;
  return {
    cap,
    total,
    left: Math.round((cap * 10 - t)) / 10,
    pct: cap > 0 ? (t / (cap * 10)) * 100 : 0,
    regen: t * 100 < cap * 10 * REGEN_LINE,
    attack: t * 100 < cap * 10 * ATTACK_LINE,
  };
}

/** How many more of an item fit while the load stays under `line` percent of the cap. */
export function roomUnder(cap: number, total: number, weight: number, line: number): number {
  const w = tenths(weight);
  if (w <= 0) return Infinity;
  // Stay strictly below the line: total + n*w < cap*line/100, all in tenths*100.
  const limit = cap * 10 * line;
  const now = tenths(total) * 100;
  if (now >= limit) return 0;
  return Math.max(0, Math.ceil((limit - now) / (w * 100)) - 1);
}

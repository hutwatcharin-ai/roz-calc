// Stat points, Job bonuses, HP/SP and base ASPD per class
// (data/class-stats.json, scripts/build-class-stats.py, from roz.prontera.info).
//
// Point rules (prontera's stat planner, and the same budget the Blacksmith
// advice of 6 Oct 2026 used): 48 points at Lv 1, floor((L-1)/5)+3 more at each
// level L, and raising a stat from x to x+1 costs floor((x-1)/10)+2.

import file from '@/data/class-stats.json';

export type Stat = 'str' | 'agi' | 'vit' | 'int' | 'dex' | 'luk';
export const STATS: Stat[] = ['str', 'agi', 'vit', 'int', 'dex', 'luk'];

interface ClassStats {
  name: string;
  tier: string;
  jobBonuses: [number, Stat][];
  hp: number[];
  sp: number[];
  aspd: Record<string, number>;
  shieldPenalty: number;
  weightBonus: number;
}

const data = file as unknown as {
  _meta: { hpSpMeasured: string[]; aspdCap: number };
  constants: { starting_points: number; points_per_level_base: number; points_level_divisor: number; raise_cost_base: number; raise_cost_divisor: number; max_base_level: number; max_value: number };
  classes: Record<string, ClassStats>;
};
const K = data.constants;

export const ASPD_CAP = data._meta.aspdCap;

export function classStats(slug: string): ClassStats | null {
  return data.classes[slug] ?? null;
}

/** Points to spend at a base level. */
export function statBudget(level: number): number {
  let total = K.starting_points;
  for (let l = 2; l <= level; l++) total += Math.floor((l - 1) / K.points_level_divisor) + K.points_per_level_base;
  return total;
}

/** Points to raise one stat from 1 to `value`. */
export function statCost(value: number): number {
  let total = 0;
  for (let x = 1; x < value; x++) total += Math.floor((x - 1) / K.raise_cost_divisor) + K.raise_cost_base;
  return total;
}

/** The lowest base level whose budget covers `points`; null past the cap. */
export function minLevelFor(points: number): number | null {
  for (let l = 1; l <= K.max_base_level; l++) if (statBudget(l) >= points) return l;
  return null;
}

/** Stats a Job level adds, counted per stat. */
export function jobBonusAt(slug: string, jobLevel: number): Record<Stat, number> {
  const out: Record<Stat, number> = { str: 0, agi: 0, vit: 0, int: 0, dex: 0, luk: 0 };
  for (const [lv, stat] of classStats(slug)?.jobBonuses ?? []) if (lv <= jobLevel) out[stat] += 1;
  return out;
}

/**
 * Status windows read in game, naked, used to correct a class's estimated
 * HP/SP curve: base = shown / (1 + VIT or INT / 100). The whole curve is
 * scaled by measured / table at that level -- one point, so between levels
 * it is still an estimate, but no longer 14% high.
 */
const READINGS: Record<string, { level: number; hp: number; sp: number; note: string }> = {
  // Owner's Blacksmith, 7 Oct 2026: Lv 60, VIT 6, INT 6, HP 1,840, SP 231.
  blacksmith: { level: 60, hp: 1736, sp: 218, note: 'owner status window, 7 Oct 2026' },
};

/**
 * Base HP/SP at a base level. `measured`: prontera measured the class
 * (Acolyte, Thief); `calibrated`: scaled to a reading of our own; neither
 * means prontera's estimate, which may read 20-25% high.
 */
export function baseHpSp(slug: string, level: number): { hp: number; sp: number; measured: boolean; calibrated: boolean } | null {
  const c = classStats(slug);
  if (!c || level < 1 || level > c.hp.length) return null;
  const r = READINGS[slug];
  const hpF = r ? r.hp / c.hp[r.level - 1] : 1;
  const spF = r ? r.sp / c.sp[r.level - 1] : 1;
  return {
    hp: Math.round(c.hp[level - 1] * hpF),
    sp: Math.round(c.sp[level - 1] * spF),
    measured: data._meta.hpSpMeasured.includes(slug),
    calibrated: !!r,
  };
}

/**
 * ASPD before gear and buffs: base_aspd − shield + √(AGI²/2 + DEX²/d)/4,
 * d = 7 for ranged weapons, 5 otherwise; capped at 190. Not measured in game
 * by prontera, and the base values come from another server's tables.
 */
export function aspdFor(slug: string, weapon: string, agi: number, dex: number, opts: { ranged?: boolean; shield?: boolean } = {}): number | null {
  const c = classStats(slug);
  const base = c?.aspd[weapon];
  if (!c || base === undefined) return null;
  const raw = base - (opts.shield ? c.shieldPenalty : 0) + Math.sqrt((agi * agi) / 2 + (dex * dex) / (opts.ranged ? 7 : 5)) / 4;
  return Math.min(ASPD_CAP, Math.floor(raw * 10) / 10);
}

/**
 * A number in a guide's stat cell: "63", "~15 ตั้งแต่ต้น", "90-99" (the low
 * end), "48 (พื้นฐาน)". Words ("หลัก", "ที่เหลือ") give null.
 */
export function statFromText(text: string | undefined): number | null {
  if (!text) return null;
  const m = /^\s*~?\s*(\d{1,2})(?!\d)/.exec(text);
  if (!m) return null;
  const n = Number(m[1]);
  return n >= 1 && n <= K.max_value ? n : null;
}

/**
 * The lowest base level a guide's stat row could be built at, from the stats
 * it gives as numbers (the rest taken as 1). Job bonuses are not taken off: a
 * row read from the status window includes them. null when fewer than two
 * stats are numbers -- one number says nothing about a budget.
 */
export function rowMinLevel(row: Partial<Record<Stat, string>>): { level: number | null; points: number; complete: boolean } | null {
  const values = STATS.map((s) => statFromText(row[s]));
  const known = values.filter((v): v is number => v !== null);
  if (known.length < 2) return null;
  const points = known.reduce((sum, v) => sum + statCost(v), 0);
  return { level: minLevelFor(points), points, complete: known.length === 6 };
}

/** Weapon types in the ASPD tables, in Thai. */
export const WEAPON_TH: Record<string, string> = {
  bare_hand: 'มือเปล่า', dagger: 'มีด', sword_1h: 'ดาบมือเดียว', sword_2h: 'ดาบสองมือ', spear_1h: 'หอกมือเดียว', spear_2h: 'หอกสองมือ',
  axe_1h: 'ขวานมือเดียว', axe_2h: 'ขวานสองมือ', mace: 'กระบอง', staff_1h: 'ไม้เท้า', staff_2h: 'ไม้เท้าสองมือ', bow: 'ธนู',
  knuckle: 'สนับมือ', instrument: 'เครื่องดนตรี', whip: 'แส้', book: 'หนังสือ', katar: 'คาตาร์',
};
export const RANGED_WEAPONS = new Set(['bow', 'instrument', 'whip']);

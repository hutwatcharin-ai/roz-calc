// The farm bar's character numbers from the status window (owner picked the
// tabbed bar, 30 Oct 2026): class, levels, weapon type and the six stats as
// the game shows them ("57+19"), plus buffs and food. calcBuild does the
// sums, so HIT, FLEE, ASPD and Max HP agree with /tools/build.
//
// Damage per hit is not worked out from the window: it needs the weapon
// item. It comes from a saved build, or the player types it.

import {
  calcBuild,
  decodeBuild,
  SAVED_BUILDS_KEY,
  type Build,
  type Target,
} from '@/lib/build-calc';
import { classStats, STATS, type Stat } from '@/lib/class-stats';
import type { PlayerNumbers, StorageLike } from '@/lib/player-numbers';

export const FARM_WINDOW_KEY = 'roz-calc:farm-window';

export interface FarmWindow {
  cls: string;
  lv: number;
  job: number;
  /** Weapon type key of the ASPD table (WEAPON_TH). */
  wt: string;
  /** The left number of each stat: points put in. */
  st: Record<Stat, number>;
  /** The right number: the bonus the window shows (job, gear, cards). */
  xb: Record<Stat, number>;
  /** Buffs from others or own skills: slug -> level. */
  bf: Record<string, number>;
  /** Food item ids. */
  f: number[];
}

const ones = () => Object.fromEntries(STATS.map((s) => [s, 1])) as Record<Stat, number>;
const zeros = () => Object.fromEntries(STATS.map((s) => [s, 0])) as Record<Stat, number>;

export const EMPTY_WINDOW: FarmWindow = { cls: 'swordsman', lv: 50, job: 40, wt: 'bare_hand', st: ones(), xb: zeros(), bf: {}, f: [] };

const int = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : dflt;
};

/** A stored window back into shape; null when it is not one. */
export function sanitizeWindow(raw: any): FarmWindow | null {
  if (!raw || typeof raw !== 'object' || !classStats(String(raw.cls))) return null;
  const cls = String(raw.cls);
  const wt = typeof raw.wt === 'string' && classStats(cls)?.aspd[raw.wt] !== undefined ? raw.wt : 'bare_hand';
  return {
    cls,
    lv: int(raw.lv, 1, 99, 50),
    job: int(raw.job, 1, 70, 40),
    wt,
    st: Object.fromEntries(STATS.map((s) => [s, int(raw.st?.[s], 1, 99, 1)])) as Record<Stat, number>,
    xb: Object.fromEntries(STATS.map((s) => [s, int(raw.xb?.[s], 0, 200, 0)])) as Record<Stat, number>,
    bf: Object.fromEntries(
      Object.entries(raw.bf && typeof raw.bf === 'object' ? raw.bf : {})
        .map(([k, v]) => [k, int(v, 0, 10, 0)] as const)
        .filter(([, v]) => v > 0),
    ),
    f: Array.isArray(raw.f) ? raw.f.map(Number).filter((n: number) => Number.isInteger(n) && n > 0).slice(0, 10) : [],
  };
}

export function readWindow(storage: StorageLike | null): FarmWindow | null {
  try {
    return sanitizeWindow(JSON.parse(storage?.getItem(FARM_WINDOW_KEY) ?? 'null'));
  } catch {
    return null;
  }
}

export function writeWindow(storage: StorageLike | null, w: FarmWindow): void {
  try {
    storage?.setItem(FARM_WINDOW_KEY, JSON.stringify(w));
  } catch {
    // Private mode: the window just is not remembered.
  }
}

export function windowBuild(w: FarmWindow): Build {
  return { cls: w.cls, lv: w.lv, job: w.job, st: w.st, xb: w.xb, wt: w.wt, g: {}, f: w.f, bf: w.bf };
}

/** What the farm tool reads, from the window. No damage: see the top. */
export function windowNumbers(w: FarmWindow): PlayerNumbers {
  const r = calcBuild(windowBuild(w));
  const out: PlayerNumbers = { level: w.lv, hit: r.hit, flee: r.flee, vit: r.total.vit };
  if (r.aspd !== null) out.aspd = r.aspd;
  if (r.hp !== null) out.maxHp = r.hp;
  if (r.sp !== null) out.maxSp = r.sp;
  return out;
}

// A monster with nothing to resist with, so a build's damage is its own:
// neutral, medium, no DEF. The farm tool takes one damage figure for every
// monster, the way a player reads it off a training dummy.
const DUMMY: Target = {
  name: '', level: 1, vit: 0, def: 0, size: 'Medium', element: 'Neutral', element_level: 1, race: 'Formless',
  boss: false, hit_100: null, flee_95: null, mdef: 0,
};

/** What the farm tool reads, from a build of /tools/build, damage included. */
export function buildNumbers(build: Build): PlayerNumbers {
  const r = calcBuild(build, DUMMY);
  const out: PlayerNumbers = { level: build.lv, hit: r.hit, flee: r.flee, vit: r.total.vit, def: r.def.hard + r.def.soft };
  if (r.aspd !== null) out.aspd = r.aspd;
  if (r.hp !== null) out.maxHp = r.hp;
  if (r.sp !== null) out.maxSp = r.sp;
  const dmg = r.vs?.damage;
  if (dmg != null && dmg > 0) out.damagePerHit = Math.round(dmg);
  return out;
}

export interface SavedBuildRef {
  name: string;
  build: Build;
}

/** The builds saved on /tools/build in this browser. */
export function readSavedBuilds(storage: StorageLike | null): SavedBuildRef[] {
  try {
    const list = JSON.parse(storage?.getItem(SAVED_BUILDS_KEY) ?? '[]');
    if (!Array.isArray(list)) return [];
    return list
      .map((x) => ({ name: String(x?.name ?? ''), build: decodeBuild(x?.b) }))
      .filter((x): x is SavedBuildRef => !!x.name && !!x.build);
  } catch {
    return [];
  }
}

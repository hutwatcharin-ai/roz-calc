// The damage chain the build simulator uses since 15 Oct 2026 (owner: "follow
// theirs"), after Landgris's RO Calculator in ROZ Global mode
// (landgris.github.io/ROCalculator/?zero). Its live formulas sit on a private
// server; the steps below follow the version the author published before the
// move (git cee02b4), which reproduces the live server exactly on the eight
// cases captured on 15 Oct 2026 (lib/damage-staged.test.ts). Written here from
// that description, not copied.
//
// What changed against the older chain in lib/damage.ts:
//   - weapon ATK grows with STR (DEX for bows, instruments, whips): × (1 + STR/200)
//   - race / size / element / boss / "all" lines multiply the weapon part only;
//     status ATK joins afterwards, so cards do not scale it
//   - ATK% is its own branch of the weapon part, added beside the card part
//   - mastery is added before the skill ratio, so a skill scales it
//   - every multiply rounds the way the game's helper does (mulOper)
//   - a negative hit count means the formula is the total, shown as n hits
// None of this has been checked in Global by us; the author's own sources are
// Taiwan's server and his test captures.

/** The rounding helper: floor, except a multiplier under 1 rounds up when it leaves a fraction. */
export function mulOper(value: number, percent: number): number {
  const s = Math.round(value * (percent * 100));
  let r = Math.floor(s / 100);
  if (percent < 1 && s % 100 !== 0) r += 1;
  return r;
}

export interface PhysicalInput {
  /** The weapon's own ATK, before refine. */
  weaponAtk: number;
  /** Weapon level 1-4 (bare hand counts as 1). */
  weaponLevel: number;
  /** STR, or DEX for a bow, instrument or whip. */
  weaponStat: number;
  /** ATK from the weapon's refine. */
  refineAtk: number;
  /** Size table % for this weapon against the target (100 = none). */
  sizePct: number;
  /** Flat ATK from gear and cards. */
  equipAtk: number;
  /** Each kind of targeted damage line (race, size, element, boss, all), summed within its kind, in %. */
  kinds: number[];
  /** ATK % lines. */
  atkPercent: number;
  /** Attack element against the target, % (100 = neutral matchup). */
  elementPct: number;
  /** Status ATK and how many times it counts (2 for a right-hand hit or a skill, 1 for a left-hand swing). */
  statusAtk: number;
  statusTimes: number;
  /** Neutral against the target, %: the status part's element. */
  neutralPct: number;
  /** Flat mastery ATK (Sword Mastery, Demon Bane...). */
  mastery: number;
  /** Ranged damage % (bows, or a ranged skill). */
  rangedPct: number;
  /** Skill damage %, or null for an auto-attack. */
  skillPercent: number | null;
  /** Skill damage % lines from gear (only on skills). */
  skillDamagePct: number;
  /** Target hard DEF after any ignore / Provoke, and its soft DEF. */
  hardDef: number;
  softDef: number;
  /** Ignore DEF entirely (the falcon, Investigate-like skills). */
  noDef?: boolean;
  /** Crit: top of the weapon roll and the crit multiplier. */
  crit?: boolean;
  /** Crit damage % lines on top of the game's base 40. */
  critDamagePct?: number;
  /** Maximize Power: every roll is the top one. */
  maxRoll?: boolean;
  /** Hit count: positive = per hit × n, negative = the total split into n. */
  hits?: number;
}

export interface Range {
  min: number;
  max: number;
}

/** One physical attack's damage range against the target. */
export function physicalStaged(p: PhysicalInput): Range {
  const step = (top: boolean) => {
    const spread = p.weaponLevel * 0.05;
    const bonus = p.weaponStat / 200;
    let w = Math.floor(p.weaponAtk * (1 + bonus + (top || p.crit || p.maxRoll ? spread : -spread)));
    w += p.refineAtk;
    if (p.sizePct < 100) w = Math.floor((w * p.sizePct) / 100);
    const b = w + p.equipAtk;
    let card = b;
    for (const k of p.kinds) card = mulOper(card, 1 + k / 100);
    const branch = Math.floor((b * p.atkPercent) / 100);
    let d = mulOper(card + branch, p.elementPct / 100);
    d += mulOper(p.statusAtk * p.statusTimes, p.neutralPct / 100);
    d += p.mastery;
    if (p.rangedPct) d = mulOper(d, 1 + p.rangedPct / 100);
    if (p.skillPercent !== null) d = mulOper(d, Math.floor(p.skillPercent) / 100);
    if (!p.noDef) {
      const factor = (4000 + p.hardDef) / (4000 + 10 * p.hardDef);
      d = Math.floor(d * factor) - p.softDef;
    }
    if (p.skillPercent !== null && p.skillDamagePct) d = mulOper(d, 1 + p.skillDamagePct / 100);
    if (p.crit) d = mulOper(d, 1 + (40 + (p.critDamagePct ?? 0)) / 100);
    return Math.max(1, d);
  };
  return splitHits({ min: step(false), max: step(true) }, p.hits ?? 1);
}

/** A negative count: the figure is the total, shown as n equal hits (rounded down to a multiple). */
export function splitHits(r: Range, hits: number): Range {
  const n = Math.abs(Math.round(hits)) || 1;
  if (hits < 0) return { min: Math.floor(r.min / n) * n, max: Math.floor(r.max / n) * n };
  return { min: r.min * n, max: r.max * n };
}

export interface MagicInput {
  statusMatk: number;
  /** Weapon MATK, refine included. */
  weaponMatk: number;
  weaponLevel: number;
  /** Flat MATK from gear. */
  equipMatk: number;
  matkPercent: number;
  /** Targeted magic damage lines, one sum per kind, %. */
  kinds: number[];
  skillPercent: number;
  hardMdef: number;
  softMdef: number;
  skillDamagePct: number;
  /** The spell's element against the target, %. */
  elementPct: number;
  hits: number;
}

/** One spell's damage range: weapon MATK rolls ±10% per weapon level, the element comes after MDEF. */
export function magicStaged(p: MagicInput): Range {
  const step = (top: boolean) => {
    const roll = 1 + (top ? 1 : -1) * p.weaponLevel * 0.1;
    let m = p.statusMatk + Math.floor(p.weaponMatk * roll) + p.equipMatk;
    m = mulOper(m, 1 + p.matkPercent / 100);
    for (const k of p.kinds) m = mulOper(m, 1 + k / 100);
    m = Math.floor((m * Math.floor(p.skillPercent)) / 100);
    m = Math.floor(m * ((1000 + p.hardMdef) / (1000 + 10 * p.hardMdef))) - p.softMdef;
    if (p.skillDamagePct) m = mulOper(m, 1 + p.skillDamagePct / 100);
    m = mulOper(m, p.elementPct / 100);
    return Math.max(1, m);
  };
  return splitHits({ min: step(false), max: step(true) }, p.hits);
}

/** Hunter traps: SLV × DEX × (3 + BaseLv/100) × (1 + INT/35), no DEF, max 10% higher. */
export function trapStaged(slv: number, dex: number, baseLevel: number, int: number, elementPct: number, skillDamagePct: number): Range {
  let t = slv * dex * (3 + baseLevel / 100) * (1 + int / 35);
  if (skillDamagePct) t = mulOper(t, 1 + skillDamagePct / 100);
  t = mulOper(t, elementPct / 100);
  return { min: Math.floor(t), max: Math.floor(t * 1.1) };
}

/** Casts per second: one use takes cast + max(delay, cooldown), never quicker than a swing. Capped at 7.14. */
export function usesPerSecond(cast: number, delay: number, aspd: number | null): number {
  const swing = aspd === null ? 0 : Math.floor(((200 - aspd) / 50) * 100) / 100;
  const each = Math.max(cast + delay, swing);
  if (each <= 0) return 7.14;
  return Math.min(7.14, Math.floor((1 / each) * 100) / 100);
}

/** Cast time: variable part shrinks with 2×DEX + INT (gone at 530), fixed part only by % lines. */
export function castSeconds(vct: number, fct: number, dex: number, int: number, vctPct: number, fctPct: number): number {
  const s = Math.min(530, 2 * dex + int);
  const v = vct * (1 - Math.sqrt(s / 530)) * (1 + vctPct / 100);
  const f = Math.max(0, fct) * (1 + fctPct / 100);
  return Math.max(0, Math.floor((v + f) * 10000) / 10000);
}

// The build simulator behind /tools/build (owner, 6 Oct 2026: replace the
// HIT/FLEE page with a full stat calculator, gear included, in one go).
//
// A build is a class, base and Job level, the stat points put in, ten gear
// slots with refine and cards, and foods. Out comes the status window
// (HIT, FLEE, CRI, ATK, MATK, DEF, MDEF, ASPD, HP, SP, weight, cast time) and,
// against one monster, the hit and dodge chance and one auto-attack's damage.
//
// Data: data/build-gear.json (scripts/build-gear-data.py) for what a piece is,
// data/item-effects.json for what it does, data/class-stats.json for classes,
// data/food-buffs.json for foods. All of it from roz.prontera.info.
//
// Formulas are GAME_MODEL §8.6. HIT, FLEE, CRI, Perfect Dodge, status ATK and
// MATK, soft DEF and MDEF were measured in game by prontera; ASPD, HP/SP for
// most classes, weight, cast time and the damage multipliers are rAthena
// Renewal that nobody has measured on Global, and the page labels them so.
//
// Nothing is added silently. An effect that only holds sometimes (a proc, an
// event, a condition the data carries only as text, a skill-level scaling)
// goes to `skipped` with the reason, never into the totals.

import gearFile from '@/data/build-gear.json';
import enchantFile from '@/data/build-enchants.json';
import skillFile from '@/data/build-skills.json';
import rangesFile from '@/data/option-ranges.json';
import { attacksPerSecond } from '@/lib/player-numbers';
import { elementModifier } from '@/lib/element-table';
import { STATS, type Stat, aspdFor, baseHpSp, classStats, jobBonusAt, statBudget, statCost, ASPD_CAP, RANGED_WEAPONS, WEAPON_TH } from '@/lib/class-stats';
import { itemEffects, refineBonusAt, bonusText, type Bonus, type BonusCondition, type BonusGroup } from '@/lib/item-effects';
import { foodById } from '@/lib/food-buffs';
import { physicalDamagePerHit, statusAtkFromStats } from '@/lib/damage';
import { hitChanceVsMob, mobHitChance } from '@/lib/hit-flee';
import type { Element, ElementLevel } from '@/lib/element-table';

export const SLOTS = [
  'weapon', 'shield', 'head_upper', 'head_middle', 'head_lower', 'armor', 'garment', 'footgear', 'accessory_1', 'accessory_2',
] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_TH: Record<Slot, string> = {
  weapon: 'อาวุธ', shield: 'โล่', head_upper: 'หัวบน', head_middle: 'หัวกลาง', head_lower: 'หัวล่าง',
  armor: 'เสื้อ', garment: 'ผ้าคลุม', footgear: 'รองเท้า', accessory_1: 'ประดับ 1', accessory_2: 'ประดับ 2',
};

export interface GearItem {
  n: string;
  i: string | null;
  on: string[];
  sl: number;
  wt?: string;
  wl?: number;
  atk?: number;
  matk?: number;
  def?: number;
  mdef?: number;
  lv?: number;
  rs?: string;
  cls?: string[];
}
export interface CardItem {
  n: string;
  on: string;
  i: string | null;
}
interface SetGroup extends BonusGroup {
  t: string;
}
export interface ItemSet {
  n: string;
  ids: number[];
  g: SetGroup[];
}

const data = gearFile as unknown as { gear: Record<string, GearItem>; cards: Record<string, CardItem>; sets: ItemSet[] };

export function gearById(id: number): GearItem | null {
  return data.gear[String(id)] ?? null;
}
export function cardById(id: number): CardItem | null {
  return data.cards[String(id)] ?? null;
}
export const ALL_GEAR = data.gear;
export const ALL_CARDS = data.cards;

// --- Enchants, essences, costume stones, random options (owner, 6 Oct 2026) --

export type StoneKind = 'plain' | 'essence' | 'upper' | 'middle' | 'lower' | 'garment';
export interface Stone {
  n: string;
  k: StoneKind;
  i: string | null;
}
export const ALL_STONES = (enchantFile as unknown as { stones: Record<string, Stone> }).stones;
export function stoneById(id: number): Stone | null {
  return ALL_STONES[String(id)] ?? null;
}

/** Enchant stones one gear piece takes (slots 2-4 in game; which pieces take which is not in the data). */
export const MAX_ENCHANTS = 3;
/** Random option rows on one piece. */
export const MAX_OPTIONS = 4;

export const COSTUME_SLOTS = ['upper', 'middle', 'lower', 'garment'] as const;
export type CostumeSlot = (typeof COSTUME_SLOTS)[number];
export const COSTUME_TH: Record<CostumeSlot, string> = { upper: 'คอสตูมหัวบน', middle: 'คอสตูมหัวกลาง', lower: 'คอสตูมหัวล่าง', garment: 'คอสตูมผ้าคลุม' };
/** Stones per costume slot: a garment costume also has a 4th-slot stone. */
export const COSTUME_STONES: Record<CostumeSlot, number> = { upper: 1, middle: 1, lower: 1, garment: 2 };

/**
 * Random option lines a player can type in, as [type, target]. The game's
 * option table (docs/prontera-build-planner-2026-10-06/14-options-...) has more,
 * most of them damage-taken lines; these are the ones the window and the
 * damage line use. The ranges Global rolls are not known (GAME_MODEL §9), so
 * the value is the player's.
 */
const RACES = ['angel', 'brute', 'demi_human', 'demon', 'dragon', 'fish', 'formless', 'insect', 'plant', 'undead'];
const ELEMENTS_LOW = ['neutral', 'water', 'earth', 'fire', 'wind', 'poison', 'holy', 'shadow', 'ghost', 'undead'];
export const OPTION_TYPES: [string, string | null][] = [
  ['str', null], ['agi', null], ['vit', null], ['int', null], ['dex', null], ['luk', null],
  ['atk', null], ['atk_percent', null], ['matk', null], ['matk_percent', null], ['hit', null], ['flee', null],
  ['crit', null], ['crit_damage_percent', null], ['perfect_dodge', null], ['aspd', null], ['aspd_percent', null],
  ['hp', null], ['hp_percent', null], ['sp', null], ['sp_percent', null], ['def', null], ['mdef', null],
  ['cast_time_variable_percent', null], ['heal_amount_percent', null], ['hp_recovery_percent', null], ['sp_recovery_percent', null],
  ...RACES.map((r): [string, string] => ['damage_percent', `race:${r}`]),
  ...ELEMENTS_LOW.map((e): [string, string] => ['damage_percent', `element:${e}`]),
  ...RACES.map((r): [string, string] => ['magic_damage_percent', `race:${r}`]),
  ...ELEMENTS_LOW.map((e): [string, string] => ['magic_damage_percent', `element:${e}`]),
  ...ELEMENTS_LOW.map((e): [string, string] => ['resistance_percent', `element:${e}`]),
  ...RACES.map((r): [string, string] => ['damage_taken_percent', `race:${r}`]),
];
// --- Skills: passives, buffs, attack skills (owner, 7 Oct 2026) -------------
// data/build-skills.json (scripts/build-skill-data.py, from prontera's skill
// planner and buff table). Passives are keyed by their name in Build.sk, like
// every other skill level; buffs by slug in Build.bf.

export interface PassiveSkill {
  n: string;
  max: number;
  i: string | null;
  cls: string[];
  /** bonus type -> value per level (index 0 = level 1) */
  fx?: Record<string, number[]>;
  /** only with a weapon in `w` */
  wfx?: Record<string, number[]>;
  /** replaces fx for the classes in secondCls (Improve Dodge after the 2nd job) */
  second?: Record<string, number[]>;
  secondCls?: string[];
  w?: string[];
  /** only against these targets (Demon Bane: race:demon, element:undead) */
  t?: string[];
}
export interface BuffSkill {
  s: string;
  n: string;
  max: number;
  i: string | null;
  cls: string[];
  /** per level: [type, value, target] */
  lv: [string, number, string | null][][];
  txt: string;
}
export interface AttackSkill {
  s: string;
  n: string;
  max: number;
  k: 'atk' | 'matk';
  el: string | null;
  i: string | null;
  /** per level: [ratio %, hits (0 = not per hit), vct ms, fct ms, after-cast delay ms, cooldown ms, SP] */
  lv: [number, number, number, number, number, number, number][];
  /** damage % as a formula of slv, str, agi, vit, int, dex, luk, base_level, cart_weight */
  f?: string;
  /** Where `f` came from when it is not the planner data (shown under the ratio). */
  fs?: string;
}
const skillData = skillFile as unknown as { passives: Record<string, PassiveSkill>; buffs: BuffSkill[]; attacks: Record<string, AttackSkill[]> };

// What the live game does that the captured planner data does not have.
// Applied here so a rebuild of data/build-skills.json cannot drop them.
//
// Axe Tornado (owner, 8 Oct 2026): about 7,000 on a Golem where
// slv × 700 + VIT × 10 % predicted 7,742; no Base Level factor.
const ZERO_FORMULAS: Record<string, string> = { 'blacksmith:axe-tornado': 'slv * 700 + vit * 10' };
// Skills whose damage grows with a stat but whose planner rows are fixed
// numbers (owner, 9 Oct 2026: use the French Zero sheet's formulas). From the
// "Formules Skill" table of Encyclop'Elvyl (docs/elvyl-sheet, tab DPS [DEV]);
// its author rates the damage chain 95-99% right, and none of these six has
// been checked in game here. Only filled where the data has no formula; the
// fixed part of each matches the planner rows already. Left out: the ones
// that need a weapon or shield weight (Axe Boomerang, Shield Boomerang,
// Rapid Smiting), which the simulator does not track, and the rows the sheet
// itself marks "?".
const ELVYL_FORMULAS: Record<string, string> = {
  'assassin:grimtooth': 'slv * 40 + 100 + agi',
  'assassin:soul-destroyer': 'slv * 150 + str + int',
  'assassin:meteor-assault': 'slv * 120 + 200 + str * 5',
  'blacksmith:power-swing': 'slv * 100 + 300 + str + dex',
  'crusader:cannon-spear': 'slv * (120 + str)',
  'crusader:holy-cross': 'slv * 35 + 100 + vit * 2',
};
const ELVYL_NOTE = 'สูตรจากชีต Encyclop\'Elvyl ยังไม่ได้เช็กในเกม';
// Blacksmith self-buffs the planner's buff table lacks, from the client's
// skill text (data/skill-trees.json). Shattering Strike's +100 per level on
// each auto-attack was checked in game by the owner (9 Oct 2026: +1,000 at
// Lv 10); whether it adds to skills too is not known, so only auto-attacks
// get it. Power Thrust is its "Self" line as a damage %.
const ZERO_BUFFS: BuffSkill[] = [
  {
    s: 'power-thrust',
    n: 'Power Thrust',
    max: 5,
    i: '/images/skills/1e679b876e173e76ddda04133b7b4cb3.webp',
    cls: ['blacksmith'],
    lv: [5, 10, 15, 20, 25].map((v) => [['damage_percent', v, null]] as [string, number, string | null][]),
    txt: 'ดาเมจกายภาพ +5% ต่อเลเวล (ตัวเอง)',
  },
  {
    s: 'shattering-strike',
    n: 'Shattering Strike',
    max: 10,
    i: '/images/skills/4b919762247282f3a6edcb3cdf7ef4b8.webp',
    cls: ['blacksmith'],
    lv: Array.from({ length: 10 }, (_, i) => [['flat_damage', (i + 1) * 100, null]] as [string, number, string | null][]),
    txt: 'ตีธรรมดา +100 ดาเมจต่อเลเวลทุกฮิต (Lv 10 = +1,000 ยืนยันในเกม) · ยังไม่รู้ว่าบวกกับสกิลด้วยไหม',
  },
];

const skills = {
  ...skillData,
  buffs: [...skillData.buffs, ...ZERO_BUFFS.filter((b) => !skillData.buffs.some((x) => x.s === b.s))],
  attacks: Object.fromEntries(
    Object.entries(skillData.attacks).map(([cls, list]) => [
      cls,
      list.map((a) => {
        const k = `${cls}:${a.s}`;
        if (ZERO_FORMULAS[k]) return { ...a, f: ZERO_FORMULAS[k], fs: 'สูตรเช็กกับเกมแล้ว' };
        if (!a.f && ELVYL_FORMULAS[k]) return { ...a, f: ELVYL_FORMULAS[k], fs: ELVYL_NOTE };
        return a;
      }),
    ]),
  ),
};
export const ALL_BUFFS = skills.buffs;
const BUFF_BY_SLUG = new Map(skills.buffs.map((b) => [b.s, b]));
export function buffBySlug(slug: string): BuffSkill | null {
  return BUFF_BY_SLUG.get(slug) ?? null;
}
export function passivesFor(cls: string): PassiveSkill[] {
  return Object.values(skills.passives).filter((p) => p.cls.includes(cls));
}
export function attacksFor(cls: string): AttackSkill[] {
  return skills.attacks[cls] ?? [];
}
function attackBySlug(cls: string, slug: string): AttackSkill | null {
  return attacksFor(cls).find((a) => a.s === slug) ?? null;
}

/** A skill's damage formula, evaluated; null when it is not a plain arithmetic expression. */
export function evalRatio(expr: string, vars: Record<string, number>): number | null {
  if (!/^[\w\s+\-*/().]+$/.test(expr)) return null;
  const names = ['slv', 'str', 'agi', 'vit', 'int', 'dex', 'luk', 'base_level', 'cart_weight'];
  const words = expr.match(/[a-z_]+/g) ?? [];
  if (words.some((w) => !names.includes(w) && w !== 'floor')) return null;
  try {
    // eslint-disable-next-line no-new-func
    const v = new Function(...names, 'floor', `return (${expr});`)(...names.map((n) => vars[n] ?? 0), Math.floor) as number;
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

// --- Random option ranges (rozerodb.com/tools/affixes, 7 Oct 2026) ----------
const ranges = (rangesFile as unknown as { ranges: Record<string, [string, string, number, number, number][]> }).ranges;
/** The option pools a slot's item rolls from. */
export function optionPools(slot: Slot, item: GearItem | null): string[] {
  if (slot === 'weapon' || (slot === 'shield' && item?.on.includes('weapon'))) {
    const wt = item?.wt ?? '';
    if (['staff_1h', 'staff_2h', 'book'].includes(wt)) return ['magic', 'forged'];
    if (RANGED_WEAPONS.has(wt)) return ['ranged', 'forged'];
    return ['melee', 'forged'];
  }
  if (slot === 'armor') return ['armor'];
  if (slot === 'garment') return ['garment'];
  if (slot === 'footgear') return ['shoes'];
  return [];
}
/** "5-30 ดรอปมอน · 10-25 MVP": where and how high an option rolls on this slot; null when the data has none. */
export function optionRangeText(key: string, slot: Slot, item: GearItem | null): string | null {
  const pools = optionPools(slot, item);
  const rows = (ranges[key] ?? []).filter((r) => pools.includes(r[0]));
  if (!rows.length) return null;
  const bySource = new Map<string, [number, number]>();
  for (const [, src, , lo, hi] of rows) {
    const cur = bySource.get(src);
    bySource.set(src, cur ? [Math.min(cur[0], lo), Math.max(cur[1], hi)] : [lo, hi]);
  }
  return [...bySource].map(([src, [lo, hi]]) => `${lo === hi ? lo : `${lo} ถึง ${hi}`} ${src}`).join(' · ');
}
/** Option rows a piece carries in game: weapons 4 (MVP drops), armour, garment and shoes 3, the rest 2 (rozeroplanner's rule, not checked). */
export function maxOptionsFor(slot: Slot): number {
  if (slot === 'weapon') return 4;
  if (slot === 'armor' || slot === 'garment' || slot === 'footgear') return 3;
  return 2;
}

export function optionKey([type, target]: [string, string | null]): string {
  return target ? `${type}@${target}` : type;
}
const OPTION_BY_KEY = new Map(OPTION_TYPES.map((o) => [optionKey(o), o]));

// Second classes wear what their first class wears: an item's class list
// names "swordsman" for Knight swords (74 items list swordsman alone).
const PARENT: Record<string, string> = {
  knight: 'swordsman', crusader: 'swordsman', wizard: 'mage', sage: 'mage', hunter: 'archer', bard: 'archer', dancer: 'archer',
  priest: 'acolyte', monk: 'acolyte', blacksmith: 'merchant', alchemist: 'merchant', assassin: 'thief', rogue: 'thief',
};
export function classFits(cls: string, list: string[] | undefined): boolean {
  if (!list?.length) return true;
  return list.includes(cls) || (PARENT[cls] !== undefined && list.includes(PARENT[cls]));
}

const MAX_JOB: Record<string, number> = { base: 10, first_class: 50, second_job: 60 };
export function maxJobLevel(cls: string): number {
  return MAX_JOB[classStats(cls)?.tier ?? ''] ?? 50;
}

const TWO_HANDED = new Set(['sword_2h', 'spear_2h', 'axe_2h', 'staff_2h', 'bow', 'katar']);
export function isTwoHanded(wt: string | undefined): boolean {
  return wt !== undefined && TWO_HANDED.has(wt);
}

/** Slots an item fits in. A two-slot accessory goes in either; a hat in each head slot it covers. */
export function fitsSlot(item: GearItem, slot: Slot): boolean {
  if (slot === 'accessory_1' || slot === 'accessory_2') return item.on.includes(slot);
  // A hat sits in the first head slot it lists and covers the rest.
  if (slot.startsWith('head_')) return item.on[0] === slot;
  return item.on.includes(slot);
}

/** Head slots a hat covers besides the one it sits in. */
export function coveredSlots(item: GearItem, slot: Slot): Slot[] {
  if (!slot.startsWith('head_')) return [];
  return item.on.filter((s): s is Slot => s !== slot && s.startsWith('head_')) as Slot[];
}

/** The card slot kind a gear slot takes. */
// --- Two weapons (owner, 7 Oct 2026) ---------------------------------------
//
// An Assassin holds a second weapon in the left hand, where other classes
// hold a shield: a dagger, a one-handed sword or a one-handed axe. The game's
// own skill text (prontera's client extract) gives the damage each hand keeps
// while dual wielding: right 50% + 10% per Righthand Mastery level (lv 5 =
// 100%), left 30% + 10% per Lefthand Mastery level (lv 5 = 80%).
//
// The rest is rAthena Renewal, the engine Zero is built on, and nobody has
// measured it on Global (looked 7 Oct 2026):
// - ASPD: the left weapon adds a quarter of its own delay to the right's
//   (status_base_amotion_pc, RENEWAL_ASPD branch).
// - Damage: the left hand uses its own weapon ATK, size penalty and element,
//   and status ATK once where the right hand counts it twice (rAthena commit
//   9e959f7, "Renewal Offhand Damage").
// - Cards in either hand count for both (official behaviour per rAthena
//   issue #7659), so they simply add up here.
// - Double Attack and skills use the right hand only (not modelled here).
export const DUAL_CLASSES = new Set(['assassin']);
export const LEFT_WEAPON_TYPES = new Set(['dagger', 'sword_1h', 'axe_1h']);
export const RIGHT_MASTERY = 'Righthand Mastery';
export const LEFT_MASTERY = 'Lefthand Mastery';

/** A weapon this class can hold in the left hand. */
export function fitsLeftHand(item: GearItem, cls: string): boolean {
  return DUAL_CLASSES.has(cls) && item.on.includes('weapon') && LEFT_WEAPON_TYPES.has(item.wt ?? '');
}

/** The shield slot is "the left hand" for a class that can put a weapon there. */
export function slotLabel(slot: Slot, cls: string): string {
  return slot === 'shield' && DUAL_CLASSES.has(cls) ? 'มือซ้าย' : SLOT_TH[slot];
}

export function cardKind(slot: Slot, item?: GearItem | null): string {
  // A weapon in the left hand takes weapon cards.
  if (slot === 'shield' && item?.on.includes('weapon')) return 'weapon';
  if (slot.startsWith('head_')) return 'head_upper';
  if (slot.startsWith('accessory_')) return 'accessory_1';
  return slot;
}

export interface Worn {
  id: number;
  /** refine */
  r: number;
  /** card ids, one per card slot, 0 for empty */
  c: number[];
  /** enchant stones (plain stones; an essence on armour) */
  e?: number[];
  /** random options: [option key (lib OPTION_TYPES), value] */
  o?: [string, number][];
}

export interface Build {
  cls: string;
  lv: number;
  job: number;
  st: Record<Stat, number>;
  g: Partial<Record<Slot, Worn>>;
  f: number[];
  /** In War of Emperium: siege-only lines count. */
  siege?: boolean;
  /** Costume enchant stones by costume slot. */
  cos?: Partial<Record<CostumeSlot, number[]>>;
  /** Skill levels for lines that scale with one ("CRIT +5 per level of Grimtooth"). */
  sk?: Record<string, number>;
  /** Buffs on the character: buff slug -> level. */
  bf?: Record<string, number>;
  /** The attack skill to measure against the target: [slug, level]. */
  as?: [string, number];
  /** Monsters attacking you at once (3 and up cut FLEE). */
  mob?: number;
  /** The target is frozen, stoned, stunned or asleep. */
  ail?: Ailment;
}

/**
 * A status on the target (rAthena Renewal, the same in rozeroplanner's
 * model): any of them makes every attack land; freeze and stone also halve
 * hard DEF, raise MDEF by a quarter, and turn the monster Water 1 or Earth 1.
 */
export type Ailment = 'freeze' | 'stone' | 'stun' | 'sleep';
export const AILMENTS: Record<Ailment, { th: string; element?: string }> = {
  freeze: { th: 'แข็ง', element: 'Water' },
  stone: { th: 'กลายเป็นหิน', element: 'Earth' },
  stun: { th: 'มึน' },
  sleep: { th: 'หลับ' },
};

/** The monster as a frozen or stoned one is: Water/Earth 1, hard DEF halved, MDEF +25%. */
function withAilment(target: Target | null, ail: Ailment | undefined): Target | null {
  const el = ail ? AILMENTS[ail].element : undefined;
  if (!target || !el) return target;
  return {
    ...target,
    element: el,
    element_level: 1,
    def: target.def === null ? null : Math.floor(target.def / 2),
    mdef: target.mdef == null ? target.mdef : target.mdef + Math.floor(target.mdef / 4),
  };
}

/**
 * FLEE left when several monsters attack at once (rAthena agi_penalty:
 * from the 3rd attacker on, 10% of FLEE per monster past the 2nd). Not
 * measured in Global yet.
 */
export function mobbedFlee(flee: number, attackers: number): number {
  const n = Math.max(0, attackers - 2);
  return Math.max(0, flee - Math.floor((flee * n * 10) / 100));
}

/**
 * Potions in the simulator, with what the game's own text says each heals
 * ("Recovers about 325 HP"). sp: heals SP instead of HP.
 */
export const POTION_HEAL: Record<number, { amount: number; sp?: boolean }> = {
  501: { amount: 45 }, 502: { amount: 105 }, 503: { amount: 175 }, 504: { amount: 325 }, 505: { amount: 60, sp: true },
};

export const EMPTY_BUILD: Build = {
  cls: 'swordsman',
  lv: 50,
  job: 40,
  st: { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 },
  g: {},
  f: [],
};

export interface Target {
  name: string;
  level: number;
  vit: number | null;
  def: number | null;
  size: string | null;
  element: string | null;
  element_level: number | null;
  race: string | null;
  boss: boolean;
  hit_100: number | null;
  flee_95: number | null;
  hp?: number | null;
  mdef?: number | null;
  int?: number | null;
  /** Lowers the crit chance against it: 0.2% a point (prontera, rAthena). */
  luk?: number | null;
}

export interface Line {
  from: string;
  text: string;
  why?: string;
}

interface Sum {
  type: string;
  target: string | null;
  skill: string | null;
  value: number;
}

export interface BuildResult {
  budget: number;
  used: number;
  job: Record<Stat, number>;
  bonus: Record<Stat, number>;
  total: Record<Stat, number>;
  hit: number;
  flee: number;
  crit: number;
  pd: number;
  atk: { status: number; equip: number };
  matk: { status: number; equip: number };
  def: { hard: number; soft: number };
  mdef: { hard: number; soft: number };
  aspd: number | null;
  hp: number | null;
  sp: number | null;
  hpMeasured: boolean;
  weight: { cap: number; worn: number };
  /** Share of the variable cast time left (0..1). */
  vct: number;
  /** Fixed cast time change in percent (negative is shorter). */
  fct: number;
  /** Other summed effects: damage against a race, crit damage, EXP. */
  other: Sum[];
  counted: Line[];
  skipped: Line[];
  warnings: string[];
  /** Skills some worn line scales with; their levels come from Build.sk. */
  skills: string[];
  /** Potion healing in percent of the potion's own amount: VIT (INT for SP) ×2 plus item bonuses. */
  potionRate: { hp: number; sp: number };
  vs: TargetResult | null;
}

export interface TargetResult {
  hitChance: number | null;
  /** HIT still needed for 100%; 0 when there. */
  hitShort: number | null;
  dodge: number | null;
  /** FLEE still needed for the 95% cap; 0 when there. */
  fleeShort: number | null;
  /** FLEE after the mobbing cut (equals flee with fewer than 3 attackers). */
  fleeMobbed: number;
  damage: number | null;
  /** Lowest and highest auto-attack damage from the weapon ATK roll. */
  damageMin: number | null;
  damageMax: number | null;
  /** Crit chance against this monster, after its LUK; Katar doubles CRI. */
  critChance: number;
  /** One crit: the top of the weapon roll, x1.4, plus crit damage %. */
  critDamage: number | null;
  /** Double Attack chance with a dagger in the right hand (Thief line). */
  doubleAttack: number;
  /** Average damage one swing does, misses, crits and Double Attack counted. */
  avgSwing: number | null;
  multiplier: number;
  /** Dual wielding: what each hand lands after its mastery share; damage is their sum. */
  hands?: { right: number; left: number; rightPct: number; leftPct: number } | null;
  /** Monster HP, and how long auto-attacks take to bring it down. */
  hp?: number | null;
  autoHits?: number | null;
  autoSeconds?: number | null;
  skill?: SkillResult | null;
}

export interface SkillResult {
  name: string;
  level: number;
  kind: 'atk' | 'matk';
  /** Damage % used (from the formula when there is one). */
  ratio: number;
  /** Where the ratio's formula came from, when not the planner data. */
  ratioSource?: string;
  hits: number;
  /** Damage of one cast, all hits. */
  damage: number;
  /** Seconds between casts: cast time + delay, or the attack interval if longer. */
  interval: number;
  castSeconds: number;
  casts: number | null;
  seconds: number | null;
  sp: number;
}


const WINDOW = new Set([
  ...STATS, ...STATS.map((s) => `${s}_percent`), 'hit_percent', 'mastery', 'weight', 'endow', 'no_size_penalty', 'hit', 'flee', 'crit', 'perfect_dodge', 'atk', 'matk', 'atk_percent', 'matk_percent', 'def', 'mdef',
  'hp', 'hp_percent', 'sp', 'sp_percent', 'aspd', 'aspd_percent', 'cast_time_variable_percent', 'cast_time_fixed_percent', 'double_attack', 'flat_damage',
]);

/** Why a group does not count now, or null when it does. */
function blocked(c: BonusCondition, ctx: { refine: number; refineSum: number | null; build: Build }): string | null {
  if (c.proc) return 'ติดเป็นบางครั้ง (ตอนตี/โดนตี/ใช้สกิล) ไม่นับรวม';
  if (c.event) return 'ช่วงอีเวนต์';
  if (c.text) return 'มีเงื่อนไขที่ข้อมูลไม่ได้ระบุ ดูข้อความในเกม';
  if (c.refine && ctx.refine < c.refine) return `ต้องตีบวก +${c.refine} ขึ้นไป`;
  if (c.refineSum) {
    if (ctx.refineSum === null) return 'โบนัสเซ็ต นับในส่วนเซ็ต';
    if (ctx.refineSum < c.refineSum) return `ต้องตีบวกรวมทั้งชุด +${c.refineSum} ขึ้นไป`;
  }
  if (c.level && ctx.build.lv < c.level) return `ต้องเลเวล ${c.level} ขึ้นไป`;
  if (c.classes?.length && !classFits(ctx.build.cls, c.classes)) return 'อาชีพนี้ไม่ได้';
  if (c.siege && !ctx.build.siege) return 'เฉพาะในวอร์';
  return null;
}

function key(s: { type: string; target: string | null; skill: string | null }) {
  return `${s.type}|${s.target ?? ''}|${s.skill ?? ''}`;
}

/**
 * Normalise a monster's race ("Demi-Human") to the bonus target form
 * ("demi_human").
 */
function raceKey(race: string | null): string | null {
  return race ? race.toLowerCase().replace(/[-\s]/g, '_') : null;
}

function targetMatches(target: string, t: Target, ranged: boolean): boolean {
  const [kind, what] = target.split(':');
  if (kind === 'race') return raceKey(t.race) === what;
  if (kind === 'element') return (t.element ?? '').toLowerCase() === what;
  if (kind === 'size') return (t.size ?? '').toLowerCase() === what;
  if (kind === 'monster_kind') return what === 'boss' ? t.boss : !t.boss;
  if (kind === 'ranged') return ranged;
  return false;
}

const SIZE_ROW: Record<string, string> = {
  bare_hand: 'Bare hand', sword_1h: 'One-Handed Sword', sword_2h: 'Two-Handed Sword', dagger: 'Dagger', axe_1h: 'One-Handed Axe',
  axe_2h: 'Two-Handed Axe', katar: 'Katar', staff_1h: 'One-Handed Staff', staff_2h: 'Two-Handed Staff', mace: 'One-Handed Mace',
  bow: 'Bow', spear_1h: 'One-Handed Spear', spear_2h: 'Two-Handed Spear', knuckle: 'Fist', book: 'Book', whip: 'Whip',
  instrument: 'Instrument',
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function calcBuild(build: Build, mobTarget: Target | null = null): BuildResult {
  const target = withAilment(mobTarget, build.ail);
  const warnings: string[] = [];
  const counted: Line[] = [];
  const skipped: Line[] = [];
  const sums = new Map<string, Sum>();
  const skills = new Set<string>();
  const add = (from: string, b: Bonus, refine: number) => {
    const [type, value, target, per, skill, scaling] = b;
    let level = 1;
    if (scaling) {
      skills.add(scaling);
      level = build.sk?.[scaling] ?? 0;
      if (!level) {
        skipped.push({ from, text: bonusText(b), why: `ใส่เลเวลสกิล ${scaling} ก่อนถึงจะนับ` });
        return;
      }
    }
    const v = (per ? value * Math.floor(refine / per) : value) * level;
    if (!v) return;
    const t = target === 'player' ? 'player' : target;
    const s = sums.get(key({ type, target: t, skill })) ?? { type, target: t, skill, value: 0 };
    s.value += v;
    sums.set(key(s), s);
    counted.push({ from, text: bonusText([type, v, target, null, skill]) + (scaling ? ` (${scaling} Lv ${level})` : '') });
  };
  const addGroups = (from: string, groups: BonusGroup[] | undefined, refine: number, refineSum: number | null) => {
    for (const g of groups ?? []) {
      const why = blocked(g.c, { refine, refineSum, build });
      if (why === 'โบนัสเซ็ต นับในส่วนเซ็ต') continue; // the set below counts it once
      if (why) {
        for (const b of g.b) skipped.push({ from, text: bonusText(b), why });
        continue;
      }
      for (const b of g.b) add(from, b, refine);
    }
  };

  // Gear and cards.
  const worn = new Set<number>();
  let weapon: GearItem | null = null;
  let weaponRefine = 0;
  let weaponEl: string | null = null;
  let hardDef = 0;
  let hardMdef = 0;
  let wornWeight = 0;
  let weaponAtk = 0;
  // Weapon ATK rolls ±5% per weapon level around the item's own ATK each hit
  // (rAthena Renewal); refine is not rolled. Fits prontera's in-game check
  // (117 predicted, 114-120 seen) where a flat ±15% would not.
  let weaponVar = 0;
  let leftVar = 0;
  let weaponMatk = 0;
  let shield = false;
  let left: GearItem | null = null;
  let leftAtk = 0;
  let leftEl: string | null = null;
  const covered = new Set<Slot>();
  for (const slot of SLOTS) {
    const w = build.g[slot];
    if (!w) continue;
    const item = gearById(w.id);
    if (!item) continue;
    if (covered.has(slot)) {
      warnings.push(`${SLOT_TH[slot]}: ช่องนี้ถูกหมวกใบอื่นใช้อยู่ ไม่นับ ${item.n}`);
      continue;
    }
    for (const s of coveredSlots(item, slot)) covered.add(s);
    const leftWeapon = slot === 'shield' && item.on.includes('weapon');
    if (leftWeapon && !fitsLeftHand(item, build.cls)) {
      warnings.push(`${item.n}: ถือมือซ้ายได้เฉพาะ Assassin กับมีด ดาบมือเดียว ขวานมือเดียว ไม่นับ`);
      continue;
    }
    if (!classFits(build.cls, item.cls)) warnings.push(`${item.n}: อาชีพนี้ใส่ไม่ได้`);
    if (item.lv && build.lv < item.lv) warnings.push(`${item.n}: ต้องเลเวล ${item.lv}`);
    worn.add(w.id);
    const fx = itemEffects(w.id);
    wornWeight += fx?.w ?? 0;
    hardDef += item.def ?? 0;
    hardMdef += item.mdef ?? 0;
    const ref = refineBonusAt(item.rs, w.r);
    if (slot === 'weapon') {
      weapon = item;
      weaponRefine = w.r;
      weaponEl = fx?.el ?? null;
      weaponAtk = (item.atk ?? 0) + (ref?.stat === 'ATK' ? ref.value : 0);
      weaponVar = Math.floor(((item.atk ?? 0) * 5 * (item.wl ?? 1)) / 100);
      // Staffs and other MATK weapons: refine adds the same to MATK (lib/item-effects refineBonusAt).
      weaponMatk = item.matk ? item.matk + (ref?.stat === 'ATK' ? ref.value : 0) : 0;
    } else if (leftWeapon) {
      left = item;
      leftEl = fx?.el ?? null;
      leftAtk = (item.atk ?? 0) + (ref?.stat === 'ATK' ? ref.value : 0);
      leftVar = Math.floor(((item.atk ?? 0) * 5 * (item.wl ?? 1)) / 100);
    } else if (ref?.stat === 'DEF') {
      hardDef += ref.value;
    }
    if (slot === 'shield' && !leftWeapon) shield = true;
    addGroups(item.n, fx?.g, w.r, null);
    for (const cid of w.c) {
      const card = cid ? cardById(cid) : null;
      if (!card) continue;
      if (card.on !== cardKind(slot, item)) warnings.push(`${card.n}: ใส่ใน${slotLabel(slot, build.cls)}ไม่ได้`);
      worn.add(cid);
      addGroups(card.n, itemEffects(cid)?.g, w.r, null);
    }
    for (const sid of w.e ?? []) {
      const stone = stoneById(sid);
      if (!stone) continue;
      if (stone.k === 'essence' && slot !== 'armor') warnings.push(`${stone.n}: Essence ใส่ได้ที่เสื้อ`);
      else if (stone.k !== 'plain' && stone.k !== 'essence') warnings.push(`${stone.n}: เป็นหินคอสตูม`);
      worn.add(sid);
      addGroups(stone.n, itemEffects(sid)?.g, w.r, null);
    }
    for (const [k, v] of w.o ?? []) {
      const opt = OPTION_BY_KEY.get(k);
      if (opt && v) add(`ออปชั่น ${item.n}`, [opt[0], v, opt[1], null, null], 0);
    }
  }

  // Costume enchant stones.
  for (const cs of COSTUME_SLOTS) {
    for (const sid of build.cos?.[cs] ?? []) {
      const stone = sid ? stoneById(sid) : null;
      if (!stone) continue;
      if (stone.k !== cs) warnings.push(`${stone.n}: ใส่ใน${COSTUME_TH[cs]}ไม่ได้`);
      worn.add(sid);
      addGroups(stone.n, itemEffects(sid)?.g, 0, null);
    }
  }
  if ((shield || left) && isTwoHanded(weapon?.wt)) warnings.push(`อาวุธสองมือใส่คู่กับ${left ? 'อาวุธมือซ้าย' : 'โล่'}ไม่ได้`);
  if (left) {
    skills.add(RIGHT_MASTERY);
    skills.add(LEFT_MASTERY);
  }

  // Sets and card combos: every piece worn.
  for (const set of data.sets) {
    if (!set.ids.every((id) => worn.has(id))) continue;
    const refines = SLOTS.map((s) => build.g[s]).filter((w): w is Worn => !!w && set.ids.includes(w.id)).map((w) => w.r);
    const sum = refines.reduce((a, b) => a + b, 0);
    addGroups(`เซ็ต ${set.n}`, set.g, refines.length ? Math.min(...refines) : 0, sum);
  }

  // Foods: two foods for the same stat do not stack in game; the larger counts.
  const best = new Map<string, { from: string; value: number }>();
  for (const id of build.f) {
    const food = foodById(id);
    if (!food) continue;
    for (const [k, v] of Object.entries(food.b)) {
      const prev = best.get(k);
      if (prev) warnings.push(`${food.name} กับ ${prev.from}: เพิ่ม ${k.toUpperCase()} เหมือนกัน นับแค่อันที่มากกว่า`);
      if (!prev || v > prev.value) best.set(k, { from: food.name, value: v });
    }
  }
  for (const [k, { from, value }] of best) add(from, [k, value, null, null, null], 0);

  // Class passives (owner's Blacksmith, 7 Oct 2026: STR read 1 + 7 where the
  // Job bonus gives 6 -- the seventh is Hilt Binding). Levels come from the
  // skill-level inputs; weapon-bound lines need that weapon in either hand.
  const heldTypes = new Set([weapon?.wt ?? 'bare_hand', left?.wt ?? '']);
  for (const p of passivesFor(build.cls)) {
    skills.add(p.n);
    const lv = Math.min(p.max, build.sk?.[p.n] ?? 0);
    if (!lv) continue;
    const holds = !p.w || p.w.some((w) => heldTypes.has(w));
    const fx = p.second && p.secondCls?.includes(build.cls) ? p.second : p.fx;
    const groups: [Record<string, number[]> | undefined, boolean][] = [[fx, p.wfx ? true : holds], [p.wfx, holds]];
    for (const [table, on] of groups) {
      for (const [type, values] of Object.entries(table ?? {})) {
        const v = values[lv - 1];
        if (!v) continue;
        if (!on) {
          skipped.push({ from: `สกิล ${p.n}`, text: bonusText([type === 'mastery' ? 'atk' : type, v, null, null, null]), why: `ต้องถือ ${p.w?.map((w) => WEAPON_TH[w] ?? w).join('/')}` });
          continue;
        }
        for (const t of p.t ?? [null]) add(`สกิล ${p.n}`, [type, v, t, null, null], 0);
      }
    }
  }

  // Buffs: skill buffs at the level chosen, from anyone (a party's Priest).
  for (const [slug, level] of Object.entries(build.bf ?? {})) {
    const b = buffBySlug(slug);
    const lv = Math.min(b?.max ?? 0, level);
    if (!b || !lv) continue;
    for (const [type, value, t] of b.lv[lv - 1] ?? []) add(`บัฟ ${b.n} Lv ${lv}`, [type, value, t, null, null], 0);
  }

  const get = (type: string) => sums.get(key({ type, target: null, skill: null }))?.value ?? 0;

  // Stats.
  const job = jobBonusAt(build.cls, build.job);
  const bonus = Object.fromEntries(STATS.map((s) => [s, get(s)])) as Record<Stat, number>;
  // A stat % (Improve Concentration: AGI/DEX +12%) is of the stat before gear.
  const total = Object.fromEntries(
    STATS.map((s) => [s, build.st[s] + job[s] + bonus[s] + Math.floor(((build.st[s] + job[s]) * get(`${s}_percent`)) / 100)]),
  ) as Record<Stat, number>;
  const used = STATS.reduce((sum, s) => sum + statCost(build.st[s]), 0);
  const budget = statBudget(build.lv);
  if (used > budget) warnings.push(`ใช้แต้มเกิน ${used - budget} แต้ม`);

  const { str, agi, vit, dex, luk } = total;
  const int = total.int;
  const lv = build.lv;
  const wt = weapon?.wt ?? 'bare_hand';
  const ranged = RANGED_WEAPONS.has(wt);

  const hit = Math.floor((175 + lv + dex + Math.floor(luk / 3) + get('hit')) * (1 + get('hit_percent') / 100));
  const flee = 100 + lv + agi + Math.floor(luk / 5) + get('flee');
  const crit = Math.floor((1 + luk * 0.3 + lv / 100) * 10) / 10 + get('crit');
  const pd = 1 + Math.floor(luk / 10) + get('perfect_dodge');

  const statusAtk = statusAtkFromStats(lv, str, dex, luk, ranged);
  const equipAtk = Math.floor((weaponAtk + get('atk')) * (1 + get('atk_percent') / 100));
  const statusMatk = int + Math.floor(int / 2) + Math.floor(dex / 5) + Math.floor(luk / 3) + Math.floor(lv / 4);
  const equipMatk = Math.floor((weaponMatk + get('matk')) * (1 + get('matk_percent') / 100));

  const softDef = Math.floor((lv + vit) / 2 + agi / 5);
  const softMdef = Math.floor(int + lv / 4 + (dex + vit) / 5);

  let aspd = aspdFor(build.cls, wt, agi, dex, { ranged, shield });
  if (left && aspd !== null) {
    // The left weapon adds a quarter of its delay (200 - its base ASPD) to
    // the right's: a dagger at base 154 costs 11.5 ASPD.
    const table = classStats(build.cls)?.aspd ?? {};
    const bR = table[wt];
    const bL = table[left.wt ?? ''];
    if (bR !== undefined && bL !== undefined) {
      const base = bR - (200 - bL) / 4;
      aspd = Math.min(ASPD_CAP, Math.floor((base + Math.sqrt((agi * agi) / 2 + (dex * dex) / 5) / 4) * 10) / 10);
    }
  }
  if (aspd === null) {
    warnings.push(`${classStats(build.cls)?.name ?? build.cls} ใช้อาวุธประเภทนี้ไม่ได้ (ไม่มีค่า ASPD)`);
  } else {
    aspd += get('aspd');
    const pct = get('aspd_percent');
    if (pct) aspd += ((195 - aspd) * pct) / 100;
    aspd = Math.min(ASPD_CAP, Math.floor(aspd * 10) / 10);
  }

  const base = baseHpSp(build.cls, lv);
  const hp = base ? Math.floor((Math.floor(base.hp * (1 + vit / 100)) + get('hp')) * (1 + get('hp_percent') / 100)) : null;
  const sp = base ? Math.floor((Math.floor(base.sp * (1 + int / 100)) + get('sp')) * (1 + get('sp_percent') / 100)) : null;

  const vctStat = Math.max(0, 1 - Math.sqrt((2 * dex + int) / 530));
  const vct = Math.max(0, vctStat * (1 + get('cast_time_variable_percent') / 100));

  const other = [...sums.values()].filter((s) => s.target !== null || s.skill !== null || !WINDOW.has(s.type));

  let vs: TargetResult | null = null;
  const fleeMobbed = mobbedFlee(flee, build.mob ?? 1);
  if (target) {
    const ail = build.ail ? AILMENTS[build.ail] : null;
    const hitChance = ail ? 100 : target.hit_100 !== null ? hitChanceVsMob(hit, target.hit_100) : null;
    const dodge = target.flee_95 !== null ? 100 - mobHitChance(target.flee_95, fleeMobbed) : null;
    // Damage multipliers from lines aimed at what this monster is, one
    // factor per kind (race, size, element, boss), plus the untargeted ones.
    const byKind = new Map<string, number>();
    let ignoreDef = 0;
    let ignoreMdef = 0;
    let mastery = 0;
    const magicByKind = new Map<string, number>();
    for (const s of sums.values()) {
      if (s.skill) continue;
      const matches = s.target === null || (s.target !== 'player' && targetMatches(s.target, target, ranged));
      if (!matches) continue;
      if (s.type === 'ignore_def_percent') ignoreDef += s.value;
      if (s.type === 'ignore_mdef_percent') ignoreMdef += s.value;
      // Mastery: flat damage per hit after DEF (Sword Mastery, Demon Bane...).
      if (s.type === 'mastery') mastery += s.value;
      if (s.type === 'magic_damage_percent') {
        const kind = (s.target ?? 'all').split(':')[0];
        magicByKind.set(kind, (magicByKind.get(kind) ?? 0) + s.value);
      }
      if (s.type === 'damage_percent' || (s.type === 'ranged_damage_percent' && ranged)) {
        const kind = s.type === 'ranged_damage_percent' ? 'ranged' : (s.target ?? 'all').split(':')[0];
        byKind.set(kind, (byKind.get(kind) ?? 0) + s.value);
      }
    }
    const multiplier = [...byKind.values()].reduce((m, p) => m * (1 + p / 100), 1);
    // An endow buff (Aspersio, Enchant Poison, a Sage endow) gives the weapon
    // its element; Weapon Perfection takes the size table out.
    const endow = [...sums.values()].find((x) => x.type === 'endow' && x.target)?.target?.split(':')[1] ?? null;
    const noSize = get('no_size_penalty') > 0;
    const def = target.def === null ? null : Math.floor(target.def * (1 - Math.min(100, ignoreDef) / 100));
    const hand = (atk: number, type: string, el: string | null, statusTimes: number, ratio = 100) => physicalDamagePerHit({
      weaponAtk: Math.floor((atk * (1 + get('atk_percent') / 100) * ratio) / 100),
      // Status ATK counts twice in the right hand's damage (lib/damage) and
      // once in the left's; flat ATK from gear once. A skill scales both.
      statusAtk: Math.floor(((statusAtk * statusTimes + Math.floor(get('atk') * (1 + get('atk_percent') / 100))) * ratio) / 100),
      weaponType: noSize ? 'Bare hand' : SIZE_ROW[type] ?? 'Bare hand',
      weaponElement: ((endow ?? el) ? cap((endow ?? el)!) : 'Neutral') as Element,
      targetSize: target.size,
      targetElement: (target.element as Element | null) ?? null,
      targetElementLevel: (target.element_level as ElementLevel | null) ?? null,
      targetDef: def,
      targetLevel: target.level,
      targetVit: target.vit,
    });
    // Added to every auto-attack hit after the multipliers (Shattering Strike).
    const flat = get('flat_damage');
    // One auto-attack with the weapon ATK rolled at `roll` (-1 low, 0 mid, 1 high).
    const auto = (roll: number) => {
      const raw = hand(weaponAtk + roll * weaponVar, wt, weaponEl, 2);
      let damage = raw ? Math.max(1, Math.floor(raw.damage * multiplier) + mastery + flat) : null;
      let hands: TargetResult['hands'] = null;
      if (left && damage !== null) {
        const leftRaw = hand(leftAtk + roll * leftVar, left.wt ?? 'dagger', leftEl, 1);
        const rightPct = 50 + 10 * Math.min(5, build.sk?.[RIGHT_MASTERY] ?? 0);
        const leftPct = 30 + 10 * Math.min(5, build.sk?.[LEFT_MASTERY] ?? 0);
        const r = Math.max(1, Math.floor((damage * rightPct) / 100));
        const l = leftRaw ? Math.max(1, Math.floor((Math.floor(leftRaw.damage * multiplier) * leftPct) / 100)) : 0;
        hands = { right: r, left: l, rightPct, leftPct };
        damage = r + l;
      }
      return { damage, hands };
    };
    const { damage, hands } = auto(0);
    const damageMin = damage === null ? null : auto(-1).damage;
    const damageMax = damage === null ? null : auto(1).damage;
    // Time to kill with auto-attacks: expected damage per swing (hit chance
    // counted) at the swing rate ASPD gives.
    const aps = aspd !== null ? attacksPerSecond(aspd) : null;
    const mobHp = target.hp && target.hp > 0 ? target.hp : null;
    const landed = (hitChance ?? 100) / 100;
    // Crits always land and take the top of the weapon roll, x1.4 and the
    // crit damage lines (rAthena; prontera's crit chance against a target:
    // CRI - its LUK x 0.2). Katar doubles CRI. Double Attack (Thief line,
    // dagger in the right hand) swings twice and cannot crit, so per swing:
    // DA, else crit, else a normal hit.
    const critChance = Math.max(0, Math.min(100, crit * (wt === 'katar' ? 2 : 1) - (target.luk ?? 0) * 0.2));
    const critDamage = damageMax === null ? null : Math.floor((damageMax - flat) * 1.4 * (1 + get('crit_damage_percent') / 100)) + flat;
    const doubleAttack = wt === 'dagger' ? Math.min(100, get('double_attack')) : 0;
    const da = doubleAttack / 100;
    const c = critChance / 100;
    const avgSwing = damage === null ? null
      : da * 2 * landed * damage + (1 - da) * (c * (critDamage ?? damage) + (1 - c) * landed * damage);
    const autoHits = mobHp && damage ? Math.ceil(mobHp / damage) : null;
    const autoSeconds = mobHp && avgSwing && aps ? Math.round((mobHp / (avgSwing * aps)) * 100) / 100 : null;

    // One attack skill.
    let skill: SkillResult | null = null;
    const pick = build.as ? attackBySlug(build.cls, build.as[0]) : null;
    if (pick) {
      const slv = Math.max(1, Math.min(pick.max, build.as![1] || pick.max));
      const row = pick.lv[slv - 1];
      const ratio = (pick.f && evalRatio(pick.f, { slv, ...total, base_level: lv, cart_weight: 0 })) || row[0];
      const hits = row[1] || 1;
      const el = pick.el && pick.el !== 'neutral' ? pick.el : null;
      let perHit: number | null = null;
      if (pick.k === 'atk') {
        const r = hand(weaponAtk, wt, el ?? weaponEl, 2, ratio);
        perHit = r ? Math.max(1, Math.floor(r.damage * multiplier) + mastery) : null;
      } else if (target.element && target.element_level) {
        // Magic: MATK × % × element, reduced by MDEF (Renewal curve, as
        // rozeroplanner and rAthena have it) and the monster's soft MDEF.
        const mdef = Math.floor((target.mdef ?? 0) * (1 - Math.min(100, ignoreMdef) / 100));
        const elem = elementModifier(cap(el ?? 'neutral') as Element, target.element as Element, target.element_level as ElementLevel);
        const softM = Math.floor(((target.int ?? 0) + target.level) / 4);
        // Magic of this skill's element (a Sage endow's "Fire Magical Damage +3%").
        const ownEl = [...sums.values()].filter((x) => x.type === 'magic_damage_percent' && x.target === `skill_element:${el ?? 'neutral'}`).reduce((t, x) => t + x.value, 0);
        const magicMul = [...magicByKind.values()].reduce((m, p) => m * (1 + p / 100), 1) * (1 + ownEl / 100);
        const raw = ((statusMatk + equipMatk) * ratio) / 100 * (elem / 100) * ((1000 + mdef) / (1000 + 10 * mdef)) - softM;
        perHit = Math.max(1, Math.floor(raw * magicMul));
      }
      if (perHit !== null) {
        const total1 = perHit * hits;
        const castSeconds = (row[2] / 1000) * vct + (row[3] / 1000) * Math.max(0, 1 + get('cast_time_fixed_percent') / 100);
        const interval = Math.max(aps ? 1 / aps : 0, castSeconds + Math.max(row[4], row[5]) / 1000);
        const chance = pick.k === 'atk' ? landed : 1;
        const casts = mobHp ? Math.ceil(mobHp / total1) : null;
        skill = {
          name: pick.n,
          level: slv,
          kind: pick.k,
          ratio: Math.round(ratio),
          ratioSource: pick.fs,
          hits,
          damage: total1,
          interval: Math.round(interval * 100) / 100,
          castSeconds: Math.round(castSeconds * 100) / 100,
          casts,
          seconds: mobHp && chance > 0 ? Math.round(((mobHp / (total1 * chance)) * interval) * 100) / 100 : null,
          sp: row[6],
        };
      }
    }

    vs = {
      hitChance,
      hitShort: target.hit_100 !== null ? Math.max(0, target.hit_100 - hit) : null,
      dodge,
      fleeShort: target.flee_95 !== null ? Math.max(0, target.flee_95 - fleeMobbed) : null,
      fleeMobbed,
      damage,
      damageMin,
      damageMax,
      critChance: Math.round(critChance * 10) / 10,
      critDamage,
      doubleAttack,
      avgSwing: avgSwing === null ? null : Math.round(avgSwing * 10) / 10,
      multiplier,
      hands,
      hp: mobHp,
      autoHits,
      autoSeconds,
      skill,
    };
  }

  return {
    budget,
    used,
    job,
    bonus,
    total,
    hit,
    flee,
    crit,
    pd,
    atk: { status: statusAtk, equip: equipAtk },
    matk: { status: statusMatk, equip: equipMatk },
    def: { hard: hardDef + get('def'), soft: softDef },
    mdef: { hard: hardMdef + get('mdef'), soft: softMdef },
    aspd,
    hp,
    sp,
    hpMeasured: !!(base?.measured || base?.calibrated),
    // From the STR you put in, not the total: the owner's Blacksmith (base STR 1,
    // total 8, Enlarge Weight Limit 10) reads 5,030 = 2,000 + 1,000 + 30 + 2,000.
    weight: {
      cap: 2000 + build.st.str * 30 + (classStats(build.cls)?.weightBonus ?? 0) + get('weight'),
      worn: wornWeight / 10,
    },
    vct,
    fct: get('cast_time_fixed_percent'),
    other,
    counted,
    skipped,
    warnings: [...new Set(warnings)],
    skills: [...skills].sort(),
    // rAthena: a potion heals +2% per VIT (SP potions: per INT), plus item lines.
    potionRate: { hp: 100 + vit * 2 + get('item_heal_percent'), sp: 100 + int * 2 + get('item_heal_percent') },
    vs,
  };
}

// --- Saving and sharing -----------------------------------------------------

export const BUILD_KEY = 'roz-calc:build';

/** Compact text for a share link: base64url of the JSON. */
export function encodeBuild(build: Build): string {
  const json = JSON.stringify(build);
  const b64 = typeof btoa === 'function' ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function clampInt(v: unknown, lo: number, hi: number, fallback: number): number {
  const n = Math.floor(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : fallback;
}

/** A build from a share link or storage; anything malformed falls back to the empty build. */
export function decodeBuild(text: string | null | undefined): Build | null {
  if (!text) return null;
  try {
    const b64 = text.replace(/-/g, '+').replace(/_/g, '/');
    const json = typeof atob === 'function' ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, 'base64').toString('utf8');
    return sanitizeBuild(JSON.parse(json));
  } catch {
    return null;
  }
}

export function sanitizeBuild(raw: any): Build | null {
  if (!raw || typeof raw !== 'object' || !classStats(String(raw.cls))) return null;
  const cls = String(raw.cls);
  const st = Object.fromEntries(STATS.map((s) => [s, clampInt(raw.st?.[s], 1, 99, 1)])) as Record<Stat, number>;
  const g: Partial<Record<Slot, Worn>> = {};
  for (const slot of SLOTS) {
    const w = raw.g?.[slot];
    const item = w ? gearById(Number(w.id)) : null;
    if (!item) continue;
    const cards = Array.isArray(w.c) ? w.c.slice(0, item.sl).map((c: unknown) => (cardById(Number(c)) ? Number(c) : 0)) : [];
    const e = Array.isArray(w.e) ? w.e.map(Number).filter((id: number) => stoneById(id)).slice(0, MAX_ENCHANTS) : [];
    const o = Array.isArray(w.o)
      ? w.o.filter((x: unknown) => Array.isArray(x) && OPTION_BY_KEY.has(String(x[0]))).map((x: [string, number]) => [String(x[0]), clampInt(x[1], -999, 9999, 0)] as [string, number]).slice(0, MAX_OPTIONS)
      : [];
    g[slot] = { id: Number(w.id), r: item.rs ? clampInt(w.r, 0, 20, 0) : 0, c: cards, ...(e.length ? { e } : {}), ...(o.length ? { o } : {}) };
  }
  const cos: Partial<Record<CostumeSlot, number[]>> = {};
  for (const cs of COSTUME_SLOTS) {
    const list = raw.cos?.[cs];
    if (!Array.isArray(list)) continue;
    const ids = list.map(Number).filter((id: number) => stoneById(id)?.k === cs).slice(0, COSTUME_STONES[cs]);
    if (ids.length) cos[cs] = ids;
  }
  const bf: Record<string, number> = {};
  for (const [slug, lv] of Object.entries(raw.bf ?? {})) {
    const b = buffBySlug(String(slug));
    const n = b ? clampInt(lv, 0, b.max, 0) : 0;
    if (b && n) bf[b.s] = n;
  }
  const asPick = Array.isArray(raw.as) ? attackBySlug(cls, String(raw.as[0])) : null;
  const as: [string, number] | null = asPick ? [asPick.s, clampInt(raw.as[1], 1, asPick.max, asPick.max)] : null;
  const sk: Record<string, number> = {};
  for (const [name, lv] of Object.entries(raw.sk ?? {})) {
    const n = clampInt(lv, 0, 10, 0);
    if (n) sk[String(name).slice(0, 60)] = n;
  }
  return {
    cls,
    lv: clampInt(raw.lv, 1, 99, 50),
    job: clampInt(raw.job, 1, maxJobLevel(cls), 1),
    st,
    g,
    f: Array.isArray(raw.f) ? raw.f.map(Number).filter((id: number) => foodById(id)).slice(0, 12) : [],
    siege: raw.siege === true || undefined,
    ...(Object.keys(cos).length ? { cos } : {}),
    ...(Object.keys(sk).length ? { sk } : {}),
    ...(Object.keys(bf).length ? { bf } : {}),
    ...(as ? { as } : {}),
    ...(clampInt(raw.mob, 1, 10, 1) > 1 ? { mob: clampInt(raw.mob, 1, 10, 1) } : {}),
    ...(typeof raw.ail === 'string' && raw.ail in AILMENTS ? { ail: raw.ail as Ailment } : {}),
  };
}

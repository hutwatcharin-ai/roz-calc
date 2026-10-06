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
import { STATS, type Stat, aspdFor, baseHpSp, classStats, jobBonusAt, statBudget, statCost, ASPD_CAP, RANGED_WEAPONS } from '@/lib/class-stats';
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
export function cardKind(slot: Slot): string {
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
}

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
  vs: TargetResult | null;
}

export interface TargetResult {
  hitChance: number | null;
  /** HIT still needed for 100%; 0 when there. */
  hitShort: number | null;
  dodge: number | null;
  /** FLEE still needed for the 95% cap; 0 when there. */
  fleeShort: number | null;
  damage: number | null;
  multiplier: number;
}

const WINDOW = new Set([
  ...STATS, 'hit', 'flee', 'crit', 'perfect_dodge', 'atk', 'matk', 'atk_percent', 'matk_percent', 'def', 'mdef',
  'hp', 'hp_percent', 'sp', 'sp_percent', 'aspd', 'aspd_percent', 'cast_time_variable_percent', 'cast_time_fixed_percent',
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

export function calcBuild(build: Build, target: Target | null = null): BuildResult {
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
  let weaponMatk = 0;
  let shield = false;
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
      // Staffs and other MATK weapons: refine adds the same to MATK (lib/item-effects refineBonusAt).
      weaponMatk = item.matk ? item.matk + (ref?.stat === 'ATK' ? ref.value : 0) : 0;
    } else if (ref?.stat === 'DEF') {
      hardDef += ref.value;
    }
    if (slot === 'shield') shield = true;
    addGroups(item.n, fx?.g, w.r, null);
    for (const cid of w.c) {
      const card = cid ? cardById(cid) : null;
      if (!card) continue;
      if (card.on !== cardKind(slot)) warnings.push(`${card.n}: ใส่ใน${SLOT_TH[slot]}ไม่ได้`);
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
  if (shield && isTwoHanded(weapon?.wt)) warnings.push('อาวุธสองมือใส่คู่กับโล่ไม่ได้');

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

  const get = (type: string) => sums.get(key({ type, target: null, skill: null }))?.value ?? 0;

  // Stats.
  const job = jobBonusAt(build.cls, build.job);
  const bonus = Object.fromEntries(STATS.map((s) => [s, get(s)])) as Record<Stat, number>;
  const total = Object.fromEntries(STATS.map((s) => [s, build.st[s] + job[s] + bonus[s]])) as Record<Stat, number>;
  const used = STATS.reduce((sum, s) => sum + statCost(build.st[s]), 0);
  const budget = statBudget(build.lv);
  if (used > budget) warnings.push(`ใช้แต้มเกิน ${used - budget} แต้ม`);

  const { str, agi, vit, dex, luk } = total;
  const int = total.int;
  const lv = build.lv;
  const wt = weapon?.wt ?? 'bare_hand';
  const ranged = RANGED_WEAPONS.has(wt);

  const hit = 175 + lv + dex + Math.floor(luk / 3) + get('hit');
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
  if (target) {
    const hitChance = target.hit_100 !== null ? hitChanceVsMob(hit, target.hit_100) : null;
    const dodge = target.flee_95 !== null ? 100 - mobHitChance(target.flee_95, flee) : null;
    // Damage multipliers from lines aimed at what this monster is, one
    // factor per kind (race, size, element, boss), plus the untargeted ones.
    const byKind = new Map<string, number>();
    let ignoreDef = 0;
    for (const s of sums.values()) {
      if (s.skill) continue;
      const matches = s.target === null || (s.target !== 'player' && targetMatches(s.target, target, ranged));
      if (!matches) continue;
      if (s.type === 'ignore_def_percent') ignoreDef += s.value;
      if (s.type === 'damage_percent' || (s.type === 'ranged_damage_percent' && ranged)) {
        const kind = s.type === 'ranged_damage_percent' ? 'ranged' : (s.target ?? 'all').split(':')[0];
        byKind.set(kind, (byKind.get(kind) ?? 0) + s.value);
      }
    }
    const multiplier = [...byKind.values()].reduce((m, p) => m * (1 + p / 100), 1);
    const def = target.def === null ? null : Math.floor(target.def * (1 - Math.min(100, ignoreDef) / 100));
    const raw = physicalDamagePerHit({
      weaponAtk: Math.floor(weaponAtk * (1 + get('atk_percent') / 100)),
      // Status ATK counts twice in damage (lib/damage), flat ATK from gear once.
      statusAtk: statusAtk * 2 + Math.floor(get('atk') * (1 + get('atk_percent') / 100)),
      weaponType: SIZE_ROW[wt] ?? 'Bare hand',
      weaponElement: (weaponEl ? cap(weaponEl) : 'Neutral') as Element,
      targetSize: target.size,
      targetElement: (target.element as Element | null) ?? null,
      targetElementLevel: (target.element_level as ElementLevel | null) ?? null,
      targetDef: def,
      targetLevel: target.level,
      targetVit: target.vit,
    });
    vs = {
      hitChance,
      hitShort: target.hit_100 !== null ? Math.max(0, target.hit_100 - hit) : null,
      dodge,
      fleeShort: target.flee_95 !== null ? Math.max(0, target.flee_95 - flee) : null,
      damage: raw ? Math.max(1, Math.floor(raw.damage * multiplier)) : null,
      multiplier,
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
    hpMeasured: base?.measured ?? false,
    weight: { cap: 2000 + str * 30 + (classStats(build.cls)?.weightBonus ?? 0), worn: wornWeight / 10 },
    vct,
    fct: get('cast_time_fixed_percent'),
    other,
    counted,
    skipped,
    warnings: [...new Set(warnings)],
    skills: [...skills].sort(),
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
  };
}

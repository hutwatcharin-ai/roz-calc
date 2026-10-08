// What an item does, as numbers (data/item-effects.json, built by
// scripts/build-item-effects.py from roz.prontera.info's item records,
// 6 Oct 2026).
//
// The item's own text stays the authority on our pages. These numbers feed
// the short summary under the stat tiles, the "filter by effect" lists and
// the calculators. Wording follows the words players use (GAME_MODEL §7):
// ตีเผ่า, ทะลุ DEF, ลดร่าย, คริแรง, กันธาตุ.

import file from '@/data/item-effects.json';
import { ARMOUR_DEF, WEAPON_ATK, WEAPON_ATK_BONUS } from '@/lib/refine-table';
import { ELEMENT_TH, RACE_TH } from '@/lib/monster-th';

/** [type, value, target, every N refines, skill name, per level of this skill] */
export type Bonus = [string, number, string | null, number | null, string | null, string?];

export interface BonusCondition {
  /** Holds from this refine up. */
  refine?: number;
  /** Holds from this summed refine of a set up. */
  refineSum?: number;
  level?: number;
  siege?: boolean;
  classes?: string[];
  /** Fires on an event (a skill used, a hit landed) rather than always. */
  proc?: string;
  event?: boolean;
  /** The item text states this under a condition the data does not carry (a card combo, a refine level). */
  text?: boolean;
}

export interface BonusGroup {
  c: BonusCondition;
  b: Bonus[];
}

export interface ItemEffects {
  w?: number;
  def?: number;
  mdef?: number;
  el?: string;
  rs?: string;
  g?: BonusGroup[];
  /** 'text': numbers read from our own item text, where prontera.info had none. */
  src?: 'text';
}

const data = file as unknown as { items: Record<string, ItemEffects> };

export function itemEffects(id: number): ItemEffects | null {
  return data.items[String(id)] ?? null;
}

export const ITEM_EFFECTS_SOURCE = 'roz.prontera.info';

const RACE: Record<string, string> = {
  angel: RACE_TH.Angel, brute: RACE_TH.Brute, demi_human: RACE_TH['Demi-Human'], demon: RACE_TH.Demon, dragon: RACE_TH.Dragon,
  fish: RACE_TH.Fish, formless: RACE_TH.Formless, insect: RACE_TH.Insect, plant: RACE_TH.Plant, undead: RACE_TH.Undead,
};
const SIZE: Record<string, string> = { small: 'เล็ก', medium: 'กลาง', large: 'ใหญ่' };
const STATUS: Record<string, string> = {
  stun: 'สตัน', silence: 'ใบ้', blind: 'ตาบอด', petrify: 'หิน', poison: 'พิษ', sleep: 'หลับ', curse: 'คำสาป',
  frozen: 'แช่แข็ง', bleeding: 'เลือดไหล', confusion: 'สับสน',
};

/** "เผ่ากึ่งมนุษย์", "ธาตุไฟ", "ขนาดใหญ่", "บอส" -- what a bonus is aimed at. */
export function targetLabel(target: string | null): string | null {
  if (!target || target === 'player') return target === 'player' ? 'ผู้เล่น' : null;
  const [kind, what] = target.split(':');
  if (kind === 'race') return `เผ่า${RACE[what] ?? what}`;
  if (kind === 'element') return `ธาตุ${ELEMENT_TH[what.charAt(0).toUpperCase() + what.slice(1)] ?? what}`;
  if (kind === 'size') return `ขนาด${SIZE[what] ?? what}`;
  if (kind === 'status') return STATUS[what] ?? what;
  if (kind === 'monster_kind') return what === 'boss' ? 'บอส' : 'มอนธรรมดา';
  return what ?? null;
}

interface TypeInfo {
  /** Label, with {t} for the target and {s} for the skill when they exist. */
  label: string;
  /** Unit after the number. */
  unit?: '%';
  /** For filters: which list an effect belongs under. */
  group: 'stat' | 'offence' | 'defence' | 'cast' | 'utility';
}

// The 49 bonus types the records use, plus the eleven flat stat fields.
export const BONUS_TYPES: Record<string, TypeInfo> = {
  str: { label: 'STR', group: 'stat' }, agi: { label: 'AGI', group: 'stat' }, vit: { label: 'VIT', group: 'stat' },
  int: { label: 'INT', group: 'stat' }, dex: { label: 'DEX', group: 'stat' }, luk: { label: 'LUK', group: 'stat' },
  hp: { label: 'MaxHP', group: 'defence' }, hp_percent: { label: 'MaxHP', unit: '%', group: 'defence' },
  sp: { label: 'MaxSP', group: 'cast' }, sp_percent: { label: 'MaxSP', unit: '%', group: 'cast' },
  atk: { label: 'ATK', group: 'offence' }, atk_percent: { label: 'ATK', unit: '%', group: 'offence' },
  matk: { label: 'MATK', group: 'offence' }, matk_percent: { label: 'MATK', unit: '%', group: 'offence' },
  hit: { label: 'HIT', group: 'offence' }, flee: { label: 'FLEE', group: 'defence' },
  crit: { label: 'CRI', group: 'offence' }, crit_damage_percent: { label: 'คริแรง', unit: '%', group: 'offence' },
  double_attack: { label: 'โอกาส Double Attack', unit: '%', group: 'offence' },
  perfect_dodge: { label: 'Perfect Dodge', group: 'defence' },
  def: { label: 'DEF', group: 'defence' }, mdef: { label: 'MDEF', group: 'defence' },
  aspd: { label: 'ASPD', group: 'offence' }, aspd_percent: { label: 'ASPD', unit: '%', group: 'offence' },
  attack_delay_percent: { label: 'ดีเลย์หลังตี', unit: '%', group: 'offence' },
  global_delay_percent: { label: 'ดีเลย์หลังร่าย', unit: '%', group: 'cast' },
  damage_percent: { label: 'ตี{t}', unit: '%', group: 'offence' },
  ranged_damage_percent: { label: 'ดาเมจระยะไกล', unit: '%', group: 'offence' },
  magic_damage_percent: { label: 'ดาเมจเวท{t}', unit: '%', group: 'offence' },
  skill_damage_percent: { label: 'ดาเมจ {s}', unit: '%', group: 'offence' },
  ignore_def_percent: { label: 'ทะลุ DEF{t}', unit: '%', group: 'offence' },
  ignore_mdef_percent: { label: 'ทะลุ MDEF{t}', unit: '%', group: 'offence' },
  damage_taken_percent: { label: 'ดาเมจที่โดนจาก{t}', unit: '%', group: 'defence' },
  magic_damage_taken_percent: { label: 'ดาเมจเวทที่โดน{t}', unit: '%', group: 'defence' },
  resistance_percent: { label: 'กัน{t}', unit: '%', group: 'defence' },
  cast_time_variable_percent: { label: 'ร่ายแปรผัน{s}', unit: '%', group: 'cast' },
  cast_time_fixed_percent: { label: 'ร่ายคงที่{s}', unit: '%', group: 'cast' },
  sp_cost_percent: { label: 'SP ที่ใช้', unit: '%', group: 'cast' },
  skill_sp_cost_flat: { label: 'SP ที่ใช้ {s}', group: 'cast' },
  heal_amount_percent: { label: 'ฮีลแรงขึ้น', unit: '%', group: 'cast' },
  heal_received_percent: { label: 'โดนฮีลแรงขึ้น', unit: '%', group: 'defence' },
  sp_per_hit: { label: 'ฟื้น SP ทุกครั้งที่ตีโดน', group: 'cast' },
  item_heal_percent: { label: 'ยาฟื้น HP ได้มากขึ้น', unit: '%', group: 'defence' },
  hp_recovery_percent: { label: 'ฟื้น HP เอง', unit: '%', group: 'defence' },
  sp_recovery_percent: { label: 'ฟื้น SP เอง', unit: '%', group: 'cast' },
  exp_percent: { label: 'EXP', unit: '%', group: 'utility' },
  job_exp_percent: { label: 'Job EXP', unit: '%', group: 'utility' },
  drop_rate_percent: { label: 'อัตราดรอป', unit: '%', group: 'utility' },
};

/** One bonus as a short line: "ตีเผ่ากึ่งมนุษย์ +10%", "ร่ายแปรผัน -30%". */
export function bonusText([type, value, target, per, skill, scaling]: Bonus): string {
  // Effects with no number of their own (build simulator buffs).
  if (type === 'endow') return `อาวุธเป็น${targetLabel(target) ?? ''}`;
  if (type === 'no_size_penalty') return 'ไม่โดนหักดาเมจตามขนาดมอน';
  if (target?.startsWith('skill_element:')) return `ดาเมจเวทธาตุ${(targetLabel(target.replace('skill_', '')) ?? '').replace('ธาตุ', '')} ${value > 0 ? '+' : ''}${value}%`;
  const info = BONUS_TYPES[type];
  const t = targetLabel(target);
  let label = info?.label ?? type;
  // A Thai target after a Latin word needs a space ("ทะลุ MDEF ผู้เล่น"); after
  // Thai it runs on ("ตีเผ่าแมลง").
  const at = label.indexOf('{t}');
  const space = at > 0 && /[A-Za-z]/.test(label.charAt(at - 1)) ? ' ' : '';
  label = label.replace('{t}', t ? `${space}${t}` : '');
  label = label.replace('{s}', skill ? ` ${skill}` : '').replace(/\s+/g, ' ').trim();
  // "ตี" with no target is just more damage.
  if (type === 'damage_percent' && !t) label = 'ดาเมจ';
  if (type === 'damage_taken_percent' && !t) label = 'ดาเมจที่โดนทุกแบบ';
  const num = `${value > 0 ? '+' : ''}${value}${info?.unit ?? ''}`;
  if (scaling) return `${label} ${num} ต่อเลเวล ${scaling}`;
  return per ? `${label} ${num} ทุก +${per}` : `${label} ${num}`;
}

// Effects where a lower number is the good one (less damage taken, shorter cast).
const LOWER_IS_BETTER = new Set([
  'damage_taken_percent', 'magic_damage_taken_percent', 'cast_time_variable_percent', 'cast_time_fixed_percent',
  'attack_delay_percent', 'global_delay_percent', 'sp_cost_percent', 'skill_sp_cost_flat',
]);

/** A bonus that makes the character worse (MaxHP -2%), drawn differently. */
export function isPenalty([type, value]: Bonus): boolean {
  return LOWER_IS_BETTER.has(type) ? value > 0 : value < 0;
}

/** When a group holds, in words; null when it always does. */
export function conditionText(c: BonusCondition): string | null {
  const parts: string[] = [];
  if (c.refine) parts.push(`ตีบวก +${c.refine} ขึ้นไป`);
  if (c.refineSum) parts.push(`ตีบวกรวมทั้งชุด +${c.refineSum} ขึ้นไป`);
  if (c.level) parts.push(`เลเวล ${c.level} ขึ้นไป`);
  if (c.classes?.length) parts.push(`เฉพาะ ${c.classes.join(', ')}`);
  if (c.siege) parts.push('เฉพาะในวอร์');
  if (c.proc) parts.push(c.proc === 'on_skill_use' ? 'ตอนใช้สกิล' : 'มีโอกาสติดตอนตี/โดนตี');
  if (c.event) parts.push('ช่วงอีเวนต์');
  if (c.text) parts.push('มีเงื่อนไข ดูข้อความในเกม');
  return parts.length ? parts.join(' · ') : null;
}

/** Every effect type an item has, for filtering lists. */
export function effectTypes(effects: ItemEffects | null): Set<string> {
  const out = new Set<string>();
  for (const g of effects?.g ?? []) for (const b of g.b) out.add(b[0]);
  return out;
}

/**
 * ATK (weapon; MATK is the same) or DEF (armour) an item has at a refine
 * level, from the official refine table on /tools/refine (lib/refine-table):
 * the base line plus the extra high refines add. prontera.info's schedule
 * carries the base line only -- 50 at +10 for a level 3 weapon where the
 * official table gives 50 + 40 -- so the schedule key comes from there and
 * the numbers do not.
 */
export function refineBonusAt(schedule: string | undefined, refine: number): { stat: 'ATK' | 'DEF'; value: number } | null {
  if (!schedule || refine < 1 || refine > ARMOUR_DEF.length) return null;
  if (schedule === 'armor') return { stat: 'DEF', value: ARMOUR_DEF[refine - 1] };
  const m = /^weapon_lv([1-4])$/.exec(schedule);
  if (!m) return null;
  const key = `weapon${m[1]}` as keyof typeof WEAPON_ATK;
  return { stat: 'ATK', value: WEAPON_ATK[key][refine - 1] + WEAPON_ATK_BONUS[key][refine - 1] };
}

/**
 * What a player filters gear and cards by ("ของที่เพิ่ม FLEE"). Each filter
 * gathers the bonus types that answer it; a target prefix narrows it to one
 * kind of target (any race, any element).
 */
export interface EffectFilter {
  key: string;
  label: string;
  types: string[];
  target?: string;
}

export const EFFECT_FILTERS: EffectFilter[] = [
  { key: 'str', label: 'STR', types: ['str'] },
  { key: 'agi', label: 'AGI', types: ['agi'] },
  { key: 'vit', label: 'VIT', types: ['vit'] },
  { key: 'int', label: 'INT', types: ['int'] },
  { key: 'dex', label: 'DEX', types: ['dex'] },
  { key: 'luk', label: 'LUK', types: ['luk'] },
  { key: 'atk', label: 'ATK', types: ['atk', 'atk_percent'] },
  { key: 'matk', label: 'MATK', types: ['matk', 'matk_percent'] },
  { key: 'hit', label: 'HIT', types: ['hit'] },
  { key: 'flee', label: 'FLEE', types: ['flee', 'perfect_dodge'] },
  { key: 'crit', label: 'CRI / คริแรง', types: ['crit', 'crit_damage_percent'] },
  { key: 'aspd', label: 'ASPD / ดีเลย์หลังตี', types: ['aspd', 'aspd_percent', 'attack_delay_percent'] },
  { key: 'cast', label: 'ลดร่าย / ดีเลย์หลังร่าย', types: ['cast_time_variable_percent', 'cast_time_fixed_percent', 'global_delay_percent'] },
  { key: 'race', label: 'ตีเผ่า', types: ['damage_percent'], target: 'race:' },
  { key: 'element', label: 'ตีธาตุ', types: ['damage_percent'], target: 'element:' },
  { key: 'size', label: 'ตีตามขนาด', types: ['damage_percent'], target: 'size:' },
  { key: 'boss', label: 'ตีบอส / มอนธรรมดา', types: ['damage_percent'], target: 'monster_kind:' },
  { key: 'ignoredef', label: 'ทะลุ DEF / MDEF', types: ['ignore_def_percent', 'ignore_mdef_percent'] },
  { key: 'skill', label: 'ดาเมจสกิล', types: ['skill_damage_percent'] },
  { key: 'guardrace', label: 'กันเผ่า', types: ['damage_taken_percent'], target: 'race:' },
  { key: 'guardelement', label: 'กันธาตุ', types: ['damage_taken_percent', 'resistance_percent'], target: 'element:' },
  { key: 'status', label: 'กันสถานะ (สตัน ใบ้ ...)', types: ['resistance_percent'], target: 'status:' },
  { key: 'hp', label: 'MaxHP', types: ['hp', 'hp_percent'] },
  { key: 'sp', label: 'MaxSP', types: ['sp', 'sp_percent'] },
  { key: 'def', label: 'DEF / MDEF', types: ['def', 'mdef'] },
  { key: 'heal', label: 'ฮีล / ยาฟื้น', types: ['heal_amount_percent', 'heal_received_percent', 'item_heal_percent'] },
  { key: 'regen', label: 'ฟื้น HP/SP เอง', types: ['hp_recovery_percent', 'sp_recovery_percent', 'sp_per_hit'] },
  { key: 'exp', label: 'EXP / ดรอป', types: ['exp_percent', 'job_exp_percent', 'drop_rate_percent'] },
];

export function effectFilter(key: string | undefined): EffectFilter | null {
  return EFFECT_FILTERS.find((f) => f.key === key) ?? null;
}

/**
 * The bonuses of an item that answer a filter, unconditional ones first. Empty
 * when the item has none -- including ones that only hold at +7 or in siege,
 * which still count: a player filtering for FLEE wants to see those too.
 */
export function matchingBonuses(effects: ItemEffects | null, filter: EffectFilter): { bonus: Bonus; when: string | null }[] {
  const out: { bonus: Bonus; when: string | null }[] = [];
  for (const g of effects?.g ?? []) {
    for (const b of g.b) {
      if (!filter.types.includes(b[0])) continue;
      if (filter.target && !(b[2] ?? '').startsWith(filter.target)) continue;
      out.push({ bonus: b, when: conditionText(g.c) });
    }
  }
  return out.sort((a, b) => Number(a.when !== null) - Number(b.when !== null));
}

/** For sorting a filtered list: the biggest unconditional number that answers the filter. */
export function filterStrength(effects: ItemEffects | null, filter: EffectFilter): number {
  const always = matchingBonuses(effects, filter).filter((m) => m.when === null);
  const value = (b: Bonus) => (LOWER_IS_BETTER.has(b[0]) ? -b[1] : b[1]);
  return always.length ? Math.max(...always.map((m) => value(m.bonus))) : -Infinity;
}

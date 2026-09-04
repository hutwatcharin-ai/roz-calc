// Physical damage per hit against one monster.
//
// Until now every kill-rate figure on this site started from a number the
// player typed in ("ดาเมจต่อครั้ง"), which a new player cannot answer without
// going and standing somewhere. Everything needed to work it out is already
// here: the monster's DEF, level, VIT, size and element, our two multiplier
// tables, and the ATK the game's own status window prints.
//
// The chain follows prontera.info's published formula, which its site labels
// verified in-game on 2026-08-18:
//
//   damage = max(1, floor((weaponAtk × sizeMod × elementMod
//                          + restAtk × neutralMod) × defFactor − mobSoftDef))
//   defFactor  = (4000 + mobDef) / (4000 + 10 × mobDef)
//   mobSoftDef = floor((mobLevel + mobVit) / 2)
//
// The split matters: only the weapon's own ATK carries the weapon's element
// and takes the size penalty. Status ATK (the part that comes from your STR
// and level) is always Neutral and never shrinks against a Large monster, so
// a Dagger user is not doing half damage overall the way the size table alone
// would suggest.
//
// What this does NOT include, and so must never be sold as exact: weapon
// damage variance (the game rolls a range), mastery ATK from passive skills,
// card and gear lines that only apply to a race or element, and any skill
// multiplier. It is the auto-attack floor against that monster, not the number
// on your screen when everything procs.

import { elementModifier, type Element, type ElementLevel } from './element-table';
import { SIZE_TABLE, type MonsterSize } from './size-table';

export interface DamageInput {
  /** ATK printed on the weapon itself (plus its refine), the part that carries element and size. */
  weaponAtk: number;
  /** Everything else: status ATK from stats, plus flat ATK from other gear. Always Neutral. */
  statusAtk: number;
  /** Weapon row name from SIZE_TABLE, e.g. "Dagger". */
  weaponType: string;
  weaponElement: Element;
  /** Accepts the capitalised form the monsters table stores. */
  targetSize: MonsterSize | string | null;
  targetElement: Element | null;
  targetElementLevel: ElementLevel | null;
  targetDef: number | null;
  targetLevel: number | null;
  targetVit: number | null;
}

export interface DamageBreakdown {
  damage: number;
  sizeModifier: number;
  elementModifier: number;
  /** Neutral share's own element multiplier -- status ATK is Neutral, not your weapon's element. */
  neutralModifier: number;
  defFactor: number;
  softDef: number;
}

export function sizeModifier(weaponType: string, size: MonsterSize | string | null): number {
  if (!size) return 1;
  // monsters.size is stored capitalised ("Medium"); the table is keyed
  // lowercase. Reading it raw returned undefined and turned the whole damage
  // figure into NaN on every monster page (caught on Orc Zombie, 4 Sep 2026).
  const key = String(size).toLowerCase();
  if (key !== 'small' && key !== 'medium' && key !== 'large') return 1;
  const row = SIZE_TABLE.find((r) => r.weapon === weaponType);
  if (!row) return 1;
  return row[key] / 100;
}

/**
 * Damage one auto-attack lands, or null when the monster row is missing a
 * value the formula needs. Null means "we cannot say", never 0 -- a monster
 * whose DEF we do not know is not a monster you hit for nothing.
 */
export function physicalDamagePerHit(input: DamageInput): DamageBreakdown | null {
  const { weaponAtk, statusAtk, weaponType, weaponElement } = input;
  const { targetSize, targetElement, targetElementLevel, targetDef, targetLevel, targetVit } = input;

  if (!Number.isFinite(weaponAtk) || !Number.isFinite(statusAtk)) return null;
  if (weaponAtk < 0 || statusAtk < 0 || weaponAtk + statusAtk <= 0) return null;
  // DEF and level decide the two reductions; without them the answer would be
  // a damage figure against a monster with no defence, which is not this
  // monster.
  if (targetDef === null || targetLevel === null) return null;

  const size = sizeModifier(weaponType, targetSize);
  // An unknown element cannot be guessed as Neutral: Neutral is a real element
  // with real multipliers, so assuming it would state a matchup we do not have.
  const element =
    targetElement && targetElementLevel
      ? elementModifier(weaponElement, targetElement, targetElementLevel)
      : null;
  const neutral =
    targetElement && targetElementLevel
      ? elementModifier('Neutral', targetElement, targetElementLevel)
      : null;
  if (element === null || neutral === null) return null;

  const defFactor = (4000 + targetDef) / (4000 + 10 * targetDef);
  const softDef = Math.max(0, Math.floor((targetLevel + (targetVit ?? 0)) / 2));

  const raw = (weaponAtk * size * (element / 100) + statusAtk * (neutral / 100)) * defFactor - softDef;

  return {
    damage: Math.max(1, Math.floor(raw)),
    sizeModifier: size,
    elementModifier: element,
    neutralModifier: neutral,
    defFactor,
    softDef,
  };
}

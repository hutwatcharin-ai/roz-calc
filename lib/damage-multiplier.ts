// Element and size, multiplied together.
//
// Both tables come from the official guide and both are already on the site,
// but separately -- which leaves the reader doing the one piece of arithmetic
// that decides the answer. A Book against a Large Undead monster is 50% for
// size and can be 200% for element: the size penalty that looks fatal alone is
// not, and the element bonus that looks decisive is halved.
//
// What this file does NOT do is produce damage. Zero's damage formula is not
// something the site has confirmed, and ATK, DEF, cards and skill modifiers all
// sit between these multipliers and a number on screen. Everything here is
// "how much of your hit lands", and it is labelled that way throughout.

import { ELEMENTS, elementModifier, type Element, type ElementLevel } from './element-table';
import { SIZE_TABLE, sizeModifier, type MonsterSize, type WeaponSizeRow } from './size-table';

export interface Combo {
  weapon: WeaponSizeRow;
  attack: Element;
  /** The element table's percentage. */
  element: number;
  /** The size table's percentage. */
  size: number;
  /** The two multiplied, as a percentage. 100 means a full hit. */
  total: number;
}

/** The two tables multiplied. Percentages in, percentage out. */
export function combine(elementPercent: number, sizePercent: number): number {
  return (elementPercent * sizePercent) / 100;
}

export function comboFor(
  weapon: WeaponSizeRow,
  attack: Element,
  defence: Element,
  defenceLevel: ElementLevel,
  size: MonsterSize,
): Combo {
  const element = elementModifier(attack, defence, defenceLevel);
  const sizeValue = sizeModifier(weapon, size);
  return { weapon, attack, element, size: sizeValue, total: combine(element, sizeValue) };
}

/**
 * Every weapon type against every attack element, best first. Ties are broken
 * by the element table so the order does not wander between renders.
 */
export function rankCombos(
  defence: Element,
  defenceLevel: ElementLevel,
  size: MonsterSize,
): Combo[] {
  const all: Combo[] = [];
  for (const weapon of SIZE_TABLE) {
    for (const attack of ELEMENTS) {
      all.push(comboFor(weapon, attack, defence, defenceLevel, size));
    }
  }
  return all.sort((a, b) => b.total - a.total || b.element - a.element);
}

/**
 * The attack elements, best first, for a target -- independent of weapon, since
 * the size multiplier scales every element by the same amount and so cannot
 * change their order.
 */
export function rankElements(
  defence: Element,
  defenceLevel: ElementLevel,
): { attack: Element; element: number }[] {
  return ELEMENTS.map((attack) => ({ attack, element: elementModifier(attack, defence, defenceLevel) })).sort(
    (a, b) => b.element - a.element,
  );
}

/**
 * The best total available against a target, used to say how far off a given
 * choice is. Returns 0 when the target is immune to everything at hand, which
 * is a real state -- Ghost 4 against a physical hit with no Ghost weapon.
 */
export function bestTotal(defence: Element, defenceLevel: ElementLevel, size: MonsterSize): number {
  return rankCombos(defence, defenceLevel, size)[0]?.total ?? 0;
}

/**
 * How a chosen combo compares to the best one available, as a percentage of it.
 * Null when nothing lands at all, because "0% of 0" is not a shortfall anyone
 * can act on.
 */
export function shareOfBest(chosen: Combo, best: number): number | null {
  if (best <= 0) return null;
  return (chosen.total / best) * 100;
}

/**
 * Every attack element tied for best against a target. Usually more than one --
 * Wind and Poison both hit Water for 150 -- and listing only the first would
 * send players hunting one element when another they already own does the same.
 */
export function bestElements(defence: Element, defenceLevel: ElementLevel): Element[] {
  const ranked = rankElements(defence, defenceLevel);
  const top = ranked[0]?.element ?? 0;
  return ranked.filter((row) => row.element === top).map((row) => row.attack);
}

/**
 * Weapon types ranked for one attack element against one target. This is the
 * table worth showing: ranking all weapon-and-element pairs together puts
 * twenty identical best scores at the top and says nothing.
 */
export function rankWeapons(
  attack: Element,
  defence: Element,
  defenceLevel: ElementLevel,
  size: MonsterSize,
): Combo[] {
  return SIZE_TABLE.map((weapon) => comboFor(weapon, attack, defence, defenceLevel, size)).sort(
    (a, b) => b.total - a.total,
  );
}

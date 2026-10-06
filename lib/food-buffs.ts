// Food and buff items that raise HIT, FLEE or CRI, directly or through DEX,
// AGI and LUK (data/food-buffs.json, from roz.prontera.info's buff table).
// The gain follows the verified formulas (lib/hit-flee): DEX and HIT add to
// HIT one for one, AGI and FLEE to FLEE, LUK adds a third to HIT, a fifth to
// FLEE and 0.3 to CRI. LUK's share is floored on the total in game, so the
// figure for LUK alone is approximate.

import file from '@/data/food-buffs.json';
import { isAbsentFromGame } from '@/lib/game-absent';

export interface FoodBuff {
  id: number;
  name: string;
  b: Record<string, number>;
  text: string;
}

const FOODS = (file as unknown as { foods: FoodBuff[] }).foods.filter((f) => !isAbsentFromGame(f.id));

export type Aim = 'hit' | 'flee' | 'crit';

export function foodGain(food: FoodBuff, aim: Aim): number {
  const b = food.b;
  if (aim === 'hit') return (b.hit ?? 0) + (b.dex ?? 0) + (b.luk ?? 0) / 3;
  if (aim === 'flee') return (b.flee ?? 0) + (b.agi ?? 0) + (b.luk ?? 0) / 5;
  return (b.crit ?? 0) + (b.luk ?? 0) * 0.3;
}

/** The foods that raise `aim`, biggest first. */
export function foodsFor(aim: Aim): { food: FoodBuff; gain: number }[] {
  return FOODS.map((food) => ({ food, gain: foodGain(food, aim) }))
    .filter((f) => f.gain >= 1)
    .sort((a, b) => b.gain - a.gain || a.food.name.localeCompare(b.food.name));
}

const LABEL: Record<string, string> = { str: 'STR', agi: 'AGI', vit: 'VIT', int: 'INT', dex: 'DEX', luk: 'LUK', hit: 'HIT', flee: 'FLEE', crit: 'CRI', perfect_dodge: 'Perfect Dodge', aspd: 'ASPD', aspd_percent: 'ASPD %', atk: 'ATK', matk: 'MATK' };

/** "DEX +10 · LUK +5" */
export function foodText(food: FoodBuff): string {
  return Object.entries(food.b).map(([k, v]) => `${LABEL[k] ?? k} ${v > 0 ? '+' : ''}${v}`).join(' · ');
}

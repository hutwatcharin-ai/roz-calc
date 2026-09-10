// Which quests ask for an item.
//
// The link ran one way only: quest text carries its items as "[Hard Horn]947"
// and lib/quest-item-refs turns each into a link, so a quest page pointed at
// 92 item pages and not one of them pointed back. "Do I need this for
// anything" is the question a player asks before selling a stack.
//
// The reference carries the id, so this is an exact join and not a name
// match -- worth saying because the same page's monster equivalent is not
// possible: quest text names monsters in prose ("Kill 20 evil skeleton
// pirates"), and matching that to a row in the monsters table produced wrong
// answers more often than right ones, so it is not published at all.

import { supabaseBrowser } from './supabase';

export interface QuestNeedingItem {
  id: number;
  name: string;
  name_th: string | null;
  town_key: string;
}

/**
 * Does this text really reference that item?
 *
 * The SQL `%]<id>%` filter below is a prefilter and nothing more: searching
 * for 947 also matches "[Something]9470". The id has to be the whole number
 * that follows the bracketed name.
 */
export function referencesItem(text: string | null | undefined, itemId: number): boolean {
  if (!text) return false;
  return new RegExp(`\\[[^\\]]+\\]${itemId}(?!\\d)`).test(text);
}

export async function questsForItem(itemId: number): Promise<QuestNeedingItem[]> {
  const like = `%]${itemId}%`;
  const { data, error } = await supabaseBrowser()
    .from('quests')
    .select('id, name, name_th, town_key, objective, objective_th, description, description_th')
    .or(`objective.ilike.${like},objective_th.ilike.${like},description.ilike.${like},description_th.ilike.${like}`)
    .order('id');
  if (error) {
    console.error('quests-for-item query failed', error);
    return [];
  }
  return (data ?? [])
    .filter((row) =>
      [row.objective, row.objective_th, row.description, row.description_th].some((text) => referencesItem(text, itemId)),
    )
    .map((row) => ({ id: row.id, name: row.name, name_th: row.name_th, town_key: row.town_key }));
}

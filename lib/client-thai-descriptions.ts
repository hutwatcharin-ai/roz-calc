// Thai item descriptions taken whole from a Thai RO client's item table.
//
// The site translates descriptions line by line from a hand-built dictionary
// (lib/item-description-th), which is exact but slow to grow: 58 items read
// fully in Thai and 3,714 read entirely in English. This file is the other
// kind of answer -- a whole description, already written in Thai by Gravity's
// own localisation, for the items where our dictionary has nothing at all.
//
// It is a fallback and never an override. Where the dictionary can translate
// a line, the dictionary wins: it is built against this game's own text, and
// this file is not (see scripts/build-item-descriptions-th.mjs for the source
// and for the number check every published line had to pass).

import file from '@/data/item-descriptions-th.json';

const data = file as { _meta: Record<string, unknown>; items: Record<string, string[]> };

/** Thai lines for an item, or null when this file has none. */
export function clientThaiDescription(itemId: number): string[] | null {
  return data.items[String(itemId)] ?? null;
}

export const CLIENT_THAI_COUNT = Object.keys(data.items).length;
export const CLIENT_THAI_META = data._meta;

// The Thai names players use for a monster or item.
//
// The site stores English names because that is what the game client shows,
// and the on-site search log is almost entirely English -- people who are
// already here type what they read on screen. Google tells a different
// story: over 90 days to 7 Sep 2026, Search Console recorded Thai searches
// for คาราเมล (Caramel), วอมเทล (Worm Tail), โซฮี (Sohee), หมาฟ้า ("blue
// dog", Wolf), เข้เล็ก ("little crocodile", Alligator), เห็ดม่วง ("purple
// mushroom", Poison Spore) and การ์ดเทเลพอต ("teleport card", Creamy Card)
// -- and put us at position 8 to 66 for them, because none of those words
// appears anywhere on the page.
//
// Two kinds are mixed together and both matter: a Thai spelling of the
// English name, and a nickname for what the thing looks like or does. A
// nickname cannot be derived from the name at all, which is why this file
// is a record of observed searches rather than a translation table --
// nothing here is invented. data/aliases-th.json carries the query and its
// impressions so every entry can be checked.

import aliases from '@/data/aliases-th.json';

export interface ThaiAlias {
  name: string;
  /** Why this is the name: a transliteration, or what the nickname means. */
  why: string;
  /** The search that evidences it. */
  query: string;
  impressions: number;
  position: number;
}

type AliasFile = {
  monsters: Record<string, ThaiAlias[]>;
  items: Record<string, ThaiAlias[]>;
};

const data = aliases as unknown as AliasFile;

export function thaiAliases(kind: 'monsters' | 'items', id: number | string): ThaiAlias[] {
  return data[kind][String(id)] ?? [];
}

/** Just the names, for a title, a description, or a search haystack. */
export function thaiAliasNames(kind: 'monsters' | 'items', id: number | string): string[] {
  return thaiAliases(kind, id).map((a) => a.name);
}

/** Every id that has at least one alias, for tests and for coverage counts. */
export function aliasedIds(kind: 'monsters' | 'items'): number[] {
  return Object.keys(data[kind]).map(Number).sort((a, b) => a - b);
}

/**
 * Ids whose Thai alias answers this query, so a list page can find them
 * even though its own column holds the English name. Matched loosely: a
 * player typing "คาราเมล ro" or "หมาฟ้า" should land on the monster.
 */
export function aliasIdsFor(kind: 'monsters' | 'items', query: string): number[] {
  const q = query.toLowerCase().replace(/\s+/g, '');
  if (q.length < 2) return [];
  const out: number[] = [];
  for (const [id, list] of Object.entries(data[kind])) {
    for (const alias of list) {
      const name = alias.name.replace(/\s+/g, '');
      if (q.includes(name) || name.includes(q)) {
        out.push(Number(id));
        break;
      }
    }
  }
  return out;
}

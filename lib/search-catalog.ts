// Every searchable name on the site, in one place, so a page whose own
// search found nothing can still answer.
//
// The two things this exists for, both taken from real logs (7 Sep 2026):
// someone searched "clip" on the items page when Clip is equipment, and
// someone searched "muffer" anywhere when the name is Muffler. Neither is
// answerable from the page's own rows, so both need the whole catalogue.
//
// One read per revalidate window (the pages are ISR at 24h), name and id
// only -- about 5,700 rows across five kinds, a few hundred kB, and it is
// only ever fetched when a search returns nothing.

import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { isCVariant } from '@/lib/c-variant';
import { itemHref } from '@/lib/item-href';
import { rankMatches, suggest, type Suggestion } from '@/lib/smart-search';
import { thaiAliasNames } from '@/lib/thai-aliases';

export type SearchKind = 'monsters' | 'equipment' | 'costumes' | 'cards' | 'items' | 'maps';

export const KIND_LABELS: Record<SearchKind, string> = {
  monsters: 'มอนสเตอร์',
  equipment: 'อุปกรณ์',
  costumes: 'คอสตูม',
  cards: 'การ์ด',
  items: 'ไอเทม',
  maps: 'แมพ',
};

export interface CatalogEntry {
  kind: SearchKind;
  name: string;
  href: string;
}

const EQUIPMENT = ['Armor', 'Weapon'];

function itemKind(category: string | null): SearchKind {
  if (category === 'Card') return 'cards';
  if (category === 'Costume Equipment') return 'costumes';
  if (category && EQUIPMENT.includes(category)) return 'equipment';
  return 'items';
}

export async function loadCatalog(): Promise<CatalogEntry[]> {
  const db = supabaseBrowser();
  const out: CatalogEntry[] = [];

  const { data: monsters, error: monstersError } = await db
    .from('monsters')
    .select('id, name_en')
    .order('id')
    .range(0, 1999);
  if (monstersError) console.error('search catalog: monsters failed', monstersError);
  for (const m of monsters ?? []) {
    // Challenge clones are hidden on every other surface; suggesting one
    // here would be the only place on the site that names them unasked.
    if (isCVariant(m.name_en)) continue;
    out.push({ kind: 'monsters', name: m.name_en, href: `/database/monsters/${m.id}` });
    // The Thai names players use, as their own catalogue entries: typing
    // คาราเมล on any page should find Caramel even though the row is
    // English (lib/thai-aliases).
    for (const alias of thaiAliasNames('monsters', m.id)) {
      out.push({ kind: 'monsters', name: alias, href: `/database/monsters/${m.id}` });
    }
  }

  const { data: items, error: itemsError } = await fetchAllRows<{
    id: number;
    name_en: string;
    category: string | null;
  }>((from, to) => db.from('items').select('id, name_en, category').order('id').range(from, to));
  if (itemsError) console.error('search catalog: items failed', itemsError);
  for (const i of items ?? []) {
    out.push({ kind: itemKind(i.category), name: i.name_en, href: itemHref(i.id, i.category) });
    for (const alias of thaiAliasNames('items', i.id)) {
      out.push({ kind: itemKind(i.category), name: alias, href: itemHref(i.id, i.category) });
    }
  }

  const { data: maps, error: mapsError } = await db
    .from('map_stats')
    .select('map_code, map_display_name')
    .order('map_code')
    .range(0, 1999);
  if (mapsError) console.error('search catalog: maps failed', mapsError);
  for (const m of maps ?? []) {
    out.push({
      kind: 'maps',
      name: m.map_display_name ?? m.map_code,
      href: `/database/maps/${encodeURIComponent(m.map_code)}`,
    });
  }

  return out;
}

export interface SearchMiss {
  /** Closest names in the section the player was already searching. */
  didYouMean: CatalogEntry[];
  /** Rows in OTHER sections that answer the query as typed. */
  elsewhere: CatalogEntry[];
}

/**
 * What to offer after a search that found nothing.
 *
 * Order of usefulness, from the log: an exact hit in another section
 * ("clip" on the items page) beats a near miss in this one, so the two
 * lists are kept apart and the page shows the other-section one first.
 */
export function searchMiss(catalog: CatalogEntry[], query: string, kind: SearchKind | null): SearchMiss {
  const own = kind ? catalog.filter((e) => e.kind === kind) : catalog;
  const others = kind ? catalog.filter((e) => e.kind !== kind) : [];

  const seen = new Set<string>();
  const dedupe = (rows: Suggestion<CatalogEntry>[]) =>
    rows
      .map((r) => r.item)
      .filter((e) => {
        const key = `${e.kind}:${e.name}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

  // "Elsewhere" is a real match, not a guess -- the same rule the page
  // itself applies, run over the other sections. Nothing speculative gets
  // presented as if the player had simply opened the wrong page.
  const elsewhere = dedupe(
    rankMatches(others, query, (e) => e.name)
      .slice(0, 6)
      .map((item) => ({ item, score: 1 })),
  );
  // A real hit in another section IS the answer; guesses underneath it read
  // as noise ("clip" found Clip in equipment, then offered Ancient Lips).
  const didYouMean = elsewhere.length > 0 ? [] : dedupe(suggest(own, query, (e) => e.name, { limit: 5 }));
  return { didYouMean, elsewhere };
}

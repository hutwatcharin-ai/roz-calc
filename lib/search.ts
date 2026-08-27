// Search covers everything the site lists. A player who types a card name and
// gets nothing stops trusting the box, and two deferred design changes -- the
// search-led nav and the search-led homepage -- are both blocked on this
// covering all six.

export type SearchType = 'monster' | 'item' | 'card' | 'equipment' | 'skill' | 'map';

export interface SearchRow {
  id: number;
  name_en: string;
  image_url?: string | null;
  icon_url?: string | null;
}

export interface SkillSearchRow {
  slug: string;
  name: string;
  icon_url?: string | null;
}

export interface MapSearchRow {
  map_code: string;
  map_display_name: string | null;
}

export interface SearchGroups {
  monsters: SearchRow[];
  items: SearchRow[];
  cards: SearchRow[];
  equipment: SearchRow[];
  skills: SkillSearchRow[];
  maps: MapSearchRow[];
}

export interface SearchResult {
  // A string, because skills are keyed by slug and maps by code.
  id: string;
  type: SearchType;
  name: string;
  href: string;
  iconUrl: string | null;
}

export const SEARCH_TYPE_LABELS: Record<SearchType, string> = {
  monster: 'มอนสเตอร์',
  item: 'ไอเทม',
  card: 'การ์ด',
  equipment: 'อุปกรณ์',
  skill: 'สกิล',
  map: 'แมพ',
};

function fromItemRow(row: SearchRow, type: SearchType): SearchResult {
  return {
    id: String(row.id),
    type,
    name: row.name_en,
    // Cards and equipment are items and share the item detail page. The badge
    // is what tells the player which kind of thing they found.
    href: `/database/items/${row.id}`,
    iconUrl: row.icon_url ?? null,
  };
}

export function mergeSearchResults(groups: SearchGroups): SearchResult[] {
  return [
    ...groups.monsters.map((m) => ({
      id: String(m.id),
      type: 'monster' as const,
      name: m.name_en,
      href: `/database/monsters/${m.id}`,
      iconUrl: m.image_url ?? null,
    })),
    ...groups.items.map((i) => fromItemRow(i, 'item')),
    ...groups.cards.map((c) => fromItemRow(c, 'card')),
    ...groups.equipment.map((e) => fromItemRow(e, 'equipment')),
    ...groups.skills.map((s) => ({
      id: s.slug,
      type: 'skill' as const,
      name: s.name,
      // There is no skill detail page: the browser's own search is the
      // destination, which keeps the result honest about what exists.
      href: `/database/skills?q=${encodeURIComponent(s.name)}`,
      iconUrl: s.icon_url ?? null,
    })),
    ...groups.maps.map((m) => ({
      id: m.map_code,
      type: 'map' as const,
      // Only 245 of 497 maps have a display name; a blank row is worse than
      // one showing the code.
      name: m.map_display_name ?? m.map_code,
      href: `/database/maps/${encodeURIComponent(m.map_code)}`,
      iconUrl: null,
    })),
  ];
}

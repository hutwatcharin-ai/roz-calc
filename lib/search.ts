// Search covers everything the site lists. A player who types a card name and
// gets nothing stops trusting the box, and two deferred design changes -- the
// search-led nav and the search-led homepage -- are both blocked on this
// covering all six.

import { isInGameSkill } from './zero-jobs';

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
  // Which tab a skill's own detail row lives under on the skills page hinges
  // on this. Optional/null/[] all mean "no class tag" -- isInGameSkill treats
  // them the same way, so the href logic below must too.
  classes?: string[] | null;
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
    ...groups.skills.map((s) => {
      // The skills page defaults to its "ingame" tab and filters to
      // isInGameSkill(classes) before applying q. A skill that fails that
      // check does not exist on the tab the plain href lands on -- the same
      // failure this task exists to fix, one hop later -- so its href must
      // say which tab it actually lives in.
      const inGame = isInGameSkill(s.classes ?? null);
      const qs = `q=${encodeURIComponent(s.name)}${inGame ? '' : '&tab=unreleased'}`;
      return {
        id: s.slug,
        type: 'skill' as const,
        name: s.name,
        href: `/database/skills?${qs}`,
        iconUrl: s.icon_url ?? null,
      };
    }),
    ...groups.maps.map((m) => ({
      id: m.map_code,
      type: 'map' as const,
      // Defensive fallback, not a gap this data actually has: every row
      // carries a display name today (111 of 497 just repeat their own
      // map_code; 245 is the count of distinct names across all 497). The
      // column's type still allows null, so a future row without one falls
      // back to the code rather than rendering blank.
      name: m.map_display_name ?? m.map_code,
      href: `/database/maps/${encodeURIComponent(m.map_code)}`,
      iconUrl: null,
    })),
  ];
}

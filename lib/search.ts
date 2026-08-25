export interface SearchRow {
  id: number;
  name_en: string;
  image_url?: string | null;
  icon_url?: string | null;
}

export interface SearchResult {
  type: 'monster' | 'item';
  id: number;
  name: string;
  href: string;
  iconUrl: string | null;
}

export function mergeSearchResults(monsters: SearchRow[], items: SearchRow[]): SearchResult[] {
  const monsterResults: SearchResult[] = monsters.map((m) => ({
    type: 'monster',
    id: m.id,
    name: m.name_en,
    href: `/database/monsters/${m.id}`,
    iconUrl: m.image_url ?? null,
  }));

  const itemResults: SearchResult[] = items.map((i) => ({
    type: 'item',
    id: i.id,
    name: i.name_en,
    href: `/database/items/${i.id}`,
    iconUrl: i.icon_url ?? null,
  }));

  return [...monsterResults, ...itemResults];
}

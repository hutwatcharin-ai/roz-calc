export interface SearchRow {
  id: number;
  name_en: string;
}

export interface SearchResult {
  type: 'monster' | 'item';
  id: number;
  name: string;
  href: string;
}

export function mergeSearchResults(monsters: SearchRow[], items: SearchRow[]): SearchResult[] {
  const monsterResults: SearchResult[] = monsters.map((m) => ({
    type: 'monster',
    id: m.id,
    name: m.name_en,
    href: `/database/monsters/${m.id}`,
  }));

  const itemResults: SearchResult[] = items.map((i) => ({
    type: 'item',
    id: i.id,
    name: i.name_en,
    href: `/database/items/${i.id}`,
  }));

  return [...monsterResults, ...itemResults];
}

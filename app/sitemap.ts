import type { MetadataRoute } from 'next';
import { supabaseBrowser } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

// Regenerated with the daily ISR window, same as the list pages.
export const revalidate = 86400;

const STATIC_PATHS = ['/', '/drop-finder', '/database/monsters', '/database/items'];

// Supabase caps a single select at 1,000 rows and does not say so when it
// truncates. items alone is ~1,300, so a plain select() would silently drop
// hundreds of URLs from the sitemap and nothing would look wrong.
const PAGE = 1000;

async function allIds(table: 'monsters' | 'items'): Promise<number[]> {
  const db = supabaseBrowser();
  const ids: number[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from(table)
      .select('id')
      .order('id')
      .range(from, from + PAGE - 1);

    if (error) {
      console.error(`sitemap: ${table} query failed`, error);
      break;
    }
    if (!data || data.length === 0) break;

    ids.push(...data.map((row) => row.id));
    if (data.length < PAGE) break;
  }

  return ids;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [monsterIds, itemIds] = await Promise.all([allIds('monsters'), allIds('items')]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'weekly' as const, priority: 1 })),
    ...monsterIds.map((id) => ({ url: `${SITE_URL}/database/monsters/${id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...itemIds.map((id) => ({ url: `${SITE_URL}/database/items/${id}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  ];
}

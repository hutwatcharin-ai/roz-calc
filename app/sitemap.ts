import type { MetadataRoute } from 'next';
import { supabaseBrowser } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';

// Regenerated with the daily ISR window, same as the list pages.
export const revalidate = 86400;

// This route uses no dynamic functions, so Next would otherwise prerender it
// at build time -- and the throw below on a Supabase error would then fail
// the whole build. A Supabase blip during deploy (the free-tier project
// pausing is exactly the risk the keep-alive workflow exists to mitigate)
// would then block every unrelated hotfix from shipping until Supabase is
// back. Forcing this one route to render per-request keeps that failure
// scoped to a 500 on /sitemap.xml instead of a failed deploy.
export const dynamic = 'force-dynamic';

const STATIC_PATHS = [
  '/',
  '/drop-finder',
  '/database/monsters',
  '/database/items',
  '/database/cards',
  '/database/equipment',
  '/database/skills',
  '/database/maps',
];

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

    // A mid-loop error must fail the build/response loudly, not truncate
    // silently: swallowing it here would mean the ~1,000-row cap and a
    // transient query failure look identical from the outside -- a
    // sitemap.xml that's quietly missing a quarter of the site.
    if (error) {
      throw new Error(`sitemap: ${table} query failed for range ${from}-${from + PAGE - 1}: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    ids.push(...data.map((row) => row.id));
    if (data.length < PAGE) break;
  }

  return ids;
}

// map_stats has one row per map that actually has a detail page -- a map
// code with no monster_spawns rows 404s on app/database/maps/[code]/page.tsx,
// the same set app/database/maps/page.tsx lists. 497 rows today, well under
// the 1,000-row cap, but this pages the same way allIds() does so a future
// wave that grows past it doesn't silently drop URLs the way a plain
// select() would.
async function allMapCodes(): Promise<string[]> {
  const db = supabaseBrowser();
  const codes: string[] = [];

  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from('map_stats')
      .select('map_code')
      .order('map_code')
      .range(from, from + PAGE - 1);

    if (error) {
      throw new Error(`sitemap: map_stats query failed for range ${from}-${from + PAGE - 1}: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    codes.push(...data.map((row) => row.map_code));
    if (data.length < PAGE) break;
  }

  return codes;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [monsterIds, itemIds, mapCodes] = await Promise.all([
    allIds('monsters'),
    allIds('items'),
    allMapCodes(),
  ]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}`, changeFrequency: 'weekly' as const, priority: 1 })),
    ...monsterIds.map((id) => ({ url: `${SITE_URL}/database/monsters/${id}`, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...itemIds.map((id) => ({ url: `${SITE_URL}/database/items/${id}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
    // map_code is a string, not a numeric id, so it needs encodeURIComponent
    // the way app/database/maps/page.tsx and monster spawn chips already link
    // to it -- some codes carry characters (e.g. underscores are fine, but
    // the column's type does not guarantee no others) that must survive the URL.
    ...mapCodes.map((code) => ({
      url: `${SITE_URL}/database/maps/${encodeURIComponent(code)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}

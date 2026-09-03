import type { MetadataRoute } from 'next';
import { supabaseBrowser } from '@/lib/supabase';
import { SITE_URL } from '@/lib/site';
import { PRIMARY_LINKS, SECTION_LINKS } from '@/lib/nav-links';
import { itemHref } from '@/lib/item-href';

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

// Derived from the nav tables rather than listed again here. This list was
// hand-written and went stale the moment three tools pages shipped -- they
// were live, linked from the nav, and absent from the sitemap, which is the
// kind of gap nothing complains about. The nav tables are already checked
// against the filesystem by lib/nav-links.test.ts, so deriving from them means
// a route can only reach the sitemap if its page file exists.
// News pages are not nav entries, so they are listed here by hand. One line
// per page, added the day it ships -- the same "route exists" check the nav
// tables get from lib/nav-links.test.ts does not cover these, so keep it short.
export const NEWS_PATHS: string[] = ['/news/patch-2026-09-03'];

// Static routes that live outside the nav tables (footer-only pages, news).
// Exported so sitemap.test.ts can assert STATIC_PATHS is exactly nav + these
// and nothing else has crept in.
export const EXTRA_STATIC_PATHS: string[] = ['/about', ...NEWS_PATHS];

export const STATIC_PATHS: string[] = [
  ...new Set([...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools]
    .filter((link) => link.ready)
    .map((link) => link.href)),
  ...EXTRA_STATIC_PATHS,
];

// Supabase caps a single select at 1,000 rows and does not say so when it
// truncates. items alone is ~1,300, so a plain select() would silently drop
// hundreds of URLs from the sitemap and nothing would look wrong.
const PAGE = 1000;

interface IdRow {
  id: number;
  updated_at: string;
  // items only: decides whether a row's canonical URL is the item route or the
  // equipment one. A sitemap that lists the redirecting URL instead sends every
  // crawl through a 308 and reports as a soft-redirect issue in Search Console.
  category?: string | null;
}

// Real per-row timestamps (added 2026-09-02) -- never a literal date. A
// hardcoded lastmod would lie the moment a value it describes stops being
// true, so nothing here is written until the column exists and is
// maintained by the actual write path.
async function allIds(table: 'monsters' | 'items'): Promise<IdRow[]> {
  const db = supabaseBrowser();
  const rows: IdRow[] = [];

  for (let from = 0; ; from += PAGE) {
    // Two literal selects, not one computed string: the client's select()
    // types parse the column list at compile time and reject an expression.
    const { data, error } =
      table === 'items'
        ? await db.from('items').select('id, updated_at, category').order('id').range(from, from + PAGE - 1)
        : await db.from('monsters').select('id, updated_at').order('id').range(from, from + PAGE - 1);

    // A mid-loop error must fail the build/response loudly, not truncate
    // silently: swallowing it here would mean the ~1,000-row cap and a
    // transient query failure look identical from the outside -- a
    // sitemap.xml that's quietly missing a quarter of the site.
    if (error) {
      throw new Error(`sitemap: ${table} query failed for range ${from}-${from + PAGE - 1}: ${error.message}`);
    }
    if (!data || data.length === 0) break;

    rows.push(...(data as IdRow[]));
    if (data.length < PAGE) break;
  }

  return rows;
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

// Quest HUB pages only -- the 766 quests deliberately do not get their own
// URLs (spec 2026-08-31-quests: anchors on the hub page, no thin pages).
// lastmod per hub is the newest updated_at among the quests folded into it --
// a hub page's content changes the day any quest in it does.
async function allQuestTowns(): Promise<Map<string, string>> {
  const { data, error } = await supabaseBrowser().from('quests').select('town_key, updated_at').order('town_key');
  if (error) throw new Error(`sitemap: quests query failed: ${error.message}`);
  const latest = new Map<string, string>();
  for (const row of data ?? []) {
    const cur = latest.get(row.town_key);
    if (!cur || row.updated_at > cur) latest.set(row.town_key, row.updated_at);
  }
  return latest;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [monsterIds, itemIds, mapCodes, questTowns] = await Promise.all([
    allIds('monsters'),
    allIds('items'),
    allMapCodes(),
    allQuestTowns(),
  ]);

  return [
    ...STATIC_PATHS.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...monsterIds.map((row) => ({ url: `${SITE_URL}/database/monsters/${row.id}`, lastModified: row.updated_at })),
    ...itemIds.map((row) => ({ url: `${SITE_URL}${itemHref(row.id, row.category)}`, lastModified: row.updated_at })),
    // map_code is a string, not a numeric id, so it needs encodeURIComponent
    // the way app/database/maps/page.tsx and monster spawn chips already link
    // to it -- some codes carry characters (e.g. underscores are fine, but
    // the column's type does not guarantee no others) that must survive the URL.
    ...mapCodes.map((code) => ({
      url: `${SITE_URL}/database/maps/${encodeURIComponent(code)}`,
    })),
    ...[...questTowns.entries()].map(([town, lastModified]) => ({
      url: `${SITE_URL}/database/quests/${encodeURIComponent(town)}`,
      lastModified,
    })),
  ];
}

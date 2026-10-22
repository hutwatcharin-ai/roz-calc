// What the bot's commands (lib/telegram-bot.ts) read, for real. Server only:
// it uses the service key and the GA4 and GitHub tokens.
import { supabaseRead } from './supabase';
import { escapeLikePattern } from './like-escape';
import { rankMatches, searchWords } from './smart-search';
import { getMapCanonical } from './map-canonical';
import { itemHref } from './item-href';
import { isAbsentFromGame } from './game-absent';
import { ga4, googleToken, gsc } from './google-service';
import { SITE, type BotDeps, type Found, type InboxPost } from './telegram-bot';

const REPO = 'hutwatcharin-ai/roz-calc';

// The discord-inbox branch is public, so state.json needs no token.
async function inbox(): Promise<InboxPost[]> {
  const res = await fetch(`https://raw.githubusercontent.com/${REPO}/discord-inbox/state.json`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`state.json ${res.status}`);
  return (await res.json()).posts ?? [];
}

// GITHUB_DISPATCH_TOKEN: fine-grained, this repository only, Actions read and
// write -- it can start a workflow and nothing else.
async function dispatch(): Promise<void> {
  const token = process.env.GITHUB_DISPATCH_TOKEN;
  if (!token) throw new Error('GITHUB_DISPATCH_TOKEN ยังไม่ได้ตั้ง');
  const res = await fetch(`https://api.github.com/repos/${REPO}/actions/workflows/discord-news.yml/dispatches`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'content-type': 'application/json' },
    body: JSON.stringify({ ref: 'master' }),
  });
  if (res.status !== 204) throw new Error(`GitHub ${res.status}`);
}

async function visitors() {
  const token = await googleToken('https://www.googleapis.com/auth/analytics.readonly');
  const [days, live] = await Promise.all([
    ga4(token, {
      dateRanges: [{ startDate: 'yesterday', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }],
    }),
    ga4(token, { metrics: [{ name: 'activeUsers' }] }, true),
  ]);
  // GA4 dates are the property's (Bangkok) days as YYYYMMDD.
  const ymd = (offset: number) => new Date(Date.now() + 7 * 3600e3 - offset * 86400e3).toISOString().slice(0, 10).replace(/-/g, '');
  const day = (d: string) => {
    const r = days.find((row) => row.dims[0] === d);
    return { users: r?.mets[0] ?? 0, views: r?.mets[1] ?? 0 };
  };
  return { live: live[0]?.mets[0] ?? 0, today: day(ymd(0)), yesterday: day(ymd(1)) };
}

// Same window as the Monday report: Search Console lags two to three days.
async function searchWeek() {
  const token = await googleToken('https://www.googleapis.com/auth/webmasters.readonly');
  const d = (n: number) => new Date(Date.now() - n * 86400e3).toISOString().slice(0, 10);
  const [start, end] = [d(9), d(3)];
  const [[total], [before], queries] = await Promise.all([
    gsc(token, start, end, [], 1),
    gsc(token, d(16), d(10), [], 1),
    gsc(token, start, end, ['query'], 50),
  ]);
  return {
    start,
    end,
    clicks: total?.clicks ?? 0,
    impressions: total?.impressions ?? 0,
    position: total?.position ?? 0,
    prevClicks: before?.clicks ?? null,
    top: queries
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 8)
      .map((r) => ({ query: r.keys?.[0] ?? '', clicks: r.clicks, position: r.position })),
  };
}

// The pages the uptime check watches: the home page and the farm data.
async function status() {
  const paths = ['/', '/tools/leveling-spots/farm-data'];
  return Promise.all(
    paths.map(async (path) => {
      try {
        const res = await fetch(SITE + path, { signal: AbortSignal.timeout(15000), cache: 'no-store', headers: { 'user-agent': 'rozerothai-bot' } });
        return { path, status: res.status as number | string };
      } catch (e) {
        return { path, status: e instanceof Error && e.name === 'TimeoutError' ? 'timeout' : 'error' };
      }
    }),
  );
}

// The header search's lookups, cut to monsters, items and maps.
async function find(query: string): Promise<Found[]> {
  const words = searchWords(query);
  if (!words.length) return [];
  const db = supabaseRead();
  const allWords = <T,>(q: T, column: string): T => {
    let out = q;
    for (const w of words) out = (out as { ilike: (c: string, p: string) => T }).ilike(column, `%${escapeLikePattern(w)}%`);
    return out;
  };
  // Read wide, then rank like the header search: a plain ilike returns
  // Poporing before Poring.
  const [monsters, items, maps] = await Promise.all([
    allWords(db.from('monsters').select('id, name_en').gt('hp', 0), 'name_en').limit(40),
    allWords(db.from('items').select('id, name_en, category'), 'name_en').limit(80),
    allWords(db.from('map_stats').select('map_code, map_display_name'), 'search_text').limit(40),
  ]);
  const err = monsters.error ?? items.error ?? maps.error;
  if (err) throw new Error(err.message);
  const top = <T,>(rows: T[], name: (r: T) => string) => rankMatches(rows, query, name).slice(0, 5);

  // Channel copies of a map (bea_d02_a, _b, _z) share the canonical map's page.
  const canonical = maps.data?.length ? await getMapCanonical() : null;
  const byPage = new Map<string, { map_code: string; map_display_name: string | null }>();
  for (const m of maps.data ?? []) {
    const page = canonical?.byCode[m.map_code] ?? m.map_code;
    if (!byPage.has(page) || m.map_code === page) byPage.set(page, { ...m, map_code: page });
  }

  return [
    ...top(monsters.data ?? [], (m) => m.name_en ?? '').map((m) => ({ kind: 'monster' as const, name: m.name_en ?? `#${m.id}`, href: `/database/monsters/${m.id}` })),
    ...top((items.data ?? []).filter((i) => !isAbsentFromGame(Number(i.id))), (i) => i.name_en ?? '').map((i) => ({
      kind: 'item' as const,
      name: i.name_en ?? `#${i.id}`,
      href: itemHref(i.id, i.category),
    })),
    ...top([...byPage.values()], (m) => m.map_display_name ?? m.map_code).map((m) => ({
      kind: 'map' as const,
      name: `${m.map_display_name ?? m.map_code} (${m.map_code})`,
      href: `/database/maps/${m.map_code}`,
    })),
  ];
}

export function liveDeps(): BotDeps {
  return { now: Date.now(), inbox, dispatch, visitors, searchWeek, status, find };
}

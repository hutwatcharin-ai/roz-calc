// The media kit's traffic figures, read from GA4 when the page is built
// (owner, 3 Oct 2026: "/advertise does not update itself"). Until then the
// numbers only changed when scripts/refresh-ad-stats.py was run by hand, and
// the page went ten days quoting 177,509 views while the real figure was
// 306,164.
//
// Same counting as that script -- keep the two in step:
//   top     every page view on the site
//   inline  the pages that carry the in-content slot (INLINE_AD_PAGES)
//   detail  a monster, item, card, costume or equipment page
//
// The key is the read-only GA4 service account, base64 of its JSON, in
// GA4_SERVICE_ACCOUNT_JSON (Coolify secret; locally .env.local). Without it,
// or when Google does not answer, the page falls back to data/ads.json --
// the last figures written by the script, with their own date -- so the page
// never shows a blank or an undated number.

import { createSign } from 'node:crypto';
import { AD_STATS, INLINE_AD_PAGES, type AdStats } from './ads';

const PROPERTY = 'properties/552516626';
const DAYS = 28;
const DETAIL_PATH = /^\/database\/(monsters|items|cards|costumes|equipment)\/[^/]+$/;
const TIMEOUT_MS = 8000;
// No `cache: 'no-store'` on these fetches: that marks /advertise dynamic and
// the static build throws. Both are POSTs, which Next does not cache, and the
// page itself is rebuilt daily (revalidate 86400).

interface ServiceAccount {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

function readKey(): ServiceAccount | null {
  const raw = process.env.GA4_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const json = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
    const key = JSON.parse(json) as ServiceAccount;
    return key.client_email && key.private_key ? key : null;
  } catch {
    return null;
  }
}

const b64url = (s: string) => Buffer.from(s).toString('base64url');

async function accessToken(key: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const aud = key.token_uri ?? 'https://oauth2.googleapis.com/token';
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(
    JSON.stringify({
      iss: key.client_email,
      scope: 'https://www.googleapis.com/auth/analytics.readonly',
      aud,
      iat: now,
      exp: now + 3600,
    }),
  )}`;
  const signature = createSign('RSA-SHA256').update(unsigned).sign(key.private_key, 'base64url');
  const res = await fetch(aud, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${unsigned}.${signature}`,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`token ${res.status}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

type Row = { dims: string[]; mets: number[] };

async function report(token: string, dimensions: string[], metrics: string[]): Promise<Row[]> {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${PROPERTY}:runReport`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: `${DAYS}daysAgo`, endDate: 'today' }],
      dimensions: dimensions.map((name) => ({ name })),
      metrics: metrics.map((name) => ({ name })),
      limit: 100000,
    }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`runReport ${res.status}`);
  const body = (await res.json()) as {
    rows?: { dimensionValues?: { value: string }[]; metricValues: { value: string }[] }[];
  };
  return (body.rows ?? []).map((r) => ({
    dims: (r.dimensionValues ?? []).map((d) => d.value),
    mets: r.metricValues.map((m) => Number(m.value)),
  }));
}

const share = (rows: Row[], match: string) => {
  const total = rows.reduce((n, r) => n + r.mets[0], 0);
  const hit = rows.find((r) => r.dims[0] === match)?.mets[0] ?? 0;
  return Math.round((100 * hit) / Math.max(1, total));
};

/** Bangkok's calendar date, the day the figures were read. */
const todayBangkok = () => new Date(Date.now() + 7 * 3600_000).toISOString().slice(0, 10);

export async function getAdStats(): Promise<AdStats> {
  const key = readKey();
  if (!key) return AD_STATS;
  try {
    const token = await accessToken(key);
    const [totals, devices, countries, pages] = await Promise.all([
      report(token, [], ['activeUsers', 'sessions', 'screenPageViews', 'averageSessionDuration', 'screenPageViewsPerSession']),
      report(token, ['deviceCategory'], ['sessions']),
      report(token, ['country'], ['sessions']),
      report(token, ['pagePath'], ['screenPageViews']),
    ]);
    const [users, sessions, views, seconds, perSession] = totals[0]?.mets ?? [];
    // A report that came back empty is not "zero readers": keep the file.
    if (!views) return AD_STATS;
    const path = (r: Row) => r.dims[0].split('?')[0];
    return {
      asOf: todayBangkok(),
      periodDays: DAYS,
      users: Math.round(users),
      sessions: Math.round(sessions),
      pageViews: Math.round(views),
      pagesPerSession: Math.round(perSession * 10) / 10,
      avgMinutes: Math.round(seconds / 60),
      desktopShare: share(devices, 'desktop'),
      thaiShare: share(countries, 'Thailand'),
      topSlotViews: Math.round(views),
      inlineSlotViews: Math.round(pages.filter((r) => INLINE_AD_PAGES.includes(path(r))).reduce((n, r) => n + r.mets[0], 0)),
      detailSlotViews: Math.round(pages.filter((r) => DETAIL_PATH.test(path(r))).reduce((n, r) => n + r.mets[0], 0)),
    };
  } catch (error) {
    console.error('live ad stats failed, using data/ads.json', error);
    return AD_STATS;
  }
}

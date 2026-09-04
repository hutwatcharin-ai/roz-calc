// lib/analytics.ts
//
// The one door every GA4 event goes through.
//
// Three events, decided 4 Sep 2026 and not to be renamed afterwards (GA4
// cannot merge an old name into a new one -- a rename splits every graph in
// two for good):
//
//   page_view  sent by <Analytics> on every route change, with content_group
//   search     a search term someone typed, with how many rows it found
//   tool_use   the first change someone makes on a calculator, once per page
//
// Everything else the site could measure was deliberately left out: fewer
// events with a reader each beat many that nobody opens.

export type EventParams = Record<string, string | number | boolean | undefined | null>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

/** Set NEXT_PUBLIC_GA_DEBUG=1 to load GA on a dev server and mark every event
 *  debug_mode, which GA4 shows in DebugView and keeps out of the reports. */
export const GA_DEBUG = process.env.NEXT_PUBLIC_GA_DEBUG === '1';

/** localStorage flag that marks this browser as the site's own maintainer.
 *  Set by visiting any page with ?internal=1, cleared with ?internal=0. The
 *  property filters traffic_type=internal out at collection. */
export const INTERNAL_KEY = 'roz-calc:internal';

export type ContentGroup = 'home' | 'database' | 'tools' | 'guides' | 'news' | 'other';

/** Which of the site's sections a path belongs to. Registered in GA4 as the
 *  Content group dimension so reports split by section without path regexes. */
export function contentGroupFor(pathname: string): ContentGroup {
  if (pathname === '/') return 'home';
  if (pathname.startsWith('/database') || pathname.startsWith('/drop-finder')) return 'database';
  if (pathname.startsWith('/tools')) return 'tools';
  if (pathname.startsWith('/guides')) return 'guides';
  if (pathname.startsWith('/news')) return 'news';
  return 'other';
}

// GA4 cuts a param value at 100 characters silently. Cutting it here makes the
// limit visible in the code instead of a surprise in the report.
const MAX_VALUE = 100;

export function sanitizeParams(params: EventParams): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    out[key] = typeof value === 'string' ? value.slice(0, MAX_VALUE) : value;
  }
  return out;
}

/** Send one event. Returns false when GA is not on the page (dev server
 *  without the debug flag, a blocked script) so a caller can tell. */
export function track(name: string, params: EventParams = {}): boolean {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false;
  window.gtag('event', name, sanitizeParams(params));
  return true;
}

// tool_use is one per tool per page: the first change counts, the rest do
// not. The record lives here rather than in a component ref so the two or
// three components that make up one tool (the mode tabs, the number strip,
// the results) share a single count.
const toolUsed = new Map<string, string>();

function currentPageKey(): string {
  return typeof window === 'undefined' ? '' : window.location.pathname;
}

/**
 * Report that a tool was used. Fires once per (tool, pageKey); later calls
 * return false without sending. The default key is the path alone, so a
 * planner rewriting its own query string stays one page.
 */
export function reportToolUse(tool: string, params: EventParams = {}, pageKey: string = currentPageKey()): boolean {
  if (toolUsed.get(tool) === pageKey) return false;
  toolUsed.set(tool, pageKey);
  return track('tool_use', { tool, ...params });
}

/** Tests only. */
export function resetToolUse(): void {
  toolUsed.clear();
}

/**
 * Handle ?internal=1 / ?internal=0 and tell gtag straight away, so the very
 * page that set the flag is already excluded. Returns whether this browser is
 * flagged internal afterwards.
 */
export function applyInternalParam(value: string | null, storage: Storage): boolean {
  try {
    if (value === '1') {
      storage.setItem(INTERNAL_KEY, '1');
      window.gtag?.('set', { traffic_type: 'internal' });
      return true;
    }
    if (value === '0') {
      storage.removeItem(INTERNAL_KEY);
      return false;
    }
    return storage.getItem(INTERNAL_KEY) === '1';
  } catch {
    // Blocked site data: the flag cannot be kept, so the browser is not internal.
    return false;
  }
}

/**
 * The inline bootstrap for the layout head. Defines the gtag stub, applies
 * the internal-traffic flag, and configures the property without an automatic
 * page_view (see components/Analytics.tsx for why). Plain string so it can be
 * a synchronous <script> in the head, ahead of hydration.
 */
export function gaBootstrap(gaId: string, debug: boolean = GA_DEBUG): string {
  const config = debug ? '{send_page_view:false,debug_mode:true}' : '{send_page_view:false}';
  return [
    'window.dataLayer=window.dataLayer||[];',
    'function gtag(){window.dataLayer.push(arguments);}',
    'window.gtag=gtag;',
    "gtag('js',new Date());",
    "try{if(localStorage.getItem('" + INTERNAL_KEY + "')==='1')gtag('set',{traffic_type:'internal'});}catch(e){}",
    "gtag('config','" + gaId + "'," + config + ');',
  ].join('');
}

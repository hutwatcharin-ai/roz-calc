// Two-tier navigation (spec 6.1). Ten links do not fit one row on a phone, and
// the two pages people use most must stay one click away -- which rules out
// burying them in a dropdown.
//
// Pure data and pure functions: no React here, so the route mapping is testable
// without rendering.

export type NavSection = 'database' | 'tools' | null;

export interface NavLink {
  href: string;
  label: string;
  // False for a route that does not exist yet. An unready link renders as
  // plain text -- present so players know it is coming, but never a clickable
  // href to a page that 404s. A Wave 2 task flips this to true the day the
  // route ships, one flag per page (spec 6.1 fix, whole-branch review #1).
  ready: boolean;
}

export const PRIMARY_LINKS: NavLink[] = [
  { href: '/', label: 'หาจุดตี', ready: true },
  { href: '/drop-finder', label: 'ค้นของดรอป', ready: true },
  { href: '/database/monsters', label: 'ฐานข้อมูล', ready: true },
  { href: '/tools/elements', label: 'เครื่องมือ', ready: false },
];

// Some of these routes arrive in Wave 2. Listing them now means the nav is
// built once instead of edited on every later task. Only the two routes that
// exist today (monsters, items) are ready; the rest render as unready text
// until their page ships.
export const SECTION_LINKS: Record<'database' | 'tools', NavLink[]> = {
  database: [
    { href: '/database/monsters', label: 'มอนสเตอร์', ready: true },
    { href: '/database/items', label: 'ไอเทม', ready: true },
    { href: '/database/cards', label: 'การ์ด', ready: true },
    { href: '/database/equipment', label: 'อุปกรณ์', ready: false },
    { href: '/database/skills', label: 'สกิล', ready: false },
    { href: '/database/maps', label: 'แมพ', ready: false },
  ],
  tools: [
    { href: '/tools/elements', label: 'ตารางธาตุ', ready: false },
    { href: '/tools/farm-planner', label: 'แผนฟาร์ม', ready: false },
    { href: '/tools/afk-finder', label: 'หาจุด AFK', ready: false },
  ],
};

// Trailing slash stripped first so "/database/" and "/database" agree. The
// boundary check keeps "/databases-of-doom" out of the database section.
function normalise(pathname: string): string {
  return pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
}

function isUnder(pathname: string, prefix: string): boolean {
  const path = normalise(pathname);
  return path === prefix || path.startsWith(`${prefix}/`);
}

export function sectionForPath(pathname: string): NavSection {
  if (isUnder(pathname, '/database')) return 'database';
  if (isUnder(pathname, '/tools')) return 'tools';
  return null;
}

const ALL_LINKS: NavLink[] = [...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools];

// An href not found in either table (e.g. a value a test makes up) is treated
// as ready, since readiness only exists to gate the links this module actually
// lists -- everything else falls back to plain path matching.
function isReadyHref(href: string): boolean {
  const link = ALL_LINKS.find((l) => l.href === href);
  return link ? link.ready : true;
}

// A list link stays highlighted on its own detail pages, so a player reading a
// monster page still sees which section they are in. The home link is exact-
// match only, or it would light up on every page in the site.
//
// An unready link is never active: it renders as plain text, not an <a>, so
// there is nothing for aria-current or .on to attach to.
export function isActiveLink(href: string, pathname: string): boolean {
  if (!isReadyHref(href)) return false;
  if (href === '/') return normalise(pathname) === '/';
  return isUnder(pathname, href);
}

// The top row answers a different question than the second row: not "which
// page" but "which section". A primary link that stands in for a whole
// section (e.g. /database/monsters for "ฐานข้อมูล") must stay highlighted on
// every page in that section, not just its own href -- otherwise five of the
// six database pages show no highlight at all. Links that are not section
// stand-ins (home, drop finder) keep the isActiveLink rule.
export function isActivePrimaryLink(href: string, pathname: string): boolean {
  if (!isReadyHref(href)) return false;
  const linkSection = sectionForPath(href);
  if (linkSection) return sectionForPath(pathname) === linkSection;
  return isActiveLink(href, pathname);
}

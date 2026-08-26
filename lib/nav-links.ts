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
}

export const PRIMARY_LINKS: NavLink[] = [
  { href: '/', label: 'หาจุดตี' },
  { href: '/drop-finder', label: 'ค้นของดรอป' },
  { href: '/database/monsters', label: 'ฐานข้อมูล' },
  { href: '/tools/elements', label: 'เครื่องมือ' },
];

// Some of these routes arrive in Wave 2. Listing them now means the nav is
// built once instead of edited on every later task.
export const SECTION_LINKS: Record<'database' | 'tools', NavLink[]> = {
  database: [
    { href: '/database/monsters', label: 'มอนสเตอร์' },
    { href: '/database/items', label: 'ไอเทม' },
    { href: '/database/cards', label: 'การ์ด' },
    { href: '/database/equipment', label: 'อุปกรณ์' },
    { href: '/database/skills', label: 'สกิล' },
    { href: '/database/maps', label: 'แมพ' },
  ],
  tools: [
    { href: '/tools/elements', label: 'ตารางธาตุ' },
    { href: '/tools/farm-planner', label: 'แผนฟาร์ม' },
    { href: '/tools/afk-finder', label: 'หาจุด AFK' },
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

// A list link stays highlighted on its own detail pages, so a player reading a
// monster page still sees which section they are in. The home link is exact-
// match only, or it would light up on every page in the site.
export function isActiveLink(href: string, pathname: string): boolean {
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
  const linkSection = sectionForPath(href);
  if (linkSection) return sectionForPath(pathname) === linkSection;
  return isActiveLink(href, pathname);
}

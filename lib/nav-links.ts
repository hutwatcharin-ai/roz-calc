// Two-tier navigation (spec 6.1). Ten links do not fit one row on a phone, and
// the two pages people use most must stay one click away -- which rules out
// burying them in a dropdown.
//
// Pure data and pure functions: no React here, so the route mapping is testable
// without rendering.

export type NavSection = 'database' | 'tools' | 'guides' | null;

export interface NavLink {
  href: string;
  label: string;
  // A game-item sprite shown before the label (midgardhub-style). Paths are
  // OUR mirrored sprites under public/images -- never a hotlink. Optional:
  // the primary row stays text-only.
  icon?: string;
  // False for a route that does not exist yet. An unready link renders as
  // plain text -- present so players know it is coming, but never a clickable
  // href to a page that 404s. A Wave 2 task flips this to true the day the
  // route ships, one flag per page (spec 6.1 fix, whole-branch review #1).
  ready: boolean;
}

export const PRIMARY_LINKS: NavLink[] = [
  // Renamed from "หาจุดตี" when the homepage became the intent-card landing:
  // the finder still lives there (card 1), but the tab's job is "take me home".
  { href: '/', label: 'หน้าแรก', ready: true },
  { href: '/drop-finder', label: 'ค้นของดรอป', ready: true },
  { href: '/database/monsters', label: 'ฐานข้อมูล', ready: true },
  // Split off the tools row on 3 Sep 2026: a table you read and a calculator
  // you feed your own numbers to are different errands, and ten mixed chips
  // made the row something to scan rather than choose from.
  { href: '/guides', label: 'ไกด์', ready: true },
];

// Some of these routes arrive in Wave 2. Listing them now means the nav is
// built once instead of edited on every later task. All six database routes
// are ready, and so are all three tools routes. A route added later renders
// as unready text until its page ships.
export const SECTION_LINKS: Record<'database' | 'tools' | 'guides', NavLink[]> = {
  // Ordered by use: hunting flow first, biggest catalogs next. Icons are
  // recognisable vanilla items so a player reads the row without the words:
  // Poring, Sword, Poring Card, Red Potion, Emperium, Fly Wing, Butterfly
  // Wing, Old Magicbook.
  database: [
    { href: '/database/monsters', label: 'มอนสเตอร์', icon: '/images/monsters/1002.gif', ready: true },
    { href: '/database/equipment', label: 'อุปกรณ์', icon: '/images/items/1101.gif', ready: true },
    { href: '/database/costumes', label: 'คอสตูม', icon: '/images/items/19585.gif', ready: true },
    { href: '/database/cards', label: 'การ์ด', icon: '/images/items/4001.gif', ready: true },
    { href: '/database/items', label: 'ไอเทม', icon: '/images/items/501.gif', ready: true },
    { href: '/database/cash-shop', label: 'Cash Shop', icon: '/images/items/969.gif', ready: true },
    { href: '/database/quests', label: 'เควส', icon: '/images/items/714.gif', ready: true },
    { href: '/database/maps', label: 'แมพ', icon: '/images/items/601.gif', ready: true },
    { href: '/database/world-map', label: 'แผนที่โลก', icon: '/images/items/602.gif', ready: true },
    { href: '/database/skills', label: 'สกิล', icon: '/images/items/7433.gif', ready: true },
  ],
  // Red Blood (element stone), Apple, Yggdrasil Leaf, Branch of Dead Tree,
  // Elunium, Knife, Yggdrasil Berry.
  // Ordered by the player's task, not build order (user, 2 Sep): find a spot
  // to farm -> fight the monster -> reference tables -> extras. "มอน" in the
  // two fight tools keeps them from reading as refine (ตีบวก) siblings.
  // Only pages that take the player's own numbers and answer with theirs.
  tools: [
    { href: '/tools/leveling-spots', label: 'ฟาร์มที่ไหนดี', icon: '/images/items/607.gif', ready: true },
    { href: '/tools/skill-planner', label: 'วางแผนสกิล', icon: '/images/items/7433.gif', ready: true },
    { href: '/tools/hit-flee', label: 'คำนวณ Hit/Flee', icon: '/images/items/1750.gif', ready: true },
    { href: '/tools/damage', label: 'ตีมอนด้วยอะไรดี', icon: '/images/items/1201.gif', ready: true },
    { href: '/tools/refine', label: 'ตีบวก', icon: '/images/items/985.gif', ready: true },
  ],
  // Pages you read: fixed game tables, and the written guide. Moved here from
  // /tools on 3 Sep 2026, old paths 301 (next.config.mjs).
  guides: [
    { href: '/guides/farm-guide', label: 'จุดฟาร์มแนะนำ', icon: '/images/items/601.gif', ready: true },
    { href: '/guides/codes', label: 'โค้ดรับของ', icon: '/images/items/714.gif', ready: true },
    { href: '/guides/elements', label: 'ตารางธาตุ', icon: '/images/items/990.gif', ready: true },
    { href: '/guides/sizes', label: 'ตารางขนาด', icon: '/images/items/604.gif', ready: true },
    { href: '/guides/exp', label: 'EXP ต่อเลเวล', icon: '/images/items/607.gif', ready: true },
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
  if (isUnder(pathname, '/guides')) return 'guides';
  return null;
}

const ALL_LINKS: NavLink[] = [
  ...PRIMARY_LINKS,
  ...SECTION_LINKS.database,
  ...SECTION_LINKS.tools,
  ...SECTION_LINKS.guides,
];

// An href not found in either table (e.g. a value a test makes up) is treated
// as ready, since readiness only exists to gate the links this module actually
// lists -- everything else falls back to plain path matching.
//
// `links` overrides the tables. Every listed route is ready today, so a test
// for the readiness gate has nothing in the real tables to drive it; passing a
// table in tests the gate itself rather than asserting the site still has an
// unfinished page somewhere.
function isReadyHref(href: string, links: NavLink[] = ALL_LINKS): boolean {
  const link = links.find((l) => l.href === href);
  return link ? link.ready : true;
}

// A list link stays highlighted on its own detail pages, so a player reading a
// monster page still sees which section they are in. The home link is exact-
// match only, or it would light up on every page in the site.
//
// An unready link is never active: it renders as plain text, not an <a>, so
// there is nothing for aria-current or .on to attach to.
export function isActiveLink(href: string, pathname: string, links?: NavLink[]): boolean {
  if (!isReadyHref(href, links)) return false;
  if (href === '/') return normalise(pathname) === '/';
  return isUnder(pathname, href);
}

// The top row answers a different question than the second row: not "which
// page" but "which section". A primary link that stands in for a whole
// section (e.g. /database/monsters for "ฐานข้อมูล") must stay highlighted on
// every page in that section, not just its own href -- otherwise five of the
// six database pages show no highlight at all. Links that are not section
// stand-ins (home, drop finder) keep the isActiveLink rule.
export function isActivePrimaryLink(href: string, pathname: string, links?: NavLink[]): boolean {
  if (!isReadyHref(href, links)) return false;
  const linkSection = sectionForPath(href);
  if (linkSection) return sectionForPath(pathname) === linkSection;
  return isActiveLink(href, pathname, links);
}


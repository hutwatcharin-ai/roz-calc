import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  sectionForPath,
  isActiveLink,
  isActivePrimaryLink,
  PRIMARY_LINKS,
  SECTION_LINKS,
  type NavLink,
  usesCharacterContext,
} from './nav-links';

// Routes confirmed to exist today (finding #1): / , /drop-finder, and all six
// database list pages -- monsters, items, cards, equipment, skills, maps --
// plus their detail routes, which are not entries in these tables. Every
// other listed href is a Wave 2 promise.
// Derived from the filesystem, not listed by hand: a hand-written list is one
// more thing to update when a route ships, and the one time it was not
// updated it failed as a puzzle rather than as a warning. A route is ready
// exactly when its page file exists.
function routeExists(href: string): boolean {
  const dir = href === '/' ? '' : href;
  return existsSync(join(process.cwd(), 'app', dir, 'page.tsx'));
}

describe('sectionForPath', () => {
  it('puts database routes in the database section', () => {
    expect(sectionForPath('/database/monsters')).toBe('database');
    expect(sectionForPath('/database/items/501')).toBe('database');
  });

  it('puts tool routes in the tools section', () => {
    expect(sectionForPath('/tools/elements')).toBe('tools');
  });

  it('gives the home page no section, so no second row renders', () => {
    expect(sectionForPath('/')).toBeNull();
  });

  it('gives the drop finder no section', () => {
    expect(sectionForPath('/drop-finder')).toBeNull();
  });

  it('does not match a route that merely starts with the same letters', () => {
    expect(sectionForPath('/databases-of-doom')).toBeNull();
  });

  it('matches the bare section root as well as its children', () => {
    expect(sectionForPath('/database')).toBe('database');
  });

  it('ignores a trailing slash', () => {
    expect(sectionForPath('/database/')).toBe('database');
  });
});

describe('isActiveLink', () => {
  it('matches the home link only on the home page', () => {
    expect(isActiveLink('/', '/')).toBe(true);
    expect(isActiveLink('/', '/drop-finder')).toBe(false);
    expect(isActiveLink('/', '/database/monsters')).toBe(false);
  });

  it('matches a list link on its own detail pages', () => {
    expect(isActiveLink('/database/monsters', '/database/monsters/1002')).toBe(true);
  });

  it('does not match a sibling route', () => {
    expect(isActiveLink('/database/monsters', '/database/items')).toBe(false);
  });

  it('does not match a route sharing a name prefix', () => {
    expect(isActiveLink('/database/item', '/database/items')).toBe(false);
  });
});

describe('isActivePrimaryLink', () => {
  it('highlights the database section link on a sibling database page', () => {
    expect(isActivePrimaryLink('/database/monsters', '/database/items')).toBe(true);
  });

  it('highlights the database section link on another sibling database page', () => {
    expect(isActivePrimaryLink('/database/monsters', '/database/cards')).toBe(true);
  });

  it('highlights the tools section link on every tools page', () => {
    // This used to assert the opposite, because /tools/elements did not
    // exist yet and the readiness gate overrode section matching. All three
    // tools routes ship now, so the behaviour under test is the section
    // rule itself.
    expect(isActivePrimaryLink('/tools/afk-finder', '/tools/farm-planner')).toBe(true);
    expect(isActivePrimaryLink('/tools/afk-finder', '/tools/elements')).toBe(true);
    expect(isActivePrimaryLink('/database/monsters', '/tools/farm-planner')).toBe(false);
  });

  it('highlights only the drop-finder link on the drop-finder page', () => {
    expect(isActivePrimaryLink('/drop-finder', '/drop-finder')).toBe(true);
    expect(isActivePrimaryLink('/database/monsters', '/drop-finder')).toBe(false);
    expect(isActivePrimaryLink('/tools/afk-finder', '/drop-finder')).toBe(false);
  });

  it('highlights only the home link on the home page', () => {
    expect(isActivePrimaryLink('/', '/')).toBe(true);
    expect(isActivePrimaryLink('/database/monsters', '/')).toBe(false);
    expect(isActivePrimaryLink('/tools/elements', '/')).toBe(false);
  });
});

describe('link tables', () => {
  it('keeps the two most-used pages in the top row, one click away', () => {
    expect(PRIMARY_LINKS.map((l) => l.href)).toContain('/');
    expect(PRIMARY_LINKS.map((l) => l.href)).toContain('/drop-finder');
  });

  it('lists the nine database pages in browse order', () => {
    // Reordered 31 Aug for the section split: hunting flow first, then the
    // catalogs by size, world map added the day it shipped.
    expect(SECTION_LINKS.database.map((l) => l.href)).toEqual([
      '/database/monsters',
      '/database/equipment',
      '/database/cards',
      '/database/items',
      '/database/cash-shop',
      '/database/quests',
      '/database/maps',
      '/database/world-map',
      '/database/skills',
    ]);
  });

  it('gives every link a non-empty Thai label', () => {
    const all = [...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools];
    for (const link of all) expect(link.label.trim().length).toBeGreaterThan(0);
  });

  it('marks ready exactly the routes whose page file exists', () => {
    const all = [...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools];
    for (const link of all) {
      expect({ href: link.href, ready: link.ready }).toEqual({
        href: link.href,
        ready: routeExists(link.href),
      });
    }
  });

  it('never reports an unready link active, by either matching function', () => {
    // Every listed route is ready today, so this drives the gate directly
    // rather than looking for an unready entry in the tables. The old form
    // asserted the tables contained one, which turned shipping the last
    // tools page into a test failure about nothing.
    const unready: NavLink[] = [{ href: '/tools/not-built-yet', label: 'ยังไม่มี', ready: false }];

    for (const link of unready) {
      // Even visiting the link's own route (impossible in practice, since it
      // renders as text, but the function must still refuse) must not report
      // it active.
      expect(isActiveLink(link.href, link.href, [link])).toBe(false);
      expect(isActivePrimaryLink(link.href, link.href, [link])).toBe(false);
    }
  });
});

describe('usesCharacterContext', () => {
  // The character bar rides in the layout, so this list is the only thing
  // deciding which pages carry 61px of it. Wrong in one direction it clutters a
  // page that cannot use it; wrong in the other it hides the control a page
  // depends on and leaves the reader with no way to fill it in.

  it('keeps the bar on every page that reads a character value', () => {
    for (const path of [
      '/',
      '/drop-finder',
      '/database/monsters',
      '/database/monsters/1002',
      '/database/maps',
      '/database/maps/prontera',
      '/tools/afk-finder',
      '/tools/farm-planner',
    ]) {
      expect(usesCharacterContext(path), path).toBe(true);
    }
  });

  it('drops it from every page that reads none', () => {
    for (const path of [
      '/tools/elements',
      '/tools/sizes',
      '/tools/exp',
      '/tools/damage',
      '/tools/refine',
      '/database/items',
      '/database/items/501',
      '/database/cards',
      '/database/equipment',
      '/database/skills',
    ]) {
      expect(usesCharacterContext(path), path).toBe(false);
    }
  });

  it('does not let a prefix match a different route', () => {
    // "/database/maps" must not claim "/database/maps-of-doom", and the root
    // entry must not claim everything.
    expect(usesCharacterContext('/database/mapsomething')).toBe(false);
    expect(usesCharacterContext('/tools/elements/')).toBe(false);
  });
});

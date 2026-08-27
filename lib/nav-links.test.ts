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

  it('never highlights the tools section link, since /tools/elements is not ready', () => {
    // Would be true under the plain section-matching rule below -- the
    // readiness gate must win.
    expect(isActivePrimaryLink('/tools/elements', '/tools/farm-planner')).toBe(false);
    expect(isActivePrimaryLink('/database/monsters', '/tools/farm-planner')).toBe(false);
  });

  it('highlights only the drop-finder link on the drop-finder page', () => {
    expect(isActivePrimaryLink('/drop-finder', '/drop-finder')).toBe(true);
    expect(isActivePrimaryLink('/database/monsters', '/drop-finder')).toBe(false);
    expect(isActivePrimaryLink('/tools/elements', '/drop-finder')).toBe(false);
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

  it('lists the six database pages the spec names', () => {
    expect(SECTION_LINKS.database.map((l) => l.href)).toEqual([
      '/database/monsters',
      '/database/items',
      '/database/cards',
      '/database/equipment',
      '/database/skills',
      '/database/maps',
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
    const all: NavLink[] = [...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools];
    const unready = all.filter((l) => !l.ready);
    expect(unready.length).toBeGreaterThan(0); // sanity: there is something to test

    for (const link of unready) {
      // Even visiting the link's own route (impossible in practice, since it
      // renders as text, but the function must still refuse) must not report
      // it active.
      expect(isActiveLink(link.href, link.href)).toBe(false);
      expect(isActivePrimaryLink(link.href, link.href)).toBe(false);
    }
  });
});

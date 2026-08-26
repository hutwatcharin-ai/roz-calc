import { describe, it, expect } from 'vitest';
import { sectionForPath, isActiveLink, PRIMARY_LINKS, SECTION_LINKS } from './nav-links';

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
});

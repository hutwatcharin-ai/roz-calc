import { describe, it, expect } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { STATIC_PATHS } from './sitemap';
import { PRIMARY_LINKS, SECTION_LINKS } from '@/lib/nav-links';

function pageFileFor(href: string): string {
  return join(process.cwd(), 'app', href === '/' ? '' : href, 'page.tsx');
}

describe('sitemap static paths', () => {
  it('covers every route the nav offers, with nothing left behind', () => {
    // The hand-written list this replaced went stale the day three tools pages
    // shipped: live, linked from the nav, absent from the sitemap, and nothing
    // anywhere complained.
    const navHrefs = new Set(
      [...PRIMARY_LINKS, ...SECTION_LINKS.database, ...SECTION_LINKS.tools]
        .filter((link) => link.ready)
        .map((link) => link.href),
    );
    expect(new Set(STATIC_PATHS)).toEqual(navHrefs);
  });

  it('lists each route once, however many nav rows point at it', () => {
    // /database/monsters and /tools/afk-finder each appear twice in the tables
    // -- once as a section stand-in in the top row, once in their own section.
    // A duplicate URL in a sitemap is a duplicate-content signal, not a
    // stronger one.
    expect(new Set(STATIC_PATHS).size).toBe(STATIC_PATHS.length);
  });

  it('points only at routes that have a page file', () => {
    for (const path of STATIC_PATHS) {
      expect({ path, exists: existsSync(pageFileFor(path)) }).toEqual({ path, exists: true });
    }
  });
});

// The bottom bar is the only nav a phone user has for the five primary
// destinations -- the top row hides itself at the same breakpoint -- so what
// matters is that it carries all of them and marks the right one.
import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { PRIMARY_LINKS } from '@/lib/nav-links';

const pathname = vi.hoisted(() => ({ current: '/' }));
vi.mock('next/navigation', () => ({ usePathname: () => pathname.current }));

const { default: BottomNav } = await import('@/components/BottomNav');

describe('BottomNav', () => {
  it('carries every primary destination, so nothing is lost when the top row hides', () => {
    pathname.current = '/';
    const html = renderToStaticMarkup(<BottomNav />);
    for (const link of PRIMARY_LINKS.filter((l) => l.ready)) {
      expect(html).toContain(`href="${link.href}"`);
    }
  });

  it('fits a phone row: at most five buttons', () => {
    // Five 78px targets on a 390px screen. A sixth link added to the nav has
    // to be a deliberate decision about this bar, not a surprise.
    expect(PRIMARY_LINKS.filter((l) => l.ready).length).toBeLessThanOrEqual(5);
  });

  it('marks the section the reader is in, not just an exact URL match', () => {
    pathname.current = '/database/monsters/1002';
    const html = renderToStaticMarkup(<BottomNav />);
    expect(html).toContain('aria-current="page"');
    // Exactly one button is current: two highlighted buttons would be worse
    // than none.
    expect(html.match(/aria-current="page"/g)).toHaveLength(1);
    const current = /<a[^>]*aria-current="page"[^>]*href="([^"]+)"|<a[^>]*href="([^"]+)"[^>]*aria-current="page"/.exec(html);
    expect(current?.[1] ?? current?.[2]).toBe('/database/monsters');
  });

  it('keeps the home button unhighlighted while reading a database page', () => {
    // "/" is a prefix of every path, so an unguarded match lights home up
    // everywhere.
    pathname.current = '/guides/exp';
    const html = renderToStaticMarkup(<BottomNav />);
    expect(html).not.toMatch(/href="\/"[^>]*aria-current/);
  });
});

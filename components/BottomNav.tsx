'use client';

// The five primary destinations, on a phone, at the bottom of the screen.
//
// The last open item on the UX audit, and the reason it was open is that it
// is a structural change rather than a tweak: on a phone the top bar carried
// the brand, the search button, the five primary links wrapped onto their own
// row, and the section grid -- measured at 363px on the monster list and
// 500px on /guides, against an 844px screen. The primary row is the part that
// does not have to be up there: it is the same five links on every page, and
// the thumb reaches the bottom of the screen more easily than the top.
//
// Same links, same order and same active-state rules as the top row
// (lib/nav-links) -- this is where they move to on a phone, not a second
// menu with its own opinions. The top row hides itself at the same width, so
// nothing is duplicated on screen.
//
// Not rendered at all on a wide screen: `display: none` alone would leave a
// fixed bar in the accessibility tree, and the CSS carries the breakpoint
// anyway.

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PRIMARY_LINKS, isActivePrimaryLink } from '@/lib/nav-links';

/** Short labels: five of them share a 390px row, so "ค้นของดรอป" has to fit
 *  a 78px button. Only where the nav label is too long -- the rest are used
 *  as they are, so the two rows read the same. */
const SHORT: Record<string, string> = {
  '/drop-finder': 'ค้นดรอป',
  '/database/monsters': 'ฐานข้อมูล',
  '/tools/leveling-spots': 'เครื่องมือ',
};

export default function BottomNav() {
  const pathname = usePathname() ?? '/';

  return (
    <nav className="bottomnav" aria-label="เมนูล่าง">
      {PRIMARY_LINKS.filter((link) => link.ready).map((link) => {
        const active = isActivePrimaryLink(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? 'bottomnav__link bottomnav__link--on' : 'bottomnav__link'}
            aria-current={active ? 'page' : undefined}
          >
            {SHORT[link.href] ?? link.label}
          </Link>
        );
      })}
    </nav>
  );
}

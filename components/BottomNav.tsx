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
// The icons are game sprites, the same ones the section row uses, mirrored
// under public/images: a butterfly wing (what a player uses to get home), a
// magnifier, an encyclopedia, an iron hammer and a creation guide. Chosen for
// what each means in the game rather than for what it looks like -- and
// checked at 22px for being distinguishable from one another, which is why
// the two books are one thick and one flat stack.

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

const ICONS: Record<string, string> = {
  '/': '/images/items/602.gif',
  '/drop-finder': '/images/items/611.gif',
  '/database/monsters': '/images/items/1564.gif',
  '/tools/leveling-spots': '/images/items/613.gif',
  '/guides': '/images/items/7127.gif',
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
            {/* Decorative: the label under it is the name of the
                destination, so a second copy in alt text would make a screen
                reader say every button twice. */}
            <img className="bottomnav__icon" src={ICONS[link.href]} alt="" width={22} height={22} />
            <span className="bottomnav__label">{SHORT[link.href] ?? link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

'use client';

// The only client component in the nav. usePathname requires it, and the active
// highlight is the whole reason this file exists: .topnav a.on has been in
// globals.css since v1 and was never applied, so every page's nav looked
// identical and nobody could tell where they were (spec 6.6).
//
// The section row renders twice: the button row for wide screens, and on a
// phone a one-line "หมวด: มอนสเตอร์ ▾" that opens the same grid. The phone
// grid used to sit open on every page -- 12 to 16 buttons, pushing the page
// title to 303-440px on a 390px screen (UX review, 11 Sep 2026). Folded, every
// entry is still one tap away and nothing scrolls sideways, which was the
// point of the 1 Sep "wrap, never scroll" decision.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PRIMARY_LINKS,
  SECTION_LINKS,
  sectionForPath,
  isActiveLink,
  isActivePrimaryLink,
} from '@/lib/nav-links';

type SectionLink = (typeof SECTION_LINKS)[keyof typeof SECTION_LINKS][number];

function SectionRow({ links, pathname, className, onPick }: { links: readonly SectionLink[]; pathname: string; className: string; onPick?: () => void }) {
  return (
    <nav className={className} aria-label="เมนูย่อย">
      {links.map((link) =>
        link.ready ? (
          <Link
            key={link.href}
            href={link.href}
            className={isActiveLink(link.href, pathname) ? 'on' : undefined}
            aria-current={isActiveLink(link.href, pathname) ? 'page' : undefined}
            onClick={onPick}
          >
            {link.icon && (
              // Decorative: the label right next to it says the same thing.
              <img className="subnav__icon" src={link.icon} alt="" width={16} height={16} />
            )}
            {link.label}
          </Link>
        ) : (
          <span key={link.href} className="soon" aria-disabled="true">
            {link.label}
          </span>
        ),
      )}
    </nav>
  );
}

export default function NavTabs() {
  const pathname = usePathname() ?? '/';
  const section = sectionForPath(pathname);
  const secondRow = section ? SECTION_LINKS[section] : null;
  const [open, setOpen] = useState(false);
  // A client-side navigation keeps this component mounted, so the phone
  // picker would stay open over the new page without this.
  useEffect(() => setOpen(false), [pathname]);
  const active = secondRow?.find((link) => isActiveLink(link.href, pathname)) ?? null;

  return (
    <>
      <nav className="topnav" aria-label="เมนูหลัก">
        {PRIMARY_LINKS.map((link) =>
          link.ready ? (
            <Link
              key={link.href}
              href={link.href}
              className={isActivePrimaryLink(link.href, pathname) ? 'on' : undefined}
              aria-current={isActivePrimaryLink(link.href, pathname) ? 'page' : undefined}
            >
              {link.label}
            </Link>
          ) : (
            // Not a link: the route does not exist yet. The label still shows
            // so players know it is coming, but there is nothing to click and
            // nothing to 404 into.
            <span key={link.href} className="soon" aria-disabled="true">
              {link.label}
            </span>
          ),
        )}
      </nav>

      {secondRow && (
        <>
          <SectionRow links={secondRow} pathname={pathname} className="subnav subnav--wide" />
          <details className="subnavpick" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
            <summary>
              <span>
                หมวด:{' '}
                {active?.icon && <img className="subnav__icon" src={active.icon} alt="" width={16} height={16} />}
                <strong>{active?.label ?? 'เลือกหมวด'}</strong>
              </span>
            </summary>
            <SectionRow links={secondRow} pathname={pathname} className="subnav subnav--phone" onPick={() => setOpen(false)} />
          </details>
        </>
      )}
    </>
  );
}

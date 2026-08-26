'use client';

// The only client component in the nav. usePathname requires it, and the active
// highlight is the whole reason this file exists: .topnav a.on has been in
// globals.css since v1 and was never applied, so every page's nav looked
// identical and nobody could tell where they were (spec 6.6).

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PRIMARY_LINKS,
  SECTION_LINKS,
  sectionForPath,
  isActiveLink,
  isActivePrimaryLink,
} from '@/lib/nav-links';

export default function NavTabs() {
  const pathname = usePathname() ?? '/';
  const section = sectionForPath(pathname);
  const secondRow = section ? SECTION_LINKS[section] : null;

  return (
    <>
      <nav className="topnav" aria-label="เมนูหลัก">
        {PRIMARY_LINKS.map((link) => {
          const active = isActivePrimaryLink(link.href, pathname);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? 'on' : undefined}
              aria-current={active ? 'page' : undefined}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      {secondRow && (
        <nav className="subnav" aria-label="เมนูย่อย">
          {secondRow.map((link) => {
            const active = isActiveLink(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={active ? 'on' : undefined}
                aria-current={active ? 'page' : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      )}
    </>
  );
}

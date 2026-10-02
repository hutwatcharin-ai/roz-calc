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

// Each primary tab is its own coloured arcade button (owner's pick B2,
// 1 Oct 2026, public/draft/arcade-header); the colour lives in CSS.
const TAB_COLOUR: Record<string, string> = {
  '/': 'home',
  '/drop-finder': 'drop',
  '/database/monsters': 'db',
  '/tools/leveling-spots': 'tool',
  '/guides': 'guide',
};

type SectionLink = (typeof SECTION_LINKS)[keyof typeof SECTION_LINKS][number];

function SectionRow({ links, pathname, className, onPick }: { links: readonly SectionLink[]; pathname: string; className: string; onPick?: () => void }) {
  return (
    <nav className={className} aria-label="เมนูย่อย">
      {links.map((link, i) => [
        // A group change gets a marker: a heading in the phone grid, a thin
        // divider in the wide row (owner's pick, 22 Sep 2026). Only the
        // guides row has groups; the other rows render exactly as before.
        link.group && link.group !== links[i - 1]?.group ? (
          <span key={`g-${link.group}`} className="subnav__group" role="presentation">
            <span className="subnav__grouplabel">{link.group}</span>
          </span>
        ) : null,
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
      ])}
    </nav>
  );
}

// A guide page gets a one-line stage bar instead of the 27-button row
// (owner, 2 Oct 2026, public/draft/arcade-rest): back to /guides, the world
// this guide is in, the stages either side, and a picker with every guide.
// The worlds and their order are the ones /guides draws (GUIDE_GROUPS).
const WORLD_EN: Record<string, string> = {
  เริ่มเล่น: 'START',
  คราฟต์: 'CRAFT',
  ดันเจี้ยน: 'DUNGEON',
  ตารางอ้างอิง: 'TABLES',
  ระบบในเกม: 'SYSTEMS',
};

function GuideStageBar({ links, pathname }: { links: readonly SectionLink[]; pathname: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);
  const idx = links.findIndex((l) => isActiveLink(l.href, pathname));
  if (idx < 0) return null;
  const here = links[idx];
  const groups = [...new Set(links.map((l) => l.group))];
  const world = groups.indexOf(here.group) + 1;
  const inWorld = links.filter((l) => l.group === here.group);
  const stage = inWorld.indexOf(here) + 1;
  const prev = links[idx - 1];
  const next = links[idx + 1];
  const code = (l: SectionLink) => `${groups.indexOf(l.group) + 1}-${links.filter((x) => x.group === l.group).indexOf(l) + 1}`;
  return (
    <div className="gstage" data-world={WORLD_EN[here.group ?? '']?.toLowerCase()}>
      <nav className="gstage__bar" aria-label="ไกด์">
        <Link href="/guides" className="gstage__home">◀ ไกด์ทั้งหมด</Link>
        <span className="gstage__world">
          {here.icon && <img src={here.icon} alt="" width={18} height={18} />}
          STAGE {world}-{stage} · {WORLD_EN[here.group ?? ''] ?? here.group}
        </span>
        {prev && (
          <Link href={prev.href} className="gstage__step" rel="prev">
            ◀ <span className="mono">{code(prev)}</span> <span className="gstage__steplabel">{prev.label}</span>
          </Link>
        )}
        {next && (
          <Link href={next.href} className="gstage__step" rel="next">
            <span className="mono">{code(next)}</span> <span className="gstage__steplabel">{next.label}</span> ▶
          </Link>
        )}
        <details className="gstage__pick" open={open} onToggle={(e) => setOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary>☰ เลือกด่าน</summary>
          <SectionRow links={links} pathname={pathname} className="subnav gstage__all" onPick={() => setOpen(false)} />
        </details>
      </nav>
    </div>
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
              data-k={TAB_COLOUR[link.href]}
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

      {/* /guides itself has its own search and world tabs, so no row at all. */}
      {section === 'guides' && secondRow && (pathname === '/guides' || secondRow.some((l) => isActiveLink(l.href, pathname))) ? (
        pathname === '/guides' ? null : <GuideStageBar links={secondRow} pathname={pathname} />
      ) : secondRow && (
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

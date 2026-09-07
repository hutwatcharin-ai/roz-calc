// components/Nav.tsx
//
// Server component wrapper. Only NavTabs is a client component -- it needs
// usePathname -- so the shell, the brand mark, and the search box stay on the
// server (spec 4).

import Link from 'next/link';
import NavTabs from './NavTabs';
import GlobalSearch from './GlobalSearch';

export default function Nav() {
  return (
    <div className="topbar">
      <div className="topbar__in">
        {/* The brand mark is the way home -- the universal convention, and
            until now it was a dead <span>. */}
        <Link href="/" className="brand__mark" aria-label="กลับหน้าแรก">
          RO ZERO<em>THAI</em>
        </Link>
        <NavTabs />
        {/* Right-aligned by .topbar__search's margin, so it keeps its place
            whether or not the section row below is showing. */}
        <GlobalSearch />
      </div>
    </div>
  );
}

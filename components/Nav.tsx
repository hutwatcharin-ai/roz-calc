// components/Nav.tsx
//
// Server component wrapper. Only NavTabs is a client component -- it needs
// usePathname -- so the shell, the brand mark, and the search box stay on the
// server (spec 4).

import GlobalSearch from './GlobalSearch';
import NavTabs from './NavTabs';

export default function Nav() {
  return (
    <div className="topbar">
      <div className="topbar__in">
        <span className="brand__mark">RO ZERO<em>THAI</em></span>
        <NavTabs />
        <GlobalSearch />
      </div>
    </div>
  );
}

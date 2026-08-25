// components/Nav.tsx
import Link from 'next/link';
import GlobalSearch from './GlobalSearch';

const LINKS = [
  { href: '/', label: 'หาจุดตี' },
  { href: '/drop-finder', label: 'ค้นของดรอป' },
  { href: '/database/monsters', label: 'มอนสเตอร์' },
  { href: '/database/items', label: 'ไอเทม' },
];

export default function Nav() {
  return (
    <div className="topbar">
      <div className="topbar__in">
        <span className="brand__mark">ZERO<em>CALC</em></span>
        <nav className="topnav">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <GlobalSearch />
      </div>
    </div>
  );
}

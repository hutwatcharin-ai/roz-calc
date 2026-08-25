// components/Nav.tsx
import Link from 'next/link';

const LINKS = [
  { href: '/', label: 'หาจุดตี' },
  { href: '/drop-finder', label: 'ค้นของดรอป' },
  { href: '/stat-calculator', label: 'คำนวณสเตตัส' },
  { href: '/database/monsters', label: 'ฐานข้อมูล' },
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
      </div>
    </div>
  );
}

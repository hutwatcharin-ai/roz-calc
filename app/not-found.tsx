// app/not-found.tsx
//
// The page for a URL that does not exist. Until 11 Sep 2026 this was Next's
// built-in screen: "404 This page could not be found." in English, dark grey on
// the site's dark ground, no way onward (UX review against the Checklist Design
// 404 checklist: title, explanation, links to other pages). A reader who lands
// here came from an old link or a typo, so the page offers the search and the
// sections people actually open.

import Link from 'next/link';
import GlobalSearch from '@/components/GlobalSearch';

export const metadata = {
  title: 'ไม่พบหน้านี้',
  robots: { index: false, follow: true },
};

const WHERE_TO = [
  { href: '/database/monsters', label: 'มอนสเตอร์', icon: '/images/items/909.gif' },
  { href: '/database/items', label: 'ไอเทม', icon: '/images/items/512.gif' },
  { href: '/drop-finder', label: 'ค้นของดรอป', icon: '/images/items/601.gif' },
  { href: '/database/cards', label: 'การ์ด', icon: '/images/items/4001.gif' },
  { href: '/tools/leveling-spots', label: 'ฟาร์มที่ไหนดี', icon: '/images/items/607.gif' },
  { href: '/guides', label: 'ไกด์', icon: '/images/items/7134.gif' },
];

export default function NotFound() {
  return (
    <main className="shell notfound" style={{ paddingBlock: 40 }}>
      <img className="notfound__sprite" src="/images/monsters/1002.gif" alt="" width={72} height={72} />
      <p className="notfound__code">404</p>
      <h1 className="pagehead__title">ไม่พบหน้านี้</h1>
      <p className="muted" style={{ maxWidth: '52ch' }}>
        ลิงก์อาจเก่าหรือพิมพ์ผิด หน้านี้อาจถูกย้ายไปแล้ว — ลองค้นชื่อมอน ไอเทม การ์ด สกิล หรือแมพที่ต้องการได้เลย
      </p>
      <div className="notfound__search">
        <GlobalSearch />
      </div>
      <h2 className="section-title" style={{ marginTop: 24 }}>
        หรือไปที่
      </h2>
      <div className="notfound__links">
        {WHERE_TO.map((link) => (
          <Link key={link.href} href={link.href} className="chiplink">
            <img src={link.icon} alt="" width={18} height={18} style={{ imageRendering: 'pixelated' }} /> {link.label}
          </Link>
        ))}
      </div>
      <p style={{ marginTop: 24 }}>
        <Link href="/">← กลับหน้าแรก</Link>
      </p>
    </main>
  );
}

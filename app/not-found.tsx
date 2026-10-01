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

// The arcade "GAME OVER / CONTINUE?" screen (owner, 1 Oct 2026: neon arcade
// across the site). The h1 stays plain Thai so the page still says what
// happened to a screen reader and in the tab title.
export default function NotFound() {
  return (
    <main className="shell notfound" style={{ paddingBlock: 40 }}>
      <section className="gameover">
        <img className="gameover__sprite" src="/images/monsters/1002.gif" alt="" width={96} height={96} />
        <p className="gameover__big" aria-hidden="true">GAME OVER</p>
        <p className="notfound__code">ERROR 404</p>
        <h1 className="pagehead__title gameover__title">ไม่พบหน้านี้</h1>
        <p className="muted" style={{ maxWidth: '52ch', marginInline: 'auto' }}>
          ลิงก์อาจเก่าหรือพิมพ์ผิด หน้านี้อาจถูกย้ายไปแล้ว ลองค้นชื่อมอน ไอเทม การ์ด สกิล หรือแมพที่ต้องการได้เลย
        </p>
        <div className="notfound__search">
          <GlobalSearch />
        </div>
        <h2 className="gameover__continue">
          CONTINUE? <span>เลือกไปต่อ</span>
        </h2>
        <ul className="gameover__menu">
          {WHERE_TO.map((link) => (
            <li key={link.href}>
              <Link href={link.href}>
                <span className="gameover__cur" aria-hidden="true">▶</span>
                <img src={link.icon} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <p style={{ marginTop: 20 }}>
          <Link href="/">← กลับหน้าแรก</Link>
        </p>
      </section>
    </main>
  );
}

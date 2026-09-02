// components/SiteFooter.tsx
//
// Brand block, the two section link lists, and the ways to reach the
// maintainer. The link lists are derived from lib/nav-links so a page that
// ships into the nav shows up here the same day -- the earlier hand-written
// "ทางลัด" list was already four pages behind the nav.
//
// The source credits that used to fill two of these columns moved to
// /about#sources (user, 2 Sep): a reader who wants to check where a number
// came from is on a monster page, not scrolling a footer; the footer only
// needs to point at the page that answers it.

import Link from 'next/link';
import { SECTION_LINKS } from '@/lib/nav-links';
import { getLastUpdated } from '@/lib/last-updated';
import { timeAgoTh } from '@/lib/time-ago';

function LinkList({ links }: { links: typeof SECTION_LINKS.database }) {
  return (
    <ul className="sitefooter__list">
      {links
        .filter((link) => link.ready)
        .map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
    </ul>
  );
}

export default async function SiteFooter() {
  const lastUpdated = await getLastUpdated();

  return (
    <footer className="sitefooter">
      <div className="shell sitefooter__in">
        <div className="sitefooter__grid">
          <div className="sitefooter__brand">
            <Link href="/" className="brand__mark sitefooter__mark" aria-label="กลับหน้าแรก">
              RO ZERO<em>THAI</em>
            </Link>
            <p className="sitefooter__tagline">
              ฐานข้อมูลและเครื่องมือ <strong>Ragnarok Zero Global</strong> ภาษาไทย ทำโดยผู้เล่น
            </p>
            {lastUpdated && (
              <p className="sitefooter__fresh">
                <span className="sitefooter__dot" aria-hidden="true" />
                ข้อมูลอัปเดตล่าสุด {timeAgoTh(lastUpdated)}
              </p>
            )}
            <p className="sitefooter__note">
              ไม่ใช่เว็บทางการ และไม่ได้เกี่ยวข้องกับ Gravity หรือผู้ให้บริการเกม
            </p>
          </div>

          <nav className="sitefooter__col" aria-label="ฐานข้อมูล">
            <h2 className="sitefooter__h">ฐานข้อมูล</h2>
            <LinkList links={SECTION_LINKS.database} />
          </nav>

          <nav className="sitefooter__col" aria-label="เครื่องมือ">
            <h2 className="sitefooter__h">เครื่องมือ</h2>
            <LinkList links={SECTION_LINKS.tools} />
          </nav>

          {/* Split on purpose (user, 2 Sep): a bug report and an ad inquiry
              are different audiences reading the same footer -- a would-be
              advertiser landing on "แจ้งบั๊กที่ GitHub" reads as a hobby
              project with no business contact, and quietly leaves. */}
          <div className="sitefooter__col">
            <h2 className="sitefooter__h">เกี่ยวกับ</h2>
            <ul className="sitefooter__list">
              <li>
                <Link href="/about">เกี่ยวกับเว็บนี้</Link>
              </li>
              <li>
                <Link href="/about#sources">ตัวเลขมาจากไหน</Link>
              </li>
              <li>
                <a href="https://github.com/hutwatcharin-ai/roz-calc/issues" target="_blank" rel="noopener noreferrer">
                  แจ้งข้อมูลผิด (GitHub)
                </a>
              </li>
            </ul>
            <a
              className="sitefooter__adlink"
              href="mailto:kidkrob@gmail.com?subject=สอบถามลงโฆษณา%20rozerothai.com"
            >
              ลงโฆษณา / ติดต่อธุรกิจ →
            </a>
          </div>
        </div>

        <div className="sitefooter__bottom">
          <span>© {new Date().getFullYear()} RO Zero Thai · rozerothai.com</span>
          <span className="sitefooter__credit">
            ข้อมูลตรวจทานกับ{' '}
            <a href="https://rozerodb.com" target="_blank" rel="noopener noreferrer">rozerodb</a> ·{' '}
            <a href="https://ragnarokzero.net" target="_blank" rel="noopener noreferrer">ragnarokzero.net</a> ·{' '}
            <a href="https://midgardhub.com" target="_blank" rel="noopener noreferrer">midgardhub</a> ·{' '}
            <a href="https://github.com/rathena/rathena" target="_blank" rel="noopener noreferrer">rAthena</a>
          </span>
        </div>
      </div>
    </footer>
  );
}

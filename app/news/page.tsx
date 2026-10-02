// app/news/page.tsx
//
// The news index (2 Oct 2026). Every page under /news existed with no page
// listing them: the only ways in were chips at the bottom of the homepage and
// a link inside each patch. NOW PLAYING on top, then the rest newest first;
// both come from lib/news.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import NowPlaying from '@/components/NowPlaying';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { isLive, splitNews } from '@/lib/news';

export const metadata = {
  title: 'ข่าว แพทช์ และกิจกรรม Ragnarok Zero Global',
  description:
    'รวมทุกแพทช์และกิจกรรมของ Ragnarok Zero Global ภาษาไทย กิจกรรมที่กำลังจัด วันที่เหลือ และสรุปแพทช์ก่อนหน้า สรุปจากประกาศและไฟล์เกม',
};

// Rebuilt hourly so an event that ends drops out of NOW PLAYING the same day.
export const revalidate = 3600;

export default function NewsPage() {
  const now = Date.now();
  const { live, archive } = splitNews(now);
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
        ])}
      />
      <p className="arckicker">NEWS · ข่าวและแพทช์</p>
      <PageHeader title="ข่าว แพทช์ และกิจกรรม" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        ทุกแพทช์และกิจกรรมของ Ragnarok Zero Global ภาษาไทย สรุปจากประกาศและไฟล์เกม
      </p>

      <NowPlaying live={live} now={now} />

      {archive.length > 0 && (
        <section className="newsarch" aria-labelledby="newsarch-h">
          <h2 id="newsarch-h" className="newsarch__title">▶ ข่าวก่อนหน้า</h2>
          <ul className="newsarch__list">
            {archive.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="newsrow" data-kind={item.kind}>
                  <time dateTime={item.date}>{item.dateTh}</time>
                  <span>
                    <b>{item.kind === 'patch' ? `แพทช์ ${item.dateTh} · ` : ''}{item.title}</b>
                    <small>{item.kind === 'patch' ? 'แพทช์' : 'กิจกรรม'}</small>
                  </span>
                  {item.kind === 'event' && !isLive(item, now) && <span className="newsrow__ended">จบแล้ว</span>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

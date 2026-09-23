// app/guides/page.tsx
//
// The landing page of the section the reference tables and the written guide
// moved into on 3 Sep 2026. It exists because the nav's primary tab needs
// somewhere to point, and because "which table do I want" is a question worth
// answering in a sentence each rather than by chip label alone.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { GUIDE_GROUPS, SECTION_LINKS } from '@/lib/nav-links';
import { GUIDES } from '@/lib/guide-cards';

export const metadata = {
  title: 'ไกด์และตารางอ้างอิง',
  description:
    'ตารางธาตุ ตารางขนาด ตาราง EXP ต่อเลเวล และจุดฟาร์มแนะนำของ Ragnarok Zero Global รวมไว้ที่เดียว เปิดดูได้เลยไม่ต้องกรอกอะไร',
};



export default function GuidesPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
        ])}
      />
      <PageHeader title="ไกด์และตารางอ้างอิง" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        หน้าพวกนี้เปิดอ่านได้เลย ไม่ต้องกรอกอะไร — ส่วนที่ต้องใส่ตัวเลขของตัวเองแล้วให้เว็บคำนวณ อยู่ใน{' '}
        <Link href="/tools/leveling-spots">เครื่องมือ</Link> · ส่วนอัปเดตของเกมว่ามาแล้วอะไรและเดือนหน้ามีอะไร อยู่ที่{' '}
        <Link href="/news/roadmap">ไทม์ไลน์อัปเดต</Link>
      </p>

      {GUIDE_GROUPS.map((group) => {
        const cards = SECTION_LINKS.guides
          .filter((link) => link.group === group)
          .map((link) => GUIDES.find((guide) => guide.href === link.href))
          .filter((guide): guide is (typeof GUIDES)[number] => Boolean(guide));
        if (!cards.length) return null;
        return (
          <section key={group} className="guidegroup">
            <h2 className="section-title">{group}</h2>
            <div className="itemgrid">
              {cards.map((guide) => (
                <Link key={guide.href} href={guide.href} className="guidecard">
                  <span className="guidecard__title">{guide.title}</span>
                  <span className="guidecard__blurb">{guide.blurb}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

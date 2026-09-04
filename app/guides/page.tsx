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

export const metadata = {
  title: 'ไกด์และตารางอ้างอิง',
  description:
    'ตารางธาตุ ตารางขนาด ตาราง EXP ต่อเลเวล และจุดฟาร์มแนะนำของ Ragnarok Zero Global รวมไว้ที่เดียว เปิดดูได้เลยไม่ต้องกรอกอะไร',
};

// Ordered by how often a player opens them, not alphabetically.
const GUIDES = [
  {
    href: '/guides/farm-guide',
    title: 'จุดฟาร์มแนะนำ',
    blurb: 'ช่วงเลเวลไหนควรไปตีอะไร ไล่ตั้งแต่ออกจากเมืองใหม่ ๆ จนถึงเลเวลสูงสุด พร้อมเหตุผลว่าทำไมจุดนั้น',
  },
  {
    href: '/guides/codes',
    title: 'โค้ดรับของ',
    blurb: 'โค้ดคูปองที่มีคนรวบรวมไว้ 18 โค้ด กรอกที่บัญชี GNJOY ของเข้าเมลในเกม',
  },
  {
    href: '/guides/elements',
    title: 'ตารางธาตุ',
    blurb: 'ธาตุอาวุธไหนตีธาตุมอนแล้วเข้ากี่ % ครบทั้ง 4 ระดับธาตุ — ตารางเดียวกับที่เกมใช้คำนวณ',
  },
  {
    href: '/guides/sizes',
    title: 'ตารางขนาด',
    blurb: 'ชนิดอาวุธกับขนาดมอน: มีดตีมอนใหญ่ได้กี่ % หอกตีมอนเล็กเหลือเท่าไร',
  },
  {
    href: '/guides/exp',
    title: 'EXP ต่อเลเวล',
    blurb: 'ต้องใช้ EXP เท่าไรถึงจะขึ้นเลเวลถัดไป ทั้ง Base และ Job ดูรวดเดียวทั้งช่วง',
  },
] as const;

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
        <Link href="/tools/leveling-spots">เครื่องมือ</Link>
      </p>

      <div className="itemgrid">
        {GUIDES.map((guide) => (
          <Link key={guide.href} href={guide.href} className="guidecard">
            <span className="guidecard__title">{guide.title}</span>
            <span className="guidecard__blurb">{guide.blurb}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

// /advertise/preview -- a shop tries its own banner on the real pages
// (TryBanner). It replaced a sketch of the three sold slots (13 Oct 2026) on
// 27 Nov 2026, when the owner wanted shops to see placements for themselves
// rather than wait for our screenshots. Not for search: a sales tool, not a
// page about the game.

import './page.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import TryBanner from './TryBanner';

export const metadata: Metadata = {
  title: 'ลองใส่แบนเนอร์บนหน้าเว็บจริง — RO Zero Thai',
  description: 'เลือกไฟล์แบนเนอร์ของคุณ แล้วดูว่าจะอยู่ตรงไหนของหน้าเว็บจริง ทั้งบนคอมและมือถือ ทุกตำแหน่ง พร้อมขนาดไฟล์ที่แนะนำ',
  robots: { index: false, follow: true },
};

export default function AdPreviewPage() {
  return (
    <main className="shell adpreview">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/advertise">ลงโฆษณา</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ลองใส่แบนเนอร์</span>
      </nav>

      <PageHeader
        title="ลองใส่แบนเนอร์บนหน้าเว็บจริง"
        lead="เลือกไฟล์แบนเนอร์ของคุณ เลือกตำแหน่ง แล้วดูบนหน้าจริงของเว็บได้ทั้งคอมและมือถือ ยังไม่มีไฟล์ก็ดูตำแหน่งได้เลย"
      />

      <section className="card adpreview__block">
        <TryBanner />
      </section>

      <p className="adpreview__back">
        <Link className="btn" href="/advertise#ad-slots">ดูราคาและจองตำแหน่ง →</Link>
      </p>
    </main>
  );
}

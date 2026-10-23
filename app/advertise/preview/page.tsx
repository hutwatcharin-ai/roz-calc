// /advertise/preview — what a banner looks like in each slot, for someone
// deciding whether to buy (owner, 13 Oct 2026). The house ad no longer shows
// on the short database pages, so this page is where a buyer sees the slots.
//
// The banners are drawn here at the real sizes (lib/ads AD_SIZES); the page
// content around them is a sketch, labelled as one. Not for search: it is a
// sales sample, not a page about the game.

import './page.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { AD_SIZES, type AdSlot } from '@/lib/ads';

export const metadata: Metadata = {
  title: 'ตัวอย่างตำแหน่งโฆษณา — RO Zero Thai',
  description: 'ดูว่าแบนเนอร์ของคุณจะอยู่ตรงไหนของหน้าและขนาดเท่าไหร่ ทั้ง 3 ตำแหน่ง',
  robots: { index: false, follow: true },
};

function Sample({ slot, name }: { slot: AdSlot; name: string }) {
  const size = AD_SIZES[slot];
  const style = {
    '--ad-w': `${size.wide[0]}px`,
    '--ad-h': `${size.wide[1]}px`,
    '--ad-narrow-w': `${size.narrow[0]}px`,
    '--ad-narrow-h': `${size.narrow[1]}px`,
    '--ad-ratio': `${size.wide[0]} / ${size.wide[1]}`,
    '--ad-narrow-ratio': `${size.narrow[0]} / ${size.narrow[1]}`,
  } as React.CSSProperties;
  return (
    <aside className={`adslot adslot--${slot} adsample`} style={style} aria-label={`ตัวอย่าง${name}`}>
      <span className="adslot__tag">โฆษณา</span>
      <div className="adslot__link adsample__art">
        <strong>แบนเนอร์ของคุณ</strong>
        <span className="mono adsample__wide">{size.wide[0]}×{size.wide[1]}</span>
        <span className="mono adsample__narrow">{size.narrow[0]}×{size.narrow[1]}</span>
      </div>
    </aside>
  );
}

const Lines = ({ n }: { n: number }) => (
  <div className="adsample__lines" aria-hidden="true">
    {Array.from({ length: n }, (_, i) => <i key={i} style={{ width: `${92 - ((i * 17) % 40)}%` }} />)}
  </div>
);

export default function AdPreviewPage() {
  return (
    <main className="shell adpreview">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/advertise">ลงโฆษณา</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ตัวอย่างตำแหน่ง</span>
      </nav>

      <PageHeader
        title="ตัวอย่างตำแหน่งโฆษณา"
        lead="แบนเนอร์ในหน้านี้วาดขนาดจริงทั้งบนคอมและมือถือ ส่วนเนื้อหารอบ ๆ เป็นภาพร่าง ให้เห็นว่าแบนเนอร์อยู่ตรงไหนของหน้า"
      />

      <section className="card adpreview__block" aria-labelledby="ap-top">
        <h2 className="section-title" id="ap-top">1 · แบนเนอร์บนสุด</h2>
        <p className="muted">อยู่ใต้เมนู เหนือเนื้อหา เห็นทุกหน้าของเว็บ</p>
        <div className="adpreview__frame">
          <div className="adpreview__nav" aria-hidden="true"><b>RO ZERO THAI</b><i /><i /><i /><i /></div>
          <Sample slot="top" name="แบนเนอร์บนสุด" />
          <Lines n={3} />
        </div>
      </section>

      <section className="card adpreview__block" aria-labelledby="ap-inline">
        <h2 className="section-title" id="ap-inline">2 · แบนเนอร์แทรกเนื้อหา</h2>
        <p className="muted">อยู่กลางหน้าฐานข้อมูลมอนสเตอร์ อุปกรณ์ และหาจุดเลเวล คั่นระหว่างรายการ</p>
        <div className="adpreview__frame">
          <div className="adpreview__grid" aria-hidden="true">{Array.from({ length: 6 }, (_, i) => <i key={i} />)}</div>
          <Sample slot="inline" name="แบนเนอร์แทรกเนื้อหา" />
          <div className="adpreview__grid" aria-hidden="true">{Array.from({ length: 3 }, (_, i) => <i key={i} />)}</div>
        </div>
      </section>

      <section className="card adpreview__block" aria-labelledby="ap-detail">
        <h2 className="section-title" id="ap-detail">3 · แบนเนอร์ท้ายหน้ารายละเอียด</h2>
        <p className="muted">อยู่ท้ายหน้ามอนรายตัว อุปกรณ์ คอสตูม และการ์ดรายชิ้น หลังคนอ่านข้อมูลจบ</p>
        <div className="adpreview__frame">
          <Lines n={5} />
          <Sample slot="detail" name="แบนเนอร์ท้ายหน้ารายละเอียด" />
        </div>
      </section>

      <p className="adpreview__back">
        <Link className="btn" href="/advertise#ad-slots">ดูราคาและจองตำแหน่ง →</Link>
      </p>
    </main>
  );
}

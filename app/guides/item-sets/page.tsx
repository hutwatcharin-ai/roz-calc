// app/guides/item-sets/page.tsx
//
// Every item set and its bonus (owner, 30 Sep 2026). The same sets also show
// on each piece's own page (components/InSetBox), which is where most
// players meet a set; this page is for browsing and search.
// Data: data/item-sets.json, see scripts/build-item-sets.mjs for sources.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import ItemSetCard from '@/components/ItemSetCard';
import SetFilter from '@/components/SetFilter';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { ITEM_SETS, SET_KINDS } from '@/lib/item-sets';

export const metadata: Metadata = {
  title: 'ชุดไอเทม Ragnarok Zero — ใส่ครบชุดได้โบนัสอะไร (การ์ดคู่ ชุดกิลด์ ชุดดัน)',
  description:
    'รวมชุดไอเทมและการ์ดคู่ใน Ragnarok Zero Global ใส่ครบแล้วได้โบนัสอะไร เช่น Wolf + Vagabond Wolf FLEE +18, ชุด Expedition, ชุดกิลด์, การ์ด Shibasays คู่ไข่สัตว์เลี้ยง และหินคอสตูม ค้นหาได้',
};

export default function ItemSetsPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ชุดไอเทม', path: '/guides/item-sets' },
        ])}
      />
      <PageHeader title="ชุดไอเทม ใส่ครบได้อะไร" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 14, maxWidth: '70ch' }}>
        {ITEM_SETS.length} ชุด · ใส่ของหรือการ์ดครบทุกชิ้นในชุดพร้อมกัน จะได้โบนัสเพิ่มจากผลของแต่ละชิ้น ·
        หน้าของแต่ละชิ้นก็บอกด้วยว่าอยู่ในชุดไหน
      </p>
      <SetFilter />
      <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
        ข้ามไป:{' '}
        {SET_KINDS.map((k, i) => (
          <span key={k.kind}>
            {i > 0 && ' · '}
            <a href={`#${k.kind}`}>{k.label}</a>
          </span>
        ))}
      </p>

      {SET_KINDS.map((k) => {
        const sets = ITEM_SETS.filter((s) => s.kind === k.kind);
        if (sets.length === 0) return null;
        return (
          <section key={k.kind} id={k.kind} className="isetgroup" style={{ marginTop: 24, scrollMarginTop: 90 }}>
            <h2 className="section-title">{k.label} <span className="muted" style={{ fontWeight: 400 }}>· {sets.length} ชุด</span></h2>
            <div className="isetgrid">
              {sets.map((s) => <ItemSetCard key={s.name} set={s} />)}
            </div>
          </section>
        );
      })}

      <Caveat label="เชื่อได้แค่ไหน">
        รายชื่อชุดและชิ้นในชุดมาจาก rozerodb กับ prontera ซึ่งตรงกันทุกชุดที่ซ้อนกัน · สองชุดหมวก Nordfeld มีแค่ prontera
        แต่คำอธิบายของ Gem Poring Card ในเกมเขียนโบนัสไว้เอง · ชุดหิน DEF กับ MDEF มาจากคำอธิบายหินในเกม ·
        โบนัสเขียนเป็นภาษาไทยจากข้อความภาษาอังกฤษ ถ้าในเกมไม่ตรงบอกได้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/cards">การ์ดทั้งหมด</Link> · <Link href="/guides/costume-enchant">หินเอนแชนต์คอสตูม</Link> ·{' '}
        <Link href="/guides/memorial-gear">ชุดดันเจี้ยน</Link>
      </p>
    </main>
  );
}

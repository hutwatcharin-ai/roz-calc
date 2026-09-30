// app/guides/item-sets/page.tsx
//
// Every item set and its bonus. Renamed "ไอเทมเซ็ต" by the owner on 30 Sep
// 2026 (the word players use), and redesigned the same day: bonus first and
// big, pieces one per line, kind chips instead of jump links. The same sets
// also show on each piece's own page (components/InSetBox), which is where
// most players meet a set; this page is for browsing and search.
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
  title: 'ไอเทมเซ็ต Ragnarok Zero — ใส่ครบเซ็ตได้โบนัสอะไร (การ์ดคู่ เซ็ตกิลด์ เซ็ตดัน)',
  description:
    'รวมไอเทมเซ็ตและการ์ดคู่ใน Ragnarok Zero Global ใส่ครบแล้วได้โบนัสอะไร เช่น Wolf + Vagabond Wolf FLEE +18, เซ็ต Expedition, เซ็ตกิลด์, การ์ด Shibasays คู่ไข่สัตว์เลี้ยง และหินคอสตูม ค้นหาได้',
};

export default function ItemSetsPage() {
  const groups = SET_KINDS.map((k) => ({ ...k, sets: ITEM_SETS.filter((s) => s.kind === k.kind) })).filter((g) => g.sets.length > 0);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ไอเทมเซ็ต', path: '/guides/item-sets' },
        ])}
      />
      <PageHeader title="ไอเทมเซ็ต ใส่ครบได้อะไร" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 14, maxWidth: '70ch' }}>
        {ITEM_SETS.length} เซ็ต · ใส่ของหรือการ์ดให้ครบทุกชิ้นในเซ็ตพร้อมกัน จะได้โบนัสเพิ่มจากผลของแต่ละชิ้น ·
        หน้าของแต่ละชิ้นก็บอกด้วยว่าอยู่ในเซ็ตไหน
      </p>

      <SetFilter kinds={groups.map((g) => ({ kind: g.kind, label: g.label, count: g.sets.length }))} />

      {groups.map((g) => (
        <section key={g.kind} id={g.kind} className="isetgroup" style={{ marginTop: 20, scrollMarginTop: 90 }}>
          <h2 className="section-title">{g.label} <span className="muted" style={{ fontWeight: 400 }}>· {g.sets.length} เซ็ต</span></h2>
          <div className="isetgrid">
            {g.sets.map((s) => <ItemSetCard key={s.name} set={s} />)}
          </div>
        </section>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        รายชื่อเซ็ตและชิ้นในเซ็ตมาจาก rozerodb กับ prontera ซึ่งตรงกันทุกเซ็ตที่ซ้อนกัน · สองเซ็ตหมวก Nordfeld มีแค่ prontera
        แต่คำอธิบายของ Gem Poring Card ในเกมเขียนโบนัสไว้เอง · เซ็ตหิน DEF กับ MDEF มาจากคำอธิบายหินในเกม ·
        โบนัสเขียนเป็นภาษาไทยจากข้อความภาษาอังกฤษ ถ้าในเกมไม่ตรงบอกได้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/cards">การ์ดทั้งหมด</Link> · <Link href="/guides/costume-enchant">หินเอนแชนต์คอสตูม</Link> ·{' '}
        <Link href="/guides/memorial-gear">ชุดดันเจี้ยน</Link>
      </p>
    </main>
  );
}

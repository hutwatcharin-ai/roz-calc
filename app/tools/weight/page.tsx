// /tools/weight — แบกได้เท่าไหร่ ของที่ถือหนักเท่าไหร่ เหลือที่เท่าไหร่ (owner, 12 Oct 2026).
//
// Planned with the owner as a potion-and-SP planner, then cut to what the
// owner asked for: the cap, the things picked, the load as a percentage, and
// how many more fit under the 70% (regen stops) and 90% (no attacks) lines.
// The maths is lib/weight-calc.ts; the item weights are the client's own
// (scripts/build-item-weights.mjs).

import './page.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import WeightCalculator, { type WeightItem } from '@/components/WeightCalculator';
import classFile from '@/data/class-stats.json';
import weightFile from '@/data/item-weights.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'คำนวณน้ำหนัก Ragnarok Zero — แบกยาได้กี่ขวด ก่อนเกิน 70%',
  description:
    'คำนวณน้ำหนักที่แบกได้ใน Ragnarok Zero Global จาก STR อาชีพ Enlarge Weight Limit และ Gym Membership Card แล้วเลือกยา ลูกธนู ปีก หรือไอเทมไหนก็ได้ ดูว่าหนักรวมกี่ % เหลือที่เท่าไหร่ และใส่เพิ่มได้อีกกี่ชิ้นก่อนเกิน 70% (หยุดฟื้น HP/SP) หรือ 90% (ตีไม่ได้)',
};

// The things players carry on every trip, in the order they reach for them.
const QUICK_IDS = [501, 502, 503, 504, 505, 506, 533, 578, 548, 645, 656, 610, 601, 602, 1750, 1751, 717];

const weights = new Map((weightFile as unknown as { items: [number, string, number][] }).items.map(([id, name, weight]) => [id, { id, name, weight }]));
const quick: WeightItem[] = QUICK_IDS.map((id) => weights.get(id)).filter((x): x is WeightItem => !!x);
const classes = Object.entries((classFile as unknown as { classes: Record<string, { name: string }> }).classes)
  .map(([slug, c]) => ({ slug, name: c.name }))
  .sort((a, b) => a.name.localeCompare(b.name));

export default function WeightToolPage() {
  return (
    <main className="shell">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/tools/build">เครื่องมือ</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">คำนวณน้ำหนัก</span>
      </nav>

      <PageHeader
        title="คำนวณน้ำหนัก — แบกได้เท่าไหร่ เหลือที่เท่าไหร่"
        lead="ใส่อาชีพกับ STR แล้วเลือกของที่จะถือ ดูน้ำหนักรวมเป็น % และใส่เพิ่มได้อีกกี่ชิ้นก่อนเกิน 70% (หยุดฟื้น HP/SP เอง) หรือ 90% (ตีและใช้สกิลไม่ได้)"
      />

      <WeightCalculator classes={classes} quick={quick} />

      <AdSlot slot="inline" />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>คิดยังไง</h2>
        <ul className="wcalc__how">
          <li>แบกได้ = 2,000 + STR ที่ลงเอง × 30 + โบนัสอาชีพ + Enlarge Weight Limit (เลเวลละ 200) + Gym Membership Card (ใบละ 200)</li>
          <li>เกิน 70% HP กับ SP หยุดฟื้นเอง · เกิน 90% ตีและใช้สกิลไม่ได้ (เจ้าของเว็บเช็กในเกม 12 ต.ค. 2026)</li>
          <li>น้ำหนักไอเทมอ่านจากข้อความในไคลเอนต์เกม เป็นเลขเดียวกับที่เกมแสดง เช่น Red Potion 7</li>
        </ul>
        <p className="muted" style={{ fontSize: 13 }}>
          อยากรู้ด้วยว่ายาขวดหนึ่งฟื้นเท่าไหร่ตาม VIT/INT ดูที่ <Link href="/tools/build">เครื่องจำลองบิลด์</Link> ช่องแบกยาได้อีก
        </p>
      </section>
    </main>
  );
}

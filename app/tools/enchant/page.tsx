// /tools/enchant — กี่ครั้ง กี่เงิน กว่าจะได้เอนแชนต์ที่อยากได้
//
// The rates have been on /guides/memorial-gear since 9 Sep 2026; this page is
// the calculator that was missing beside them. Everything numeric comes from
// data/memorial-gear.json (the official guide's tables), so the page states no
// rate of its own -- lib/enchant-odds.ts only does the arithmetic on top.
//
// The table is rendered on the server: a visitor from search sees the rates
// without waiting for the calculator's JavaScript.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import EnchantCalculator from '@/components/EnchantCalculator';
import { memorialGear } from '@/lib/memorial-gear';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'คำนวณเอนแชนต์ Ragnarok Zero — ลุ้นกี่ครั้ง เสียกี่เงิน',
  description:
    'เอนแชนต์ชุดดันเจี้ยนความทรงจำใน Ragnarok Zero Global — เลือกว่าจะใส่ที่เกราะ ผ้าคลุม หรือรองเท้า แล้วบอกโอกาสต่อครั้ง จำนวนครั้งเฉลี่ย ค่าเอนแชนต์รวม และโอกาสสะสมเมื่อลองหลายครั้ง อัตราจากคู่มือทางการ',
};

const { outcomes, costs } = memorialGear.enchantRules;

// The price of one enchant, taken from the cost table rather than typed again.
const ENCHANT_COST = costs.find((c) => c.destroyChance === '0%' && c.cost.includes('zeny'));
const ZENY_PER_TRY = Number((ENCHANT_COST?.cost ?? '100,000').replace(/[^\d]/g, '')) || 100_000;

function pct(value: number | null): string {
  return value == null ? '—' : `${value.toFixed(2)}%`;
}

export default function EnchantToolPage() {
  return (
    <main className="shell">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/tools/refine">เครื่องมือ</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">คำนวณเอนแชนต์</span>
      </nav>

      <PageHeader
        title="คำนวณเอนแชนต์ — ลุ้นกี่ครั้ง เสียกี่เงิน"
        lead="เลือกชิ้นกับสเตตัสที่อยากได้ แล้วดูว่าโดยเฉลี่ยต้องลองกี่ครั้ง ใช้เงินเท่าไร และถ้าลองตามจำนวนที่ตั้งไว้ โอกาสติดอย่างน้อยหนึ่งครั้งเป็นเท่าไร"
      />

      <EnchantCalculator outcomes={outcomes} zenyPerTry={ZENY_PER_TRY} />

      <AdSlot slot="inline" />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>อัตราที่ใช้คำนวณ</h2>
        <p className="muted" style={{ marginTop: 2, marginBottom: 10, maxWidth: '70ch', fontSize: 13 }}>
          หนึ่งครั้งได้หนึ่งอย่าง · &quot;—&quot; คือชิ้นนั้นไม่มีผลแบบนี้เลย ไม่ใช่ 0% · ทั้งสามคอลัมน์รวมกันได้ 100.00% พอดี
        </p>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ได้</th>
                <th className="num">เกราะ</th>
                <th className="num">ผ้าคลุม</th>
                <th className="num">รองเท้า</th>
              </tr>
            </thead>
            <tbody>
              {outcomes.map((o) => (
                <tr key={`${o.stat}-${o.value}`}>
                  <td data-label="ได้">{o.stat} {o.value}</td>
                  <td data-label="เกราะ" className="num">{pct(o.armor)}</td>
                  <td data-label="ผ้าคลุม" className="num">{pct(o.garment)}</td>
                  <td data-label="รองเท้า" className="num">{pct(o.shoes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 12, fontSize: 13 }}>
          ค่าใส่และค่าถอด รวมถึงสล็อตของแต่ละแรงค์ อยู่ที่หน้า{' '}
          <Link href="/guides/memorial-gear">ชุดดันเจี้ยนความทรงจำ</Link>
        </p>
        <p className="guildp__src">
          ที่มา: ตารางอัตราจากไกด์ทางการ roz-global.info (อ่าน 8 ก.ย. 2026) เก็บไว้ที่ data/memorial-gear.json ·
          ส่วนจำนวนครั้งและเงินเป็นการคำนวณจากอัตรานั้น
        </p>
      </section>
    </main>
  );
}

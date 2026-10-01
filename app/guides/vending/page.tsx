// app/guides/vending/page.tsx
//
// Setting up a shop without being a Merchant: the weekly part-time quest at
// the Merchant Guild in Alberta, the permits it gives, and where to set up
// (owner, 30 Sep 2026).
//
// Sources, strongest first:
//   - The quest steps, the 7-day limit and the delivery towns with their
//     coordinates: the game's own quest text, in rozerodb's quest export
//     (docs/rozerodb-export/data/quests.jsonl, quests 8323-8354).
//   - The permits (sell/buy, three grades, 1 or 3 days) and the search
//     scrolls: our items rows and the client's Thai item text.
//   - Masha's /navi, the Prontera Market layout and the 500k repeat fee:
//     midgardhub's new-player guide (read 30 Sep 2026).
//   - Three item slots on a permit shop, 12 on a Merchant's, cancel and
//     re-roll a far town, and the cash-shop permit: Global clips, in
//     docs/GAME_MODEL.md.
// Unknown and said so: what the three grades change, and which grade the
// quest gives (the quest text only says it depends on the job's difficulty).

import './page.css';
import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'ตั้งร้านขายของ Ragnarok Zero — เควสใบจ้างตั้งร้าน ไม่ต้องเป็นพ่อค้า',
  description:
    'วิธีตั้งร้านขายของและร้านรับซื้อใน Ragnarok Zero Global โดยไม่ต้องเป็น Merchant ทำเควสส่งกล่องที่กิลด์พ่อค้า Alberta ทุก 7 วัน ได้ใบจ้างพนักงานตั้งร้าน เมืองที่ต้องส่งกล่องพร้อม /navi และม้วนค้นหาร้าน',
};

// Where the box goes. The town is picked for you; coordinates from the quest.
const TOWNS = [
  { town: 'Prontera', where: 'ร้านตีเหล็ก', navi: 'prt_in 56/56' },
  { town: 'Payon', where: 'ร้านตีเหล็ก', navi: 'payon 140/173' },
  { town: 'Morroc', where: 'ข้างพนักงานคาฟ่าทางเหนือ', navi: 'morocc 162/257' },
  { town: 'Al De Baran', where: 'โรงเตี๊ยม', navi: 'aldeba_in 97/54' },
  { town: 'Comodo', where: 'ร้านอาวุธ', navi: 'cmd_in01 128/170' },
];

type Permit = { id: number; name: string };
const PERMITS: { title: string; note: string; rows: { grade: string; oneDay: Permit; threeDay: Permit }[] }[] = [
  {
    title: 'ใบจ้างร้านขายของ (Vending)',
    note: 'ตั้งร้านวางของขาย คนอื่นเดินมาซื้อ',
    rows: [
      { grade: 'พนักงานฝึกหัด', oneDay: { id: 23342, name: 'Vending 1 Day Parttime Lv.1' }, threeDay: { id: 23354, name: 'Vending 3 Days Parttime Lv.1' } },
      { grade: 'พนักงานทั่วไป', oneDay: { id: 23343, name: 'Vending 1 Day Parttime Lv.2' }, threeDay: { id: 23355, name: 'Vending 3 Days Parttime Lv.2' } },
      { grade: 'พนักงานมืออาชีพ', oneDay: { id: 23344, name: 'Vending 1 Day Parttime Lv.3' }, threeDay: { id: 23356, name: 'Vending 3 Days Parttime Lv.3' } },
    ],
  },
  {
    title: 'ใบจ้างร้านรับซื้อ (Buying Store)',
    note: 'ตั้งราคารับซื้อไว้ คนที่มีของเดินมาขายใส่ได้ทันที',
    rows: [
      { grade: 'พนักงานฝึกหัด', oneDay: { id: 23345, name: 'Buying Store 1 Day Parttime Lv.1' }, threeDay: { id: 23357, name: 'Buying Store 3 Days Parttime Lv.1' } },
      { grade: 'พนักงานทั่วไป', oneDay: { id: 23346, name: 'Buying Store 1 Day Parttime Lv.2' }, threeDay: { id: 23358, name: 'Buying Store 3 Days Parttime Lv.2' } },
      { grade: 'พนักงานมืออาชีพ', oneDay: { id: 23347, name: 'Buying Store 1 Day Parttime Lv.3' }, threeDay: { id: 23359, name: 'Buying Store 3 Days Parttime Lv.3' } },
    ],
  },
];

function PermitLink({ p }: { p: Permit }) {
  return (
    <Link className="recipe__item" href={`/database/items/${p.id}`}>
      <img src={`/images/items/${p.id}.gif`} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} loading="lazy" />
      <span>{p.name}</span>
    </Link>
  );
}

export default function VendingGuidePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ตั้งร้านขายของ', path: '/guides/vending' },
        ])}
      />
      <PageHeader title="ตั้งร้านขายของ ไม่ต้องเป็นพ่อค้า" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        อาชีพไหนก็ตั้งร้านได้ ถ้ามี<strong>ใบจ้างพนักงานตั้งร้าน</strong> ได้ฟรีจากเควสส่งกล่องที่กิลด์พ่อค้าใน Alberta
        ทำได้ทุก 7 วัน · ร้านขายต่อได้แม้ออกเกมไปแล้ว ตัวหลักเอาไปบอทต่อได้
      </p>

      <div className="mdrules">
        <p><strong>ร้านใบจ้าง</strong> ลงของได้ 3 รายการ</p>
        <p><strong>ร้าน Merchant</strong> (สกิล Vending) ลงได้ 12 รายการ</p>
        <p><strong>ตั้งได้ที่</strong> Prontera Market</p>
        <p><strong>ไอดีทดลอง</strong> ตั้งร้านไม่ได้</p>
      </div>

      <section className="card card--cyan" style={{ marginTop: 18 }}>
        <h2 className="section-title">เควสใบจ้าง ทีละขั้น</h2>
        <ol className="vendsteps">
          <li>
            <strong>ไปหา Masha</strong> สำนักงานจัดหางานของกิลด์พ่อค้าใน Alberta{' '}
            <code className="mono navicmd">/navi alberta_in 19/19</code>
            <span className="muted"> · รับงาน Stall Part-Time Job Management Center Request</span>
          </li>
          <li>
            <strong>รับกล่อง Slightly Worn Box</strong> แล้วเอาไปส่งให้ <strong>Sheep</strong> ในเมืองที่เกมสุ่มให้ (ดูตารางข้างล่าง) ·
            ถ้าได้เมืองไกล ยกเลิกเควสแล้วรับใหม่ได้
          </li>
          <li><strong>รับใบเสร็จจาก Sheep</strong> กลับไปส่งที่ Masha</li>
          <li><strong>ได้ใบจ้าง</strong> ระดับขึ้นกับความยากของงานที่ได้</li>
          <li>
            <strong>ไปตั้งร้าน</strong> ที่ Prontera Market (คุยกับคาฟ่าใน Prontera ให้พาไป แบ่งเป็น 4 โซน ตรงกลางมีคาฟ่า ช่างตีเหล็ก และร้านขายของ)
          </li>
        </ol>
        <p className="mdcard__warn" style={{ marginTop: 12 }}>
          <strong>ทำได้ 1 ครั้งต่อ 7 วันต่อตัวละคร</strong> · ถ้าอยากได้บ่อยกว่านี้ จ่าย 500,000z ต่อครั้ง ·
          ใบจ้างมีวันหมดอายุ หมดแล้วใช้ไม่ได้
        </p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">เมืองที่ต้องส่งกล่อง</h2>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>เมือง</th>
                <th>Sheep อยู่ตรงไหน</th>
                <th>/navi</th>
              </tr>
            </thead>
            <tbody>
              {TOWNS.map((t) => (
                <tr key={t.town}>
                  <td data-label="เมือง"><strong>{t.town}</strong></td>
                  <td data-label="อยู่ตรงไหน">{t.where}</td>
                  <td data-label="/navi"><code className="mono navicmd">/navi {t.navi}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>ห้าเมืองที่เจอในข้อมูลเควส อาจมีเมืองอื่นอีก</p>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2 className="section-title">ใบจ้างมีอะไรบ้าง</h2>
        <p className="muted" style={{ marginTop: 4, maxWidth: '70ch' }}>
          ได้มาเป็นซอง เปิดแล้วเป็นใบสัญญาจ้าง มี 2 แบบ 3 ระดับ และแบบ 1 วันกับ 3 วัน · ยังไม่รู้ว่าแต่ละระดับต่างกันยังไง
        </p>
        {PERMITS.map((group) => (
          <div key={group.title} style={{ marginTop: 14 }}>
            <h3 className="mdcard__h" style={{ fontSize: 15 }}>{group.title}</h3>
            <p className="muted" style={{ margin: '0 0 6px', fontSize: 14 }}>{group.note}</p>
            <div className="recipe__scroll">
              <table className="data-table recipe">
                <thead>
                  <tr>
                    <th>ระดับ</th>
                    <th>1 วัน</th>
                    <th>3 วัน</th>
                  </tr>
                </thead>
                <tbody>
                  {group.rows.map((r) => (
                    <tr key={r.grade}>
                      <td data-label="ระดับ"><strong>{r.grade}</strong></td>
                      <td data-label="1 วัน"><PermitLink p={r.oneDay} /></td>
                      <td data-label="3 วัน"><PermitLink p={r.threeDay} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        <p className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          ใบจ้างซื้อจาก Cash Shop ได้ด้วย (แบบ 1 วัน) ตามที่เห็นในคลิปผู้เล่น
        </p>
      </section>

      <section className="card" style={{ marginTop: 24 }}>
        <h2 className="section-title">หาของในร้านคนอื่น</h2>
        <ul style={{ margin: 0, paddingInlineStart: 22 }}>
          <li style={{ marginBottom: 6 }}>
            <Link href="/database/items/23626">Vending Search Scroll</Link> ค้นว่าของที่อยากได้มีร้านไหนวางขายหรือรับซื้ออยู่ และบอกตำแหน่งร้าน
          </li>
          <li style={{ marginBottom: 6 }}>
            <Link href="/database/items/23627">Deluxe Vending Search Scroll</Link> ค้นแล้วกดซื้อหรือขายจากรายการได้เลย ไม่ต้องเดินไปที่ร้าน
          </li>
          <li>ทั้งสองแบบค้นได้เฉพาะร้านในแมพเดียวกับที่ยืนอยู่ · ค้นตามออปชันไม่ได้ ของที่ต้องดูออปชันคนมักซื้อขายกันในกลุ่ม Facebook</li>
        </ul>
      </section>

      <Caveat label="เชื่อได้แค่ไหน">
        ขั้นตอนเควส ข้อจำกัด 7 วัน และเมืองที่ส่งกล่องพร้อมพิกัด มาจากข้อความเควสในเกม · ใบจ้างและม้วนค้นหามาจากคำอธิบายไอเทมในเกม ·
        พิกัด Masha, Prontera Market และค่า 500,000z มาจากไกด์ผู้เล่นใหม่ของ midgardhub (อ่าน 30 ก.ย. 2026) ·
        จำนวนรายการที่ลงได้ ยกเลิกเควสแล้วรับใหม่ และใบจ้างจาก Cash Shop มาจากคลิปผู้เล่นเซิร์ฟ Global ·
        ยังไม่รู้ว่าใบแต่ละระดับต่างกันยังไง ถ้ารู้บอกได้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/faq">คำถามที่ถามบ่อย</Link> · <Link href="/tools/leveling-spots?mode=zeny">ฟาร์มซีนี่</Link>
      </p>
    </main>
  );
}

// ไทม์ไลน์อัปเดต RO Zero Global — what has landed, and what is only planned.
//
// Written 24 Sep 2026. The site had patch summaries for single days and no
// page that answers "อัปเดตอะไรมาแล้วบ้าง / เดือนหน้ามีอะไร", which is the
// shape of the question people search. The competitor has such a page; we did
// not.
//
// The page keeps the two halves apart on purpose:
//   - What landed: our own patch pages, each linked. We wrote them from the
//     official maintenance notices, so they are the strong half.
//   - What is planned: Gravity's year-one roadmap as UnGeek reported it on
//     14 Aug 2026 (data/roadmap.json carries the source URL and the date it
//     was read). It names months, never dates. The source does not say whether
//     the plan may change, so the page does not claim it is fixed either.
//
// Do not move an item from the plan list into the landed list on the strength
// of the roadmap alone. It moves when one of our own patch pages shows it.

import type { Metadata } from 'next';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import roadmap from '@/data/roadmap.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ไทม์ไลน์อัปเดต Ragnarok Zero Global — มาแล้วอะไร กำลังจะมาอะไร',
  description:
    'RO Zero Global อัปเดตอะไรมาแล้วบ้างและตามแผนเดือนไหนมีอะไร — อาชีพขั้น 2 และ WoE เข้าแล้วเดือนกันยายน 2569 · แผนปีแรกถึงกรกฎาคม 2570 มี Clock Tower, Glast Heim, Lutie, Niflheim, ระบบแต่งงาน, Ayothaya และอาชีพ Ninja',
};

type Plan = { month: string; label: string; items: string[] };
const PLAN = roadmap.plan as Plan[];

// Our own patch pages: the half of this page that is not somebody's plan.
const LANDED = [
  {
    href: '/news/patch-2026-09-17',
    when: '17 ก.ย. 2569',
    title: 'MVP ใหม่ 4 ตัว, Pyramid, Geffen Dungeon, WoE',
    body: 'Orc Lord, Dracula, Doppelganger, Osiris ลงเป็น MVP Raid · เปิด Pyramid และ Geffen Dungeon พร้อมเควสรายวัน · ปรับระบบสงครามกิลด์ · เซิร์ฟ Odin สร้างตัวได้ · ช่องตัวละครฟรี 5 เป็น 6',
  },
  {
    href: '/news/patch-2026-09-03',
    when: '3 ก.ย. 2569',
    title: 'เพดานเลเวล 60, อาชีพขั้น 2, Episode 1-2',
    body: 'ขยาย cap เป็น 60/60 · เปิดอาชีพขั้น 2 · Episode 1-2 · Orc Underground Caverns, Comodo Luanda และดันเจี้ยนความทรงจำอีก 2 แห่ง',
  },
  {
    href: '/news/battle-pass-summer-2026',
    when: 'อีเวนต์ฤดูร้อน 2569',
    title: 'Battle Pass ฤดูร้อน',
    body: 'สาย Free 50 Tier และสาย Paid 70 Tier · คอสตูมฤดูร้อน 7 ชิ้นที่แลกด้วย Battle Coin',
  },
];

// The months the roadmap lists that our own patch pages already show live.
const DONE_MONTHS = new Set(['2026-08', '2026-09']);

export default function RoadmapPage() {
  return (
    <main className="shell guildp">
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ไทม์ไลน์อัปเดต</span>
      </nav>

      <PageHeader
        title="ไทม์ไลน์อัปเดต RO Zero Global"
        lead="อัปเดตที่ลงเซิร์ฟแล้ว แยกจากแผนที่ประกาศไว้ว่าจะมา — แผนบอกแค่เดือน ไม่ใช่วัน และเลื่อนได้"
      />

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ลงเซิร์ฟแล้ว</h2>
        <div className="guildp__rows">
          {LANDED.map((row) => (
            <article key={row.href} className="woe__landed">
              <p className="woe__when">{row.when}</p>
              <h3 style={{ margin: '2px 0 4px', fontSize: 15 }}>
                <Link href={row.href}>{row.title}</Link>
              </h3>
              <p className="muted" style={{ margin: 0, fontSize: 13, lineHeight: 1.7 }}>{row.body}</p>
            </article>
          ))}
        </div>
        <p className="guildp__src">ที่มา: สรุปประกาศปิดปรับปรุงของทางการ เขียนไว้เป็นหน้าละแพตช์ในเว็บนี้</p>
      </section>

      <AdSlot slot="inline" />

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>แผนปีแรก — อ่านเป็นแผน ไม่ใช่กำหนดการ</h2>
        <ul style={{ margin: '8px 0 0', paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>แผนนี้ระบุ<strong>เดือน</strong> ไม่เคยระบุวัน</li>
          <li>เป็นแผนฝั่ง Global <strong>ฝั่งไทยอาจไม่ตรงกัน</strong> และแหล่งที่รายงานไม่ได้บอกว่าแผนเปลี่ยนได้หรือไม่</li>
          <li>หน้านี้จะย้ายรายการขึ้นไปอยู่ช่อง &quot;ลงเซิร์ฟแล้ว&quot; ต่อเมื่อมีหน้าแพตช์ของเราเองยืนยัน ไม่ใช่เพราะถึงเดือนแล้ว</li>
        </ul>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>ตามแผน เดือนไหนมีอะไร</h2>
        <ol className="roadmap">
          {PLAN.map((row) => (
            <li key={row.month} className={DONE_MONTHS.has(row.month) ? 'roadmap__row roadmap__row--done' : 'roadmap__row'}>
              <span className="roadmap__month">{row.label}</span>
              <span className="roadmap__items">
                {row.items.join(' · ')}
                {DONE_MONTHS.has(row.month) && <strong className="roadmap__done"> — ลงแล้ว</strong>}
              </span>
            </li>
          ))}
        </ol>
        <p className="guildp__src">
          ที่มา: รายงานโรดแมปปีแรกของ Gravity โดย{' '}
          <a
            href="https://www.ungeek.ph/2026/08/gravity-reveals-ragnarok-zero-global-year-one-roadmap-ahead-of-its-official-launch/"
            target="_blank"
            rel="noopener noreferrer"
          >
            UnGeek
          </a>{' '}
          (14 ส.ค. 2026) · อ่านเมื่อ {roadmap._meta.read} · ชื่อเดือนและรายการตามที่แหล่งพิมพ์ไว้ ไม่ได้ย้ายหรือรวมรายการเอง
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>หน้าที่เกี่ยวข้อง</h2>
        <ul style={{ margin: '8px 0 0', paddingInlineStart: 20, lineHeight: 2 }}>
          <li><Link href="/guides/woe">สงครามกิลด์ (WoE)</Link> — ลงเซิร์ฟแล้วเดือนกันยายน</li>
          <li><Link href="/guides/job-change">เปลี่ยนอาชีพขั้น 2</Link> — เปิดพร้อมแพตช์ 3 ก.ย.</li>
          <li><Link href="/tools/leveling-spots">จุดเก็บเลเวล</Link> และ <Link href="/drop-finder">ค้นของดรอป</Link> — อัปเดตตามแมพที่เปิดใหม่ทุกแพตช์</li>
        </ul>
      </section>
    </main>
  );
}

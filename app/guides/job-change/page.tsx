// app/guides/job-change/page.tsx
//
// Where the second-job NPCs stand, with the /navi command to paste.
//
// The whole content of this page is thirteen coordinates, and no table on this
// site holds one: map_stats is built from monster spawns, so every one of
// these indoor maps is absent from it. That is stated on the page rather than
// papered over -- it means these thirteen lines rest on a single source.
//
// Redesigned 8 Oct 2026 (owner: every guide in the newer arcade look, and
// fill in what is missing): one card per 2nd job under its 1st job, with the
// sprite, a tap-to-copy /navi, and the way on to that job's class guide.

import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import NaviCopy from '@/components/NaviCopy';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { naviCommand, rozglobalGuides } from '@/lib/rozglobal-guides';
import { CLASS_GUIDES } from '@/lib/class-guides';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'เปลี่ยนอาชีพ 2 Ragnarok Zero — NPC อยู่ตรงไหน พร้อมพิกัด /navi',
  description:
    'NPC เปลี่ยนอาชีพ 2 ทั้ง 13 อาชีพใน Ragnarok Zero Global อยู่แมพไหน พิกัดเท่าไร กดก๊อป /navi ไปวางในแชตแล้วเดินตามเส้นนำทาง พร้อมเงื่อนไขเลเวลที่ต้องถึงก่อน',
};

const FAMILIES: { first: string; seconds: string[] }[] = [
  { first: 'Swordman', seconds: ['Knight', 'Crusader'] },
  { first: 'Mage', seconds: ['Wizard', 'Sage'] },
  { first: 'Archer', seconds: ['Hunter', 'Bard', 'Dancer'] },
  { first: 'Acolyte', seconds: ['Priest', 'Monk'] },
  { first: 'Thief', seconds: ['Assassin', 'Rogue'] },
  { first: 'Merchant', seconds: ['Blacksmith', 'Alchemist'] },
];
const sprite = (job: string) => `/images/jobs/${job === 'Swordman' ? 'swordsman' : job.toLowerCase()}.png`;

export default function JobChangePage() {
  const { jobChange } = rozglobalGuides;
  // Every entry says the same thing, so it belongs above the cards once.
  const requirement = jobChange[0]?.requirement ?? null;
  const sameForAll = jobChange.every((j) => j.requirement === requirement);
  const guideOf = (job: string) => CLASS_GUIDES.find((g) => g.job.toLowerCase() === job.toLowerCase()) ?? null;

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'เปลี่ยนอาชีพ 2', path: '/guides/job-change' },
        ])}
      />
      <PageHeader
        title="เปลี่ยนอาชีพ 2 — NPC อยู่ตรงไหน"
        lead={<>กดคำสั่ง <code className="mono">/navi</code> ในการ์ดเพื่อก๊อป ไปวางในช่องแชต เกมจะขึ้นเส้นนำทางให้เดินตาม</>}
      />

      {sameForAll && requirement && (
        <div className="gtiles">
          <div className="gtile">
            <span className="gtile__k">ต้องเป็น</span>
            <span className="gtile__v">อาชีพ 1</span>
            <span className="gtile__s">ทุกอาชีพ 2 ใช้เงื่อนไขเดียวกัน</span>
          </div>
          <div className="gtile">
            <span className="gtile__k">เลเวลฐาน</span>
            <span className="gtile__v">50</span>
            <span className="gtile__s">ดู EXP ที่ต้องเก็บได้ที่ <Link href="/guides/exp">ตาราง EXP</Link></span>
          </div>
          <div className="gtile">
            <span className="gtile__k">เลเวลจ๊อบ</span>
            <span className="gtile__v">50</span>
            <span className="gtile__s">แต้มสกิลอาชีพ 1 ลงได้ครบก่อนเปลี่ยน</span>
          </div>
        </div>
      )}

      {FAMILIES.map((f) => (
        <section key={f.first} className="card jchg" style={{ marginTop: 14 }}>
          <h2 className="jchg__first">
            <img src={sprite(f.first)} alt="" width={40} height={40} />
            <span>
              <small>จากอาชีพ 1</small>
              {f.first}
            </span>
          </h2>
          <div className="jchg__grid">
            {f.seconds.map((job) => {
              const npc = jobChange.find((j) => j.job === job);
              const navi = npc ? naviCommand(npc.map, npc.x, npc.y) : null;
              const guide = guideOf(job);
              return (
                <article key={job} className="jchg__card">
                  <img className="jchg__sprite" src={sprite(job)} alt="" width={64} height={64} />
                  <div className="jchg__body">
                    <h3>{job}</h3>
                    <p className="jchg__place">{npc?.place ?? <span className="muted">ยังไม่รู้ว่า NPC อยู่ไหน</span>}</p>
                    {navi ? <NaviCopy cmd={navi} /> : <span className="muted">ไม่ทราบพิกัด</span>}
                    <p className="jchg__links">
                      {guide && <Link href={`/guides/classes/${guide.slug}`}>ไกด์ {job}</Link>}
                      <Link href="/tools/skill-planner">ลองอัปสกิล</Link>
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        พิกัดทั้ง {jobChange.length} จุดมาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) ·
        <strong>เป็นแหล่งเดียว ไม่มีที่สองให้ตรวจ</strong> ตาราง map_stats ของเว็บนี้สร้างจากจุดเกิดมอน
        แมพในอาคารที่ NPC ยืนอยู่จึงไม่มีในฐานข้อมูลเราเลยสักแมพ ·
        ขั้นตอนเควสต์ของแต่ละอาชีพยังไม่ได้รวบรวม ·
        ถ้าเดินไปแล้วไม่เจอ NPC ตรงจุด บอกได้ จะได้แก้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/classes">ไกด์อาชีพ</Link> · <Link href="/tools/skill-planner">จำลองอัพสกิล</Link> ·{' '}
        <Link href="/database/skills">ฐานข้อมูลสกิล</Link> · <Link href="/guides/exp">EXP ต่อเลเวล</Link>
      </p>
    </main>
  );
}

// app/guides/job-change/page.tsx
//
// Where the second-job NPCs stand, with the /navi command to paste.
//
// The whole content of this page is thirteen coordinates, and no table on this
// site holds one: map_stats is built from monster spawns, so every one of
// these indoor maps is absent from it. That is stated on the page rather than
// papered over -- it means these thirteen lines rest on a single source.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { naviCommand, rozglobalGuides } from '@/lib/rozglobal-guides';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'เปลี่ยนอาชีพ 2 Ragnarok Zero — NPC อยู่ตรงไหน พร้อมพิกัด /navi',
  description:
    'NPC เปลี่ยนอาชีพ 2 ทั้ง 13 อาชีพใน Ragnarok Zero Global อยู่แมพไหน พิกัดเท่าไร ก๊อป /navi ไปวางในแชตแล้วเดินตามเส้นนำทาง พร้อมเงื่อนไขเลเวลที่ต้องถึงก่อน',
};

export default function JobChangePage() {
  const { jobChange } = rozglobalGuides;
  // Every entry says the same thing, so it belongs above the table once
  // rather than repeated down a column thirteen times.
  const requirement = jobChange[0]?.requirement ?? null;
  const sameForAll = jobChange.every((j) => j.requirement === requirement);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'เปลี่ยนอาชีพ 2', path: '/guides/job-change' },
        ])}
      />
      <PageHeader title="เปลี่ยนอาชีพ 2 — NPC อยู่ตรงไหน" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 14, maxWidth: '70ch' }}>
        {sameForAll && requirement
          ? 'ทุกอาชีพใช้เงื่อนไขเดียวกัน: เป็นอาชีพ 1 และถึงเลเวลฐาน 50 กับเลเวลจ๊อบ 50 · '
          : ''}
        ก๊อปคำสั่ง <code className="mono">/navi</code> ไปวางในช่องแชต เกมจะขึ้นเส้นนำทางให้เดินตาม
      </p>

      <div className="card">
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>อาชีพ</th>
                <th>อยู่ที่</th>
                <th>พิมพ์ในแชต</th>
              </tr>
            </thead>
            <tbody>
              {jobChange.map((npc) => {
                const navi = naviCommand(npc.map, npc.x, npc.y);
                return (
                  <tr key={npc.job}>
                    <td data-label="อาชีพ"><strong>{npc.job}</strong></td>
                    <td data-label="อยู่ที่">{npc.place}</td>
                    <td data-label="พิมพ์ในแชต">
                      {navi ? <code className="mono navicmd">{navi}</code> : <span className="muted">ไม่ทราบพิกัด</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Caveat label="เชื่อได้แค่ไหน">
        พิกัดทั้ง {jobChange.length} จุดมาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) ·
        <strong>เป็นแหล่งเดียว ไม่มีที่สองให้ตรวจ</strong> — ตาราง map_stats ของเว็บนี้สร้างจากจุดเกิดมอน
        แมพในอาคารที่ NPC ยืนอยู่จึงไม่มีในฐานข้อมูลเราเลยสักแมพ ·
        ถ้าเดินไปแล้วไม่เจอ NPC ตรงจุด บอกได้ จะได้แก้
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/tools/skill-planner">ลองอัปสกิล</Link> ·{' '}
        <Link href="/database/skills">ฐานข้อมูลสกิล</Link> ·{' '}
        <Link href="/guides/exp">EXP ต่อเลเวล</Link>
      </p>
    </main>
  );
}

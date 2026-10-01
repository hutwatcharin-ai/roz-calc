// app/news/patch-2026-10-01/page.tsx
//
// The 1 Oct 2026 patch, read against our own tables, same shape as the
// 17 Sep page. The publisher's notice (30 Sep 2026, owner's screenshot --
// the GNJOY site is off limits to us) names three new dungeons, the level 70
// cap, a level 60-70 daily quest, two event quests, the Kumamon collab start,
// new Kafra Shop goods and the end of the Baby Shark collab. Only the notice
// decides what is listed; the monster tables under each dungeon are ours.
//
// Not shown on purpose: the MVPs whose raid maps sit in these areas. The
// notice does not name any MVP, and MVP Raid rotates by daily quest, so
// saying "Baphomet is out" would be our guess, not the notice.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import MonsterLink from '@/components/MonsterLink';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 3600;

const PATH = '/news/patch-2026-10-01';
const PUBLISHED = '2026-10-01T15:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 1 ต.ค. 2569 Ragnarok Zero — เลเวล 70, Labyrinth Forest, Sphinx, Mjolnir',
  description:
    'สรุปแพตช์ 1 ต.ค. 2569 ของ Ragnarok Zero Global เป็นภาษาไทย — เพดาน Base/Job Level 70, ดันใหม่ Labyrinth Forest, Sphinx, Mjolnir Abandoned Mine พร้อมมอนทุกชั้น, เควสรายวันเลเวล 60–70, อีเวนต์ Amon Ra และ Baphomet Cult, Kumamon',
};

const LABYRINTH = ['prt_maze01', 'prt_maze02', 'prt_maze03'];
const SPHINX = ['in_sphinx1', 'in_sphinx2', 'in_sphinx3', 'in_sphinx4', 'in_sphinx5'];
const MJOLNIR = ['mjo_dun01', 'mjo_dun02', 'mjo_dun03'];

interface Spawn {
  map_code: string;
  map_display_name: string | null;
  amount: number | null;
  monsters: { id: number; name_en: string; level: number; is_mvp: boolean; is_aggressive: boolean } | null;
}

/** The Zero client repeats each map as _a/_b/_z copies and C1-C5 variants; the page keeps the plain ones. */
function plainMonsters(rows: Spawn[]) {
  const seen = new Map<number, { id: number; name: string; level: number; amount: number; aggressive: boolean }>();
  for (const row of rows) {
    const m = row.monsters;
    if (!m || /^C\d /.test(m.name_en) || !row.amount) continue;
    const prev = seen.get(m.id);
    seen.set(m.id, {
      id: m.id,
      name: m.name_en,
      level: m.level,
      amount: (prev?.amount ?? 0) + row.amount,
      aggressive: m.is_aggressive,
    });
  }
  return [...seen.values()].filter((m) => m.level > 1).sort((a, b) => a.level - b.level);
}

function DungeonTable({ title, codes, spawns }: { title: string; codes: string[]; spawns: Spawn[] }) {
  return (
    <div className="recipe__scroll">
      <table className="data-table recipe">
        <thead>
          <tr>
            <th>{title}</th>
            <th>มอนในชั้น (เลเวล · จำนวน)</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => {
            const rows = spawns.filter((s) => s.map_code === code);
            const name = rows[0]?.map_display_name ?? code;
            const monsters = plainMonsters(rows);
            return (
              <tr key={code}>
                <td data-label="ชั้น">
                  <Link href={`/database/maps/${code}`}>{name}</Link>
                  <div className="muted mono" style={{ fontSize: 11.5 }}>{code}</div>
                </td>
                <td data-label="มอน">
                  {monsters.length === 0 ? (
                    <span className="muted">ไม่มีข้อมูล</span>
                  ) : (
                    monsters.map((m, i) => (
                      <span key={m.id}>
                        {i > 0 && ' · '}
                        <MonsterLink id={m.id} name={m.name} />{' '}
                        <span className="muted" style={{ fontSize: 12.5 }}>
                          Lv{m.level} ×{m.amount}
                          {m.aggressive ? ' · ตีก่อน' : ''}
                        </span>
                      </span>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function Patch20261001Page() {
  const db = supabaseBrowser();
  const { data, error } = await db
    .from('monster_spawns')
    .select('map_code, map_display_name, amount, monsters(id, name_en, level, is_mvp, is_aggressive)')
    .in('map_code', [...LABYRINTH, ...SPHINX, ...MJOLNIR]);
  const spawnRows = (data ?? []) as unknown as Spawn[];

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 960 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าวแพทช์', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          path: PATH,
          headline: String(metadata.title),
          description: String(metadata.description),
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
        })}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ข่าวแพทช์</span>
      </nav>

      <PageHeader title="แพทช์ 1 ต.ค. 2569 — มีอะไรใหม่" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 14, maxWidth: '72ch' }}>
        ปิดปรับปรุง 08:00–14:00 น. (เวลาไทย) · สรุปจากประกาศทางการ แล้วเติมมอนในแต่ละชั้นจากฐานข้อมูลของเว็บนี้ ·
        ค่าพลังมาจากไฟล์เกม ถ้าแพตช์นี้ปรับอะไร ตัวเลขอาจยังไม่ตรง
      </p>

      <div className="card card--cyan">
        <h2 className="section-title" style={{ marginTop: 0 }}>สรุปสั้น</h2>
        <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><strong>Base Level และ Job Level สูงสุดเป็น 70</strong> · <Link href="/guides/memorial-gear">ชุดดัน Expedition (Lv 70)</Link> ใส่ได้แล้ว</li>
          <li><a href="#dungeons"><strong>ดันเจี้ยนใหม่ 3 ที่</strong></a> Labyrinth Forest, Sphinx และ Mjolnir Abandoned Mine</li>
          <li><strong>เควสรายวันใหม่</strong> สำหรับเลเวล 60–70</li>
          <li><strong>เควสอีเวนต์ใหม่</strong> เฉพาะ Global: The Legend of Amon Ra และ The Baphomet Cult</li>
          <li><strong>เริ่มกิจกรรม Collaboration Kumamon</strong> · <strong>จบกิจกรรม Baby Shark</strong></li>
          <li>ร้าน Kafra Shop มีของใหม่: Gacha Scroll, คอสตูม และแพ็กเกจผูกบัญชี</li>
        </ul>
        <p className="muted" style={{ margin: '10px 0 0', fontSize: 13 }}>
          แผนเดิมบอกว่าเดือนนี้จะเปิด Clock Tower ด้วย แต่ประกาศนี้ไม่มี เว็บนี้จึงยังถือว่า Clock Tower ยังไม่เปิด
        </p>
      </div>

      {error && (
        <p className="filterstate" role="alert" style={{ marginTop: 14 }}>
          โหลดข้อมูลจากฐานข้อมูลไม่ครบ บางตารางด้านล่างอาจว่าง
        </p>
      )}

      <section id="dungeons" style={{ marginTop: 26 }}>
        <h2 className="section-title">Labyrinth Forest 3 ชั้น</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>ป่าวงกตทางเหนือของ Prontera</p>
        <DungeonTable title="ชั้น" codes={LABYRINTH} spawns={spawnRows} />

        <h2 className="section-title" style={{ marginTop: 22 }}>Sphinx 5 ชั้น</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>ชั้นลึกมี Anubis กับ Pasana เป็นตัวหลัก</p>
        <DungeonTable title="ชั้น" codes={SPHINX} spawns={spawnRows} />

        <h2 className="section-title" style={{ marginTop: 22 }}>Mjolnir Abandoned Mine 3 ชั้น</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>ในเกมชื่อแมพ Mjolnir Dead Pit</p>
        <DungeonTable title="ชั้น" codes={MJOLNIR} spawns={spawnRows} />
        <p className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>
          เควสรายวันเลเวล 60–70 และเควสอีเวนต์ที่ประกาศบอก ยังไม่มีในฐานข้อมูลของเรา ·
          ดูว่าตีไหวไหมที่<Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
        </p>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศ &ldquo;แจ้งเตือนการปิดปรับปรุงตามกำหนดการ – 1 ตุลาคม 2026&rdquo; (GNJOY, 30 ก.ย. 2569) ·
        มอนและจุดเกิดจากฐานข้อมูลของเว็บนี้
      </p>
    </main>
  );
}

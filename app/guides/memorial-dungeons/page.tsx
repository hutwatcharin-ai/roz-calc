// app/guides/memorial-dungeons/page.tsx
//
// The six memorial dungeons: what level lets you in, and what is waiting.
//
// These are where the Rank IV gear on /guides/memorial-gear comes from, so
// the two pages are two halves of one answer.
//
// Nothing on this page links to a monster, and that is the finding rather
// than an omission: the monsters inside these instances are almost all
// instance-only variants -- Cannibal Deniro, Deepsea Merman, Stormy Wraith --
// and our monsters table holds none of them. Even Orc Skeleton, the one name
// that matches, is a different creature in here: level 60 with 4,458 HP
// against the level 53 and 3,376 HP of the one that walks around outside.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import file from '@/data/memorial-dungeons.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ดันเจี้ยนความทรงจำ Ragnarok Zero — เข้าได้ตอนเลเวลไหน เจออะไรบ้าง',
  description:
    'ดันเจี้ยนความทรงจำทั้ง 6 แห่งใน Ragnarok Zero Global — เลเวลที่เข้าได้ ต้องไปเป็นกลุ่มไหม รีเซ็ตเมื่อไร และมอนในนั้นแต่ละตัวเลเวลเท่าไร เลือดเท่าไร',
};

interface Dungeon {
  name: string;
  th: string;
  level: number | null;
  levelMax: number | null;
  map: string | null;
  x: number | null;
  y: number | null;
  party: boolean;
  dailyReset: boolean;
  monsters: { name: string; level: number; hp: number }[];
}

const { dungeons } = file as unknown as { dungeons: Dungeon[] };

function levelText(d: Dungeon): string {
  if (d.level === null) return 'ไม่ระบุ';
  return d.levelMax ? `${d.level}–${d.levelMax}` : `${d.level}+`;
}

export default function MemorialDungeonsPage() {
  // Easiest first: it is the order a player meets them in.
  const ordered = [...dungeons].sort((a, b) => (a.level ?? 999) - (b.level ?? 999));

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ดันเจี้ยนความทรงจำ', path: '/guides/memorial-dungeons' },
        ])}
      />
      <PageHeader title="ดันเจี้ยนความทรงจำ — เข้าตอนไหน เจออะไร" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        ดันเจี้ยนแบบอินสแตนซ์ {dungeons.length} แห่ง · <strong>ทุกแห่งเข้าเป็นกลุ่ม และเข้าได้วันละครั้ง รีเซ็ตตี 4</strong> ·
        ของที่ได้จากหีบในนี้คือ<Link href="/guides/memorial-gear">ชุดแรงค์ IV</Link>ที่เอาไปอัปต่อได้
      </p>

      <div className="card card--cyan">
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ดันเจี้ยน</th>
                <th className="num">เลเวลที่เข้าได้</th>
                <th className="num">มอนในนั้น</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((d) => (
                <tr key={d.name}>
                  <td data-label="ดันเจี้ยน">
                    <strong>{d.name}</strong> <span className="muted">{d.th}</span>
                  </td>
                  <td data-label="เลเวล" className="num">{levelText(d)}</td>
                  <td data-label="มอน" className="num">{d.monsters.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ordered.map((d) => (
        <section key={d.name} style={{ marginTop: 26 }}>
          <h2 className="section-title">
            {d.name} <span className="muted" style={{ fontWeight: 400 }}>· {d.th} · เลเวล {levelText(d)}</span>
          </h2>
          {d.map && d.x !== null && d.y !== null && (
            <p className="muted" style={{ marginTop: 2, marginBottom: 8, fontSize: 13 }}>
              คุยกับ NPC ที่ <code className="mono navicmd">/navi {d.map} {d.x}/{d.y}</code>
            </p>
          )}
          <div className="recipe__scroll">
            <table className="data-table recipe">
              <thead>
                <tr>
                  <th>มอน</th>
                  <th className="num">เลเวล</th>
                  <th className="num">HP</th>
                </tr>
              </thead>
              <tbody>
                {d.monsters.map((m) => (
                  <tr key={m.name}>
                    <td data-label="มอน">{m.name}</td>
                    <td data-label="เลเวล" className="num">{m.level}</td>
                    <td data-label="HP" className="num">{m.hp.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        ทั้งหน้ามาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) และ<strong>ตรวจกับข้อมูลเราไม่ได้เลย</strong> —
        มอนในดันเจี้ยนพวกนี้เป็นตัวเฉพาะอินสแตนซ์ (Cannibal Deniro, Deepsea Merman, Stormy Wraith ฯลฯ) ซึ่งไม่มีในตารางมอนของเราสักตัว ·
        ชื่อเดียวที่ตรงกันคือ Orc Skeleton แต่ในอินสแตนซ์เป็น <strong>lv60 HP 4,458</strong> ส่วนตัวข้างนอกที่เรามีคือ lv53 HP 3,376 —
        คนละตัวกัน · เป็นช่องว่างของฐานข้อมูลเรา ไม่ใช่ข้อผิดของไกด์ ชื่อมอนในหน้านี้จึงไม่มีลิงก์
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/memorial-gear">ชุดที่ได้จากดันเจี้ยนนี้</Link> ·{' '}
        <Link href="/database/maps">ฐานข้อมูลแมพ</Link>
      </p>
    </main>
  );
}

import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

// Thai summary of the official 3 Sep 2026 maintenance notice (gnjoy, posted
// 2 Sep). Every line below is a translation of that notice -- nothing about
// new monsters, drops, or items is stated here because none of it exists in
// any dataset until the patch is live. The post-patch import updates the
// "หลังแพทช์" section (docs/PATCH-2026-09-03.md).
const PATH = '/news/patch-2026-09-03';
const PUBLISHED = '2026-09-02T12:00:00+07:00';
const MODIFIED = '2026-09-03T16:30:00+07:00';
// When we last checked the source database for post-patch content. Written by
// hand on each check rather than rendered from the clock: a live timestamp
// would keep claiming the check happened whenever the page is rebuilt.
const STATUS_CHECKED = '3 ก.ย. 16:15 น.';

export const metadata = {
  title: 'แพทช์ 3 ก.ย. 2569 Ragnarok Zero — เลเวล 60, อาชีพ 2, ดันเจี้ยนใหม่',
  description:
    'สรุปประกาศปิดปรับปรุง Ragnarok Zero Global 3 กันยายน 2569 เป็นภาษาไทย: เวลาปิดเซิร์ฟ (เวลาไทย), ขยาย cap เป็น 60/60, เพิ่มอาชีพ 2, Episode 1-2, Orc Underground Caverns, Comodo Luanda, Memorial Dungeon 2 แห่ง, Raid Party Equipment',
};

export const revalidate = 3600;

const CHANGES: { th: string; en: string; link?: { href: string; label: string } }[] = [
  { th: 'ขยายเลเวลสูงสุดเป็น Base 60 / Job 60', en: 'Max level cap expanded to Base 60 and Job 60', link: { href: '/tools/farm-guide', label: 'จุดฟาร์มช่วง 46–60' } },
  { th: 'เพิ่มเควสรายวันสำหรับเลเวล 50–60', en: 'Added daily quests for Level 50–60' },
  { th: 'เควสใหม่: The Curse of the Gaebolg Family – Part 1', en: 'Added New Quest: The Curse of the Gaebolg Family – Part 1' },
  { th: 'เพิ่มอาชีพ 2 (2nd Job Class)', en: 'Added 2nd Job Class', link: { href: '/database/equipment?job=Knight', label: 'อุปกรณ์กรองตามอาชีพ 2' } },
  { th: 'อัปเดต Episode 1-2', en: 'Episode 1-2 update' },
  { th: 'ดันเจี้ยนออร์ค: Orc Underground Caverns', en: 'Added Orc Dungeon: Orc Underground Caverns', link: { href: '/database/maps/orc_d01_a', label: 'Orc Underground Cave 1F' } },
  { th: 'ดันเจี้ยนโคโมโด: Northern Caverns – Luanda', en: 'Added Comodo Dungeon: Northern Caverns – Luanda', link: { href: '/database/maps/beach_dun2', label: 'Comodo North Cave: Luanda' } },
  { th: 'Memorial Dungeon ใหม่ 2 แห่ง: Prontera Culvert และ Orc’s Memory', en: 'Added 2 new Memorial Dungeons (Prontera Culvert & Orc’s Memory)', link: { href: '/database/maps/prt_sewb1', label: 'Prontera Sewer 1F' } },
  { th: 'เพิ่มอุปกรณ์ Raid Party', en: 'Added Raid Party Equipment Items' },
  { th: 'เควสกิลด์ทำได้แม้ไม่ได้อยู่ในกิลด์', en: 'Guild Quests can now be completed even if players are not members of a guild' },
];

export default function PatchNotePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าวแพทช์', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          path: PATH,
          headline: metadata.title,
          description: metadata.description,
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
        })}
      />

      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ข่าวแพทช์</span>
      </nav>

      <h1 className="pagehead__title">แพทช์ 3 ก.ย. 2569 Ragnarok Zero — เลเวล 60, อาชีพ 2, ดันเจี้ยนใหม่</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        สรุปประกาศทางการเป็นภาษาไทย (ประกาศ 2 ก.ย. 2569) — เป็นแพทช์ใหญ่ที่สุดตั้งแต่เปิดเซิร์ฟ
      </p>

      {/* Status, not a claim about the game: what this page can verify is the
          announced window and whether our own database has the new content
          yet. Whether the server actually came back on time is not something
          we can check from here, so it is not stated as fact. */}
      <section className="card card--cyan" style={{ marginTop: 20 }}>
        <h2 className="section-title">สถานะตอนนี้</h2>
        <p style={{ marginTop: 8, maxWidth: '65ch' }}>
          เลยเวลาเปิดเซิร์ฟที่ประกาศไว้ (11:15 น. วันนี้) แล้ว —
          แต่ข้อมูลของใหม่ยังไม่เข้าเว็บนี้ เพราะแหล่งอ้างอิงที่เราดึงข้อมูลยังไม่อัปเดตหน้าของเขา
          (เช็คล่าสุด {STATUS_CHECKED}) พอมีข้อมูลจะ import แล้วมอน/แมพ/เควสใหม่จะขึ้นเองทั้งเว็บ
        </p>
      </section>

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title">ปิดปรับปรุงเมื่อไหร่ (เวลาไทย)</h2>
        <table className="stat-table" style={{ marginTop: 8 }}>
          <tbody>
            <tr><td>วันที่</td><td className="num">พุธ 3 ก.ย. 2569</td></tr>
            <tr><td>เริ่มปิด</td><td className="num">07:00 น.</td></tr>
            <tr><td>เปิดโดยประมาณ</td><td className="num">11:15 น.</td></tr>
            <tr><td>รวม</td><td className="num">~4 ชม. 15 นาที</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>
          ต้นฉบับประกาศเป็น UTC+0 (00:00–04:15) แปลงเป็นเวลาไทยแล้ว · ออกจากเกมก่อนเวลาปิดตามที่ประกาศแนะนำ
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">มีอะไรใหม่</h2>
        <ol style={{ marginTop: 8, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CHANGES.map((c) => (
            <li key={c.en}>
              <div>{c.th}</div>
              <div className="muted" style={{ fontSize: 13 }}>{c.en}</div>
              {c.link && (
                <div style={{ marginTop: 2 }}>
                  <Link className="chiplink" href={c.link.href}>{c.link.label} →</Link>
                </div>
              )}
            </li>
          ))}
        </ol>
        <p style={{ marginTop: 12 }}>
          <strong>อีเวนต์:</strong> Clash! Selecting the Strongest Guild — เริ่ม Pre-Season
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ใช้เว็บนี้ทำอะไรได้ตอนนี้</h2>
        <ul style={{ marginTop: 8, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>ดันไป 60 — ช่วง 46–60 ตีอะไรคุ้มดูที่ <Link href="/tools/farm-guide">จุดฟาร์มแนะนำ</Link> (มอนเก่า ข้อมูลครบอยู่แล้ว)</li>
          <li>เปลี่ยนอาชีพ 2 แล้ว — เช็คว่าอุปกรณ์ที่ถืออยู่ยังใส่ได้ไหมที่ <Link href="/database/equipment">ฐานข้อมูลอุปกรณ์</Link> (กรองตามอาชีพได้)</li>
          <li>ของใหม่ยังไม่มีตัวเลขในเว็บ — มอนใหม่ในดันเจี้ยนใหม่ก็เช่นกัน กรอก HIT/FLEE ที่แถบตัวละครไว้ก่อน พอข้อมูลเข้า <Link href="/tools/hit-flee">คำนวณ Hit/Flee</Link> จะคิดให้ทันที</li>
        </ul>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ของใหม่จะเข้าเว็บเมื่อไหร่</h2>
        <p style={{ marginTop: 8, maxWidth: '65ch' }}>
          ทันทีที่แหล่งอ้างอิงลงข้อมูลของแพทช์นี้ — มอนสเตอร์ ไอเทม อุปกรณ์ Raid และเควสใหม่ (แปลไทยครบเหมือนเดิม)
          จะ import เข้าฐานข้อมูลแล้วขึ้นทุกหน้าที่เกี่ยวข้อง จนกว่าจะถึงตอนนั้นเว็บนี้จะไม่เดาตัวเลขของใหม่ให้
          ช่องไหนไม่มีข้อมูลจะขึ้น &ldquo;—&rdquo; ไม่ใช่เลขที่แต่งขึ้น
        </p>
      </section>

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> ประกาศทางการ Ragnarok Zero: Global (gnjoy) หัวข้อ &ldquo;Scheduled Maintenance Reminder – 3rd September 2026&rdquo; ลงวันที่ 2 ก.ย. 2569 · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

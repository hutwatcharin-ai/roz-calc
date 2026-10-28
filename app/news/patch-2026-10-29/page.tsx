import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

// The 29 Oct 2026 patch, from the two Discord maintenance notices (27 Oct and
// the 28 Oct reminder with the highlight list) and the WoE EU schedule notice
// (23 Oct). The full patch notes are "shared separately" and had not come out
// when this was written, so every line here is a translation of a highlight;
// which Clock Tower floors open, the event steps and the costumes stay unknown
// until they do. data/map-availability.json is left as it is until then.
const PATH = '/news/patch-2026-10-29';
const PUBLISHED = '2026-10-28T18:00:00+07:00';

export const metadata = {
  title: 'แพทช์ 29 ต.ค. 2569 Ragnarok Zero — เปิด Clock Tower, อีเวนต์ Gatchaman, Black Friday',
  description:
    'สรุปประกาศปิดปรับปรุง Ragnarok Zero Global 29 ตุลาคม 2569 เป็นภาษาไทย: ปิดเซิร์ฟ 08:00 น. เวลาไทย, ดันเจี้ยน Clock Tower พร้อมเควสอีเวนต์ Curse of the Clock Tower เควสรายวันและอุปกรณ์ใหม่, คอลแลบ Gatchaman, อีเวนต์ Black Friday, คอสตูมธีมผี และ WoE เซิร์ฟ EU เลื่อนเป็นตี 3',
};

export const revalidate = 3600;

const CHANGES: { th: string; en: string; link?: { href: string; label: string } }[] = [
  { th: 'เพิ่มดันเจี้ยน Clock Tower', en: 'Clock Tower Dungeon Added', link: { href: '/database/maps/c_tower1', label: 'Clock Tower 1F มีมอนอะไร' } },
  { th: 'เควสอีเวนต์ Curse of the Clock Tower', en: 'Curse of the Clock Tower Event Quest added' },
  { th: 'เควสรายวัน Clock Tower', en: 'Clock Tower Daily Quest' },
  { th: 'อุปกรณ์ใหม่จาก Clock Tower', en: 'Clock Tower Equipment Added' },
  { th: 'เริ่มอีเวนต์คอลแลบ Gatchaman', en: 'Collaboration Event: Gatchaman begins' },
  { th: 'อีเวนต์ Black Friday ของ ROZG', en: 'ROZG Black Friday Events' },
  { th: 'คอสตูมใหม่ธีมผี', en: 'New Ghostly Themed Costume', link: { href: '/tools/dress-up', label: 'ห้องแต่งตัว' } },
  { th: 'WoE เซิร์ฟ EU เลื่อนเวลา', en: 'War of Emperium EU Schedule Adjustment', link: { href: '/guides/woe#time', label: 'เวลากิลด์วอร์' } },
];

const TOWER = [
  { map: 'c_tower1', name: 'Clock Tower 1F' },
  { map: 'c_tower2', name: 'Clock Tower 2F' },
  { map: 'c_tower3', name: 'Clock Tower 3F' },
  { map: 'c_tower4', name: 'Clock Tower 4F' },
  { map: 'alde_dun01', name: 'Clock Tower B1F' },
  { map: 'alde_dun02', name: 'Clock Tower B2F' },
  { map: 'alde_dun03', name: 'Clock Tower B3F' },
  { map: 'alde_dun04', name: 'Clock Tower B4F' },
];

export default function PatchNotePage() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 820 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'แพทช์ 29 ต.ค.', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          path: PATH,
          headline: metadata.title,
          description: metadata.description,
          datePublished: PUBLISHED,
          dateModified: PUBLISHED,
        })}
      />

      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/news">ข่าว</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">แพทช์ 29 ต.ค.</span>
      </nav>

      <h1 className="pagehead__title">แพทช์ 29 ต.ค. 2569 Ragnarok Zero — เปิด Clock Tower, Gatchaman, Black Friday</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        สรุปจากประกาศปิดปรับปรุงใน Discord ทางการ (27 และ 28 ต.ค. 2569) · รายละเอียดเต็มเกมยังไม่ประกาศ ออกเมื่อไหร่จะเติมหน้านี้
      </p>

      <section className="card card--yellow" style={{ marginTop: 14 }}>
        <h2 className="section-title">ปิดปรับปรุงเมื่อไหร่ (เวลาไทย)</h2>
        <table className="stat-table" style={{ marginTop: 8 }}>
          <tbody>
            <tr><td>วันที่</td><td className="num">พฤหัส 29 ต.ค. 2569</td></tr>
            <tr><td>เริ่มปิด</td><td className="num">08:00 น.</td></tr>
            <tr><td>เปิดเมื่อไหร่</td><td className="num">ยังไม่ประกาศ</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>
          เวลาอาจเลื่อนได้ตามประกาศ · ออกจากเกมก่อนปิด · ของใน Kafra Shop ที่ขายอยู่อาจหมดรอบหลังปิดปรับปรุง ใครจะซื้อให้ดูวันหมดเขตก่อน
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
      </section>

      <section className="card" id="clock-tower" style={{ marginTop: 14 }}>
        <h2 className="section-title">Clock Tower มีกี่ชั้น</h2>
        <p style={{ marginTop: 8 }}>
          หอนาฬิกาที่ Al De Baran มีชั้นบน 4 ชั้นกับชั้นใต้ดิน 4 ชั้น ประกาศยังไม่บอกว่าเปิดชั้นไหนบ้าง
          มอนในแต่ละชั้นดูได้ที่หน้าแมพ ป้าย &quot;ยังไม่เปิด&quot; จะเอาออกหลังเกมเปิดจริง
        </p>
        <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {TOWER.map((t) => (
            <Link key={t.map} className="chiplink" href={`/database/maps/${t.map}`}>{t.name}</Link>
          ))}
        </div>
      </section>

      <section className="card" id="woe" style={{ marginTop: 14 }}>
        <h2 className="section-title">WoE เซิร์ฟ EU เลื่อนช้าลง 1 ชั่วโมง</h2>
        <table className="stat-table" style={{ marginTop: 8 }}>
          <tbody>
            <tr><td>เซิร์ฟ</td><td className="num">Skadi (EU)</td></tr>
            <tr><td>เดิม (เวลาไทย)</td><td className="num">02:00–03:00 น.</td></tr>
            <tr><td>ใหม่ (เวลาไทย)</td><td className="num">03:00–04:00 น.</td></tr>
            <tr><td>วัน</td><td className="num">พฤหัส และ จันทร์</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>
          เพราะยุโรปเปลี่ยนเวลาฤดูหนาว เริ่มรอบแรกหลังปิดปรับปรุง 29 ต.ค. · ประกาศเป็น 20:00–21:00 UTC คืนวันพุธกับคืนวันอาทิตย์ · เซิร์ฟ SEA (Odin, Loki) เวลาเดิม 21:00–22:00 น.
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">ใช้เว็บนี้ทำอะไรได้ตอนนี้</h2>
        <ul style={{ marginTop: 8, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li>Baphomet Cult, Amon Ra และ Kumamon จบก่อนปิดปรับปรุงนี้ เช็กของที่ยังไม่ได้แลกที่ <Link href="/news/events-2026-10">กิจกรรม ต.ค.</Link> (RO Lite × ROZ ยังอยู่ถึง 1 พ.ย.)</li>
          <li>ดูมอนแต่ละชั้นของ Clock Tower ก่อนเข้า ธาตุ เผ่า ดรอป อยู่ในหน้าแมพข้างบน</li>
          <li>ลองคอสตูมก่อนซื้อที่ <Link href="/tools/dress-up">ห้องแต่งตัว</Link></li>
        </ul>
      </section>

      <p className="source-note" style={{ marginTop: 16 }}>
        <strong>ที่มา:</strong> ประกาศ Discord ทางการ Ragnarok Zero: Global หัวข้อ &ldquo;Global Scheduled Maintenance Reminder – 29th October, 2026&rdquo; (28 ต.ค. 2569) และ &ldquo;War of Emperium EU Schedule Adjustment&rdquo; (23 ต.ค. 2569) · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

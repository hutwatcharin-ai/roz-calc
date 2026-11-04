// app/news/patch-2026-11-05/page.tsx
//
// The 5 Nov 2026 maintenance, written the day before from the two Discord
// maintenance notices (3 Nov, and the 4 Nov reminder with its short change
// list) and the official Costume Enchant guide the reminder links to. The
// patch notes are "shared separately" and had not come out when this was
// written, so the page says only what the notices say and points to the
// running events; it gets filled in when the notes arrive (as 15 Oct was).
import '../patch-2026-10-01/page.css';
import '../patch-2026-10-29/page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import ENCHANTABLE from '@/data/costume-enchant-list.json';

const PATH = '/news/patch-2026-11-05';
const PUBLISHED = '2026-11-04T15:00:00+07:00';
const MODIFIED = PUBLISHED;

export const metadata: Metadata = {
  title: 'ปิดปรับปรุง 5 พ.ย. 2569 Ragnarok Zero — เวลาปิดเซิร์ฟ, Black Friday ลด 10% รอบแรกจบ, คอสตูมเอนแชนต์รายการใหม่',
  description:
    'Ragnarok Zero Global ปิดปรับปรุงพฤหัสบดี 5 พฤศจิกายน 2569 เริ่ม 08:00 น. เวลาไทย: ส่วนลด Kafra Shop 10% Black Friday รอบ 1 จบ, รายชื่อคอสตูมที่ใส่หินเอนแชนต์และทำกล่องหินได้ 124 ชิ้น, อีเวนต์ที่ยังเล่นได้ต่อ',
};

export default function Patch20261105() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'ปิดปรับปรุง 5 พ.ย.', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({
          path: PATH,
          headline: String(metadata.title),
          description: String(metadata.description),
          datePublished: PUBLISHED,
          dateModified: MODIFIED,
        })}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/news">ข่าว</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">ปิดปรับปรุง 5 พ.ย.</span>
      </nav>

      <header className="phero">
        <p className="phero__date">ประกาศ 3–4 พฤศจิกายน 2569</p>
        <h1 className="phero__title">ปิดปรับปรุง พฤหัส 5 พ.ย.</h1>
        <p className="phero__lead">
          ส่วนลด Kafra Shop 10% ของ Black Friday รอบแรกจบ · รายชื่อคอสตูมที่ใส่หินเอนแชนต์ได้อัปเดตใหม่ ·
          รายละเอียดแพตช์ทางการจะประกาศแยกภายหลัง
        </p>
        <p className="phero__pill">เริ่มปิด พฤหัส 5 พ.ย. 08:00 น. เวลาไทย</p>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>⚠ ยังไม่มีแพตช์โน้ต</strong> หน้านี้เขียนจากประกาศปิดปรับปรุงสองฉบับ ประกาศยังไม่บอกเวลาเปิดเซิร์ฟ และยังไม่บอกว่ามีของใหม่อะไร
        แพตช์โน้ตออกเมื่อไรจะมาเติมในหน้านี้
      </aside>

      <section id="maint" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">1</span>เวลาปิดปรับปรุง (เวลาไทย)</h2>
        <div className="card card--yellow">
          <table className="stat-table ct-times">
            <tbody>
              <tr><td>วันที่</td><td className="num">พฤหัส 5 พ.ย. 2569</td></tr>
              <tr><td>เริ่มปิด</td><td className="num">08:00 น.</td></tr>
              <tr><td>เปิดเซิร์ฟ</td><td className="num">ยังไม่ประกาศ</td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            เวลาอาจเลื่อนได้ · ทีมงานแนะนำให้ออกจากเกมก่อนเริ่มปิด · ของใน Kafra Shop ที่ขายอยู่อาจหมดรอบหลังปิดปรับปรุง
            ถ้าจะซื้อให้ดูวันหมดเขตในร้านก่อน
          </p>
        </div>
      </section>

      <section id="changes" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">2</span>เปลี่ยนอะไรบ้าง</h2>
        <div className="ct-two">
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>ส่วนลด Kafra Shop 10% รอบ 1 จบ</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              ส่วนลดทั้งร้านของ Black Friday รอบแรก (29 ต.ค. – 5 พ.ย.) จบตอนปิดปรับปรุงนี้ · รอบ 2 คือ <b>26 พ.ย. – 3 ธ.ค.</b>
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              โบนัสเติม KP (ถึง 23 พ.ย.) และของรางวัลจากยอดใช้ KP (ถึง 4 ธ.ค.) ยังอยู่ ·{' '}
              <Link href="/news/events-2026-11#promotion">Black Friday Promotion</Link>
            </p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>คอสตูมเอนแชนต์รายการใหม่</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              รายชื่อคอสตูมที่ใส่หินเอนแชนต์ได้ และใช้ทำ Enchant Stone Craft Box ได้ อัปเดตเป็น <b>{ENCHANTABLE.names.length} ชิ้น</b> ·
              ชิ้นที่ไม่อยู่ในรายการใช้ไม่ได้
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              <Link href="/guides/costume-enchant#list">ดูรายชื่อทั้งหมด</Link> · หินแต่ละช่องให้อะไร ดูได้ที่{' '}
              <Link href="/guides/costume-enchant">หินเอนแชนต์คอสตูม</Link>
            </p>
          </div>
        </div>
      </section>

      <section id="events" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">3</span>ที่ยังเล่นได้ต่อหลังปิดปรับปรุง</h2>
        <Link href="/news/events-2026-11" className="pevents">
          <span className="pevents__tag">ถึง 26 พ.ย.</span>
          <span className="pevents__body">
            <strong>Gatchaman · Black Friday EXP x2</strong>
            <small>เควสคอลแลบที่ Morocc · EXP x2 ดรอป +20% ทุกเสาร์อาทิตย์ รอบต่อไป ศุกร์ 6 พ.ย. 07:00 น. · คอสตูมผี Ghostly</small>
          </span>
          <span className="pevents__go" aria-hidden="true">▶</span>
        </Link>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          หอนาฬิกาที่เปิดเมื่อ 29 ต.ค. ดูได้ที่ <Link href="/news/patch-2026-10-29">แพทช์ 29 ต.ค.</Link> ·
          WoE เซิร์ฟ EU ยังเป็น 03:00–04:00 น. ตามที่ย้ายไปเมื่อ 29 ต.ค. (<Link href="/guides/woe#time">ไกด์ WoE</Link>)
        </p>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศ Discord ทางการ Ragnarok Zero: Global &ldquo;Scheduled Maintenance – 5th November 2026&rdquo; (3 พ.ย. 2569)
        และ &ldquo;Scheduled Maintenance Reminder – 5th November 2026&rdquo; (4 พ.ย. 2569) · รายชื่อคอสตูมจากไกด์ Costume Enchant บน roz.mygnjoy.com
        (อ่าน 4 พ.ย. 2569) · วันของ Black Friday จากประกาศ Black Friday Promotion (29 ต.ค. 2569) · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

// app/news/patch-2026-11-05/page.tsx
//
// The 5 Nov 2026 maintenance, written the day before from the two Discord
// maintenance notices (3 Nov, and the 4 Nov reminder with its short change
// list) and the official Costume Enchant guide the reminder links to.
// Filled in on 5 Nov from the "Maintenance Completed" notice: the servers
// opened at 10:00 Thai, two hours in, and no Update Notice came with this
// round (the official Updates tab still ends at 29 Oct).
import '../patch-2026-10-01/page.css';
import '../patch-2026-10-29/page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import ENCHANTABLE from '@/data/costume-enchant-list.json';

const PATH = '/news/patch-2026-11-05';
const PUBLISHED = '2026-11-04T15:00:00+07:00';
const MODIFIED = '2026-11-05T11:30:00+07:00';

export const metadata: Metadata = {
  title: 'ปิดปรับปรุง 5 พ.ย. 2569 Ragnarok Zero — เปิดเซิร์ฟแล้ว 10:00 น., Black Friday ลด 10% รอบแรกจบ, คอสตูมเอนแชนต์รายการใหม่',
  description:
    `Ragnarok Zero Global ปิดปรับปรุงพฤหัสบดี 5 พฤศจิกายน 2569 08:00–10:00 น. เวลาไทย เปิดเซิร์ฟแล้ว ไม่มีแพตช์โน้ตรอบนี้: ส่วนลด Kafra Shop 10% Black Friday รอบ 1 จบ, รายชื่อคอสตูมที่ใส่หินเอนแชนต์และทำกล่องหินได้ ${ENCHANTABLE.names.length} ชิ้น, อีเวนต์ที่ยังเล่นได้ต่อ`,
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
        <p className="phero__date">ประกาศ 3–5 พฤศจิกายน 2569 · อัปเดต 5 พ.ย. 11:30 น.</p>
        <h1 className="phero__title">ปิดปรับปรุง พฤหัส 5 พ.ย.</h1>
        <p className="phero__lead">
          เปิดเซิร์ฟแล้วตั้งแต่ 10:00 น. ปิดไป 2 ชั่วโมง (ประกาศไว้ถึง 14:00 น.) · ส่วนลด Kafra Shop 10% ของ Black Friday รอบแรกจบ ·
          รายชื่อคอสตูมที่ใส่หินเอนแชนต์ได้อัปเดตใหม่ · รอบนี้ไม่มีแพตช์โน้ต
        </p>
        <p className="phero__pill">เปิดเซิร์ฟแล้ว 10:00 น. เวลาไทย</p>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>รอบนี้ไม่มีแพตช์โน้ต</strong> ประกาศปิดปรับปรุงเสร็จ (5 พ.ย.) บอกแค่เวลาเปิดเซิร์ฟ และหน้า Updates ของเว็บทางการยังไม่มีประกาศอัปเดตรอบ 5 พ.ย.
        (ล่าสุดยังเป็น 29 ต.ค.) · สิ่งที่เปลี่ยนเท่าที่ประกาศบอก มีสองข้อด้านล่าง ถ้าทีมงานลงแพตช์โน้ตตามมาจะเติมในหน้านี้
      </aside>

      <section id="maint" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">1</span>เวลาปิดปรับปรุง (เวลาไทย)</h2>
        <div className="card card--yellow">
          <table className="stat-table ct-times">
            <tbody>
              <tr><td>วันที่</td><td className="num">พฤหัส 5 พ.ย. 2569</td></tr>
              <tr><td>เริ่มปิด</td><td className="num">08:00 น.</td></tr>
              <tr><td>เปิดเซิร์ฟ</td><td className="num">10:00 น. (ปิดจริง 2 ชม.)</td></tr>
              <tr><td>เวลาที่ประกาศไว้ก่อน</td><td className="num">08:00–14:00 น. (6 ชม.)</td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            เปิดเร็วกว่าที่ประกาศไว้ 4 ชั่วโมง ·
            ของใน Kafra Shop ที่ขายช่วงก่อนหน้าบางชิ้นอาจหมดรอบแล้ว ดูวันหมดเขตในร้าน
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
            {/* The one thing to do on this card (owner, 4 Nov 2026: make it
                stand out, a text link was easy to miss). */}
            <Link
              href="/guides/costume-enchant#list-names"
              className="btn"
              style={{ display: 'inline-block', marginTop: 12, padding: '9px 18px', fontSize: 15, fontWeight: 700, textDecoration: 'none', background: 'var(--yellow)', color: 'var(--yellow-ink)' }}
            >
              ดูรายชื่อคอสตูม {ENCHANTABLE.names.length} ชิ้น ▶
            </Link>
            <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
              หน้าคอสตูมทุกชิ้นในรายการขึ้นป้าย &ldquo;ใส่หินเอนแชนต์ได้&rdquo; แล้ว · หินแต่ละช่องให้อะไร ดูได้ที่{' '}
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
        และ &ldquo;Scheduled Maintenance Reminder – 5th November 2026&rdquo; (4 พ.ย. 2569) และ &ldquo;Scheduled Maintenance Has Begun / Completed – 5th November 2026&rdquo; (5 พ.ย. 2569) · รายชื่อคอสตูมจากไกด์ Costume Enchant บน roz.mygnjoy.com
        (อ่าน 4 พ.ย. 2569) · วันของ Black Friday จากประกาศ Black Friday Promotion (29 ต.ค. 2569) · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

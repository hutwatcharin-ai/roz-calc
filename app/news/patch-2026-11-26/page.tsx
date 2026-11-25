// app/news/patch-2026-11-26/page.tsx
//
// The 26 Nov 2026 maintenance, written the day before from the official
// notices: "Scheduled Maintenance – 26th November 2026" (Discord 24 Nov,
// roz.mygnjoy.com notice 196 on 25 Nov) and the 25 Nov reminder (notice 197),
// which carries the short change list and the events that end. No Update
// Notice yet; the reminder says details come separately -- fill in from it.
import '../patch-2026-10-01/page.css';
import '../patch-2026-10-29/page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

const PATH = '/news/patch-2026-11-26';
const PUBLISHED = '2026-11-25T15:00:00+07:00';
const MODIFIED = PUBLISHED;

// The two new MVP Raids, by the game's monster id.
const RAIDS = [
  { id: 1147, name: 'Maya' },
  { id: 1159, name: 'Phreeoni' },
];

// What the 26 Nov maintenance closes, in the reminder's order. A null href is
// one the site has no page for.
const ENDING: { name: string; th: string; href: string | null }[] = [
  { name: 'Lifting Curse', th: 'เควสอีเวนต์', href: null },
  { name: 'Hunting Season – Hode & Orc Warrior', th: 'แลกการ์ด Hode / Orc Warrior', href: '/news/patch-2026-11-12#hunting' },
  { name: "Blacksmith's Blessing Event", th: 'แลก Blessing', href: '/news/patch-2026-11-12#blessing' },
  { name: 'Gatchaman Collaboration', th: 'เควสคอลแลบที่ Morocc และร้านแลกการ์ด', href: '/news/events-2026-11' },
];

export const metadata: Metadata = {
  title: 'ปิดปรับปรุง 26 พ.ย. 2569 Ragnarok Zero — MVP Raid Maya, Phreeoni, เควสอีเวนต์ใหม่, KP Shop ลด 10% รอบ 2',
  description:
    'Ragnarok Zero Global ปิดปรับปรุงพฤหัสบดี 26 พฤศจิกายน 2569 เริ่ม 08:00 น. เวลาไทย: MVP Raid ใหม่ Maya และ Phreeoni, เควสอีเวนต์ A Hard Choice และ Bug Extermination, ส่วนลด KP Shop 10% Black Friday รอบ 2 · อีเวนต์ที่จบรอบนี้ Gatchaman, Hunting Season, Blacksmith’s Blessing, Lifting Curse',
};

export default function Patch20261126() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'ปิดปรับปรุง 26 พ.ย.', path: PATH },
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
        <span className="crumbs__here">ปิดปรับปรุง 26 พ.ย.</span>
      </nav>

      <header className="phero">
        <p className="phero__date">ประกาศ 24–25 พฤศจิกายน 2569</p>
        <h1 className="phero__title">ปิดปรับปรุง พฤหัส 26 พ.ย.</h1>
        <p className="phero__lead">
          MVP Raid ใหม่ Maya กับ Phreeoni · เควสอีเวนต์ใหม่ 2 เควส · ส่วนลด KP Shop 10% รอบ 2 ·
          Gatchaman, Hunting Season, Blacksmith&apos;s Blessing และ Lifting Curse จบรอบนี้
        </p>
        <p className="phero__pill">เริ่มปิด 08:00 น. เวลาไทย</p>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>แพทช์โน้ตยังไม่ออก</strong> ประกาศบอกแค่หัวข้อ รายละเอียดจะประกาศแยก
        (เช่น Raid อยู่แมพไหน เควสทำที่ไหน) ออกเมื่อไหร่จะเติมในหน้านี้
      </aside>

      <section id="ending" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">1</span>ทำให้เสร็จก่อน 08:00 น. พรุ่งนี้</h2>
        <div className="card card--yellow">
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            อีเวนต์และเควสเหล่านี้<b>จบตอนปิดปรับปรุง 26 พ.ย.</b> ทำเควสที่ค้างและแลกของรางวัลให้เสร็จก่อนเซิร์ฟปิด
          </p>
          <ul style={{ margin: '10px 0 0', paddingInlineStart: 20, lineHeight: 1.9 }}>
            {ENDING.map((e) => (
              <li key={e.name}>
                {e.href ? <Link href={e.href}><b>{e.name}</b></Link> : <b>{e.name}</b>}
                <span className="muted"> · {e.th}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="maint" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">2</span>เวลาปิดปรับปรุง (เวลาไทย)</h2>
        <div className="card">
          <table className="stat-table ct-times">
            <tbody>
              <tr><td>วันที่</td><td className="num">พฤหัส 26 พ.ย. 2569</td></tr>
              <tr><td>เริ่มปิด</td><td className="num">08:00 น. (01:00 UTC)</td></tr>
              <tr><td>เปิดเซิร์ฟ</td><td className="num">—</td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            ประกาศยังไม่บอกเวลาเปิดเซิร์ฟ และบอกว่าเวลาอาจเลื่อน · ควรออกจากเกมก่อนเริ่มปิด ·
            ของใน Kafra Shop บางชิ้นอาจหมดรอบขายหลังปิดปรับปรุง ดูวันหมดเขตในร้าน
          </p>
        </div>
      </section>

      <section id="raids" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">3</span>MVP Raid ใหม่ 2 ตัว</h2>
        <ul className="pmobs">
          {RAIDS.map((m) => (
            <li key={m.id}>
              <Link href={`/database/monsters/${m.id}`} className="pmob">
                <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                <span className="pmob__name">{m.name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          ประกาศยังไม่บอกว่า Raid อยู่แมพไหน · MVP Raid ตัวก่อนๆ เข้าด้วยเควสรายวันที่ Eden Group แล้วเข้าประตูแดง
          (<Link href="/guides/mvp">วิธีเข้า MVP Raid</Link>) รอบนี้น่าจะเหมือนกัน แต่ยังไม่ยืนยัน
        </p>
      </section>

      <section id="quests" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">4</span>เควสอีเวนต์ใหม่ (มีเฉพาะ Global)</h2>
        <div className="ct-two">
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>A Hard Choice</h3>
            <p className="muted" style={{ margin: 0 }}>ทำที่ไหน ได้อะไร — รอแพทช์โน้ต</p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>Bug Extermination</h3>
            <p className="muted" style={{ margin: 0 }}>ทำที่ไหน ได้อะไร — รอแพทช์โน้ต</p>
          </div>
        </div>
      </section>

      <section id="shop" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">5</span>KP Shop ลด 10% ทั้งร้าน รอบ 2</h2>
        <div className="card">
          <p style={{ margin: 0, lineHeight: 1.65 }}>
            ส่วนลด Black Friday รอบ 2 เริ่มหลังปิดปรับปรุงนี้ ถึง <b>3 ธ.ค.</b> (วันตามประกาศ Black Friday Promotion, UTC+0) ·
            แพ็กเกจอีเวนต์บางตัวอาจไม่ลด ดูในร้านในเกม
          </p>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            ของรางวัลจากยอดใช้ KP ยังได้ถึง 4 ธ.ค. · <Link href="/news/events-2026-11#promotion">Black Friday Promotion</Link>
          </p>
        </div>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศทางการ Ragnarok Zero: Global &ldquo;Scheduled Maintenance – 26th November 2026&rdquo; (Discord 24 พ.ย. 2569, roz.mygnjoy.com 25 พ.ย.)
        และ &ldquo;Scheduled Maintenance Reminder – November 26, 2026&rdquo; (roz.mygnjoy.com 25 พ.ย. 2569) · วันส่วนลด KP รอบ 2 จากประกาศ Black Friday Promotion (29 ต.ค. 2569) ·
        หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

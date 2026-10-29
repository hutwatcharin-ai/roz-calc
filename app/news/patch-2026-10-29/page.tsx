// app/news/patch-2026-10-29/page.tsx
//
// The 29 Oct 2026 patch. Everything on the page comes from official notices
// only (owner, 29 Oct 2026: "cut what is not in the real patch notes"): the
// update notice on roz.mygnjoy.com (an image, read by hand), the maintenance
// notices and the WoE EU schedule notice. The earlier version listed every
// floor's monsters, first-time cards and basement bosses from our own spawn
// data; that guessed at what opens and is gone until the floors are confirmed.
import '../patch-2026-10-01/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import NaviCopy from '@/components/NaviCopy';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

export const revalidate = 86400;

const PATH = '/news/patch-2026-10-29';
const PUBLISHED = '2026-10-28T18:00:00+07:00';
const MODIFIED = '2026-10-29T15:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 29 ต.ค. 2569 Ragnarok Zero — เปิด Clock Tower, อีเวนต์ Gatchaman, Black Friday',
  description:
    'สรุปแพทช์ 29 ตุลาคม 2569 ของ Ragnarok Zero Global ภาษาไทย: ปิดเซิร์ฟ 08:00–14:00 น., ดันเจี้ยน Clock Tower พิกัด NPC เควสรายวันและเควสอีเวนต์ Curse of the Clock Tower อุปกรณ์ใหม่ 12 ชิ้นพร้อมผล Clock Tower Gear, คอลแลบ Gatchaman, Black Friday EXP x2, คอสตูมผี และ WoE เซิร์ฟ EU เลื่อนเป็นตี 3',
};

const HIGHLIGHTS = [
  { big: 'CT', title: 'ดันเจี้ยน Clock Tower', body: 'หอนาฬิกากลางเมือง Al De Baran', href: '#npc', link: 'ทางเข้า' },
  { big: 'Q', title: 'เควสอีเวนต์', body: 'Curse of the Clock Tower คุยกับ Clerk Molden', href: '#npc', link: 'พิกัด NPC' },
  { big: 'D', title: 'เควสรายวัน', body: 'Tower Keeper ต้อง Base Lv 70', href: '#npc', link: 'พิกัด NPC' },
  { big: 'EQ', title: 'อุปกรณ์ใหม่ 12 ชิ้น', body: 'หมวกแลกที่ Hat Maker 2 ชิ้น ของจากหอนาฬิกา 10 ชิ้น', href: '#gear', link: 'ดูผลทุกชิ้น' },
  { big: 'G', title: 'คอลแลบ Gatchaman', body: 'ถึง 26 พ.ย. เควสที่ Morocc แลกการ์ด', href: '/news/events-2026-11#gatchaman', link: 'วิธีทำ' },
  { big: 'x2', title: 'Black Friday', body: 'EXP x2 ดรอป +20% ทุกเสาร์อาทิตย์ 5 รอบ', href: '/news/events-2026-11#exp', link: 'เวลาไทย' },
  { big: '👻', title: 'คอสตูมผี', body: 'Ghostly Scroll สุ่มคอสตูม 5 แบบ', href: '/news/events-2026-11#ghostly', link: 'ดูของ' },
  { big: '+1h', title: 'WoE เซิร์ฟ EU', body: 'เลื่อนเป็น 03:00–04:00 น. เวลาไทย', href: '#woe', link: 'ดูเวลา' },
];

// From the official patch notes of 29 Oct 2026 (an image, read by hand).
const NPCS = [
  { name: 'ทางเข้าหอนาฬิกา', what: 'กลางเมือง Al De Baran', navi: 'aldebaran 139/131' },
  { name: 'Tower Keeper', what: 'เควสรายวัน · Base Lv 70+', navi: 'aldebaran 143/132' },
  { name: 'Clock Tower Clerk Molden', what: 'เควสอีเวนต์ Curse of the Clock Tower', navi: 'aldebaran 136/132' },
  { name: 'Hat Maker', what: 'แลกหมวก Clock Tower', navi: 'aldebaran 130/140' },
];

type Gear = { name: string; id?: number; kind: string; who: string; fx: string[] };
// id: our item page when the item is already in the database (28 Oct data).
const HAT_MAKER: Gear[] = [
  { name: 'Clock Tower Manager Headphones', kind: 'หัวกลาง · DEF 10 · Lv 60', who: 'ทุกอาชีพ', fx: ['MATK +20', 'ใส่คู่ Tower Keeper Card: ลดร่ายแปรผัน 15%'] },
  { name: 'Pocket Watch Ornament', id: 19334, kind: 'หัวกลาง · DEF 10 · Lv 60', who: 'ทุกอาชีพ', fx: ['ATK +20', 'ใส่คู่ Clock Card: DEF +20 MSP +100', 'ใส่คู่ Alarm Card: MHP +1000'] },
];
const EXCLUSIVE: Gear[] = [
  { name: 'Encyclopedia [2]', id: 1564, kind: 'หนังสือ · ATK 110 · อาวุธ Lv 3 · Lv 70', who: 'สาย Sage, Priest', fx: ['INT +3 DEX +2 ไม่แตก', 'CRIT +20 และ CRIT เพิ่มตาม LUK', 'MATK +100'] },
  { name: 'Rabbit Pattern Shirt [1]', id: 15282, kind: 'เกราะ · DEF 10 · Lv 60', who: 'สาย Mage, Acolyte', fx: ['MHP +150 MSP +75', 'MATK +2 ต่อขั้นตีบวก', '+7: MHP +75 MSP +25 · +9: MHP +75 MSP +25'] },
  { name: 'Clock Casket [1]', id: 19357, kind: 'หัวบน · DEF 10 · Lv 60', who: 'ทุกอาชีพ', fx: ['ทุก +2 ดาเมจกายภาพใส่มอน Formless +1%', '+7: HIT +15 · +9: MHP +250'] },
  { name: 'Black Witch Hat [1]', id: 19358, kind: 'หัวบน · DEF 10 · Lv 60', who: 'ทุกอาชีพ', fx: ['ทุก +2 MATK +1%', '+7: MHP +50 MSP +100 · +9: ลดร่ายแปรผัน 5%'] },
  { name: 'Safety Boots [1]', kind: 'รองเท้า · DEF 60 · Lv 60', who: 'สาย Swordman', fx: ['แพตช์โน้ตไม่ได้เขียนผล นอกจาก DEF'] },
  { name: "General's Cape [1]", kind: 'ผ้าคลุม · DEF 55 · Lv 60', who: 'ทุกอาชีพ', fx: ['MHP +200 MSP +20', 'ทุก +2 MHP +100 MSP +10', '+7 และ +9: ลดร่ายแปรผัน 5% ดีเลย์หลังตี 5% (ขั้นละครั้ง)'] },
  { name: "Hunter's Cape [1]", kind: 'ผ้าคลุม · DEF 7 · Lv 60', who: 'ทุกอาชีพ', fx: ['ATK +10 HIT +10', '+6 ขึ้นไป: ATK +1 HIT +1 ทุกขั้นที่เกิน +5', '+7 และ +9: ดีเลย์หลังตี −5% (ขั้นละครั้ง)'] },
  { name: 'Rotating Gear [1]', kind: 'ผ้าคลุม · DEF 2 · Lv 60', who: 'ทุกอาชีพ', fx: ['FLEE +10', '+6 ขึ้นไป: FLEE +1 ทุกขั้นที่เกิน +5', '+7 และ +9: ลดร่ายแปรผัน 5% (ขั้นละครั้ง)'] },
  { name: 'Joker Claw [1]', id: 1856, kind: 'สนับมือ · ATK 90 · อาวุธ Lv 3 · Lv 60', who: 'สาย Monk, Priest', fx: ['STR +2 Raging Trifecta Blow +10%', 'Trifecta +1% ต่อขั้นตีบวก · ทุก +2 ดีเลย์หลังตี −1%', '+7: Raging Quadruple Blow +15% · +9: Raging Thrust +15%'] },
  { name: 'Memory Book', id: 2109, kind: 'โล่ · DEF 25 · Lv 1', who: 'สาย Mage', fx: ['INT +1 MDEF +2'] },
];

function gearRow(g: Gear) {
  return (
    <li key={g.name} className="ct-gearrow">
      {g.id ? <img src={`/images/items/${g.id}.gif`} alt="" width={24} height={24} loading="lazy" /> : <span className="ct-gearrow__noicon" aria-hidden="true" />}
      <div>
        <p className="ct-gearrow__name">{g.id ? <Link href={`/database/items/${g.id}`}>{g.name}</Link> : g.name}</p>
        <p className="ct-gearrow__kind">{g.kind} · {g.who}</p>
        <ul className="ct-gearrow__fx">{g.fx.map((f) => <li key={f}>{f}</li>)}</ul>
      </div>
    </li>
  );
}

export default function Patch20261029Page() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
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
        <span className="crumbs__here">แพทช์ 29 ต.ค.</span>
      </nav>

      <header className="phero">
        <p className="phero__date">อัปเดต 29 ตุลาคม 2569</p>
        <h1 className="phero__title">หอนาฬิกา Clock Tower มาแล้ว</h1>
        <p className="phero__lead">
          ดันใหม่ที่ Al De Baran พร้อมเควสอีเวนต์ Curse of the Clock Tower เควสรายวัน และอุปกรณ์ใหม่ ·
          คอลแลบ Gatchaman · Black Friday · คอสตูมธีมผี
        </p>
        <p className="phero__pill">ปิดปรับปรุง พฤหัส 29 ต.ค. 08:00–14:00 น. เวลาไทย</p>{' '}
        <a className="phero__pill phero__pill--link" href="#gear">อุปกรณ์ใหม่ ↓</a>{' '}
        <a className="phero__pill phero__pill--link" href="#woe">WoE EU เลื่อนเวลา ↓</a>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>หน้านี้มีเฉพาะที่ประกาศทางการเขียนไว้</strong> แพตช์โน้ตไม่บอกว่าเปิดชั้นไหนบ้าง มีมอนอะไร และของดรอปจากที่ไหน
        เข้าเกมแล้วรู้เพิ่มจะมาอัปเดตหน้านี้
      </aside>

      <Link href="/news/events-2026-10" className="pevents">
        <span className="pevents__tag">จบรอบนี้ · 29 ต.ค.</span>
        <span className="pevents__body">
          <strong>กิจกรรมตุลาคมจบก่อนปิดปรับปรุง แลกของให้ทัน</strong>
          <small>Baphomet Cult · The Legend of Amon Ra · Kumamon (RO Lite × ROZ ยังอยู่ถึง 1 พ.ย.)</small>
        </span>
        <span className="pevents__npcs" aria-hidden="true">
          <img src="/images/events/2026-10/raymond.png" alt="" width={34} />
          <img src="/images/events/2026-10/amon-ra.png" alt="" width={50} />
          <img src="/images/events/2026-10/kumamon.png" alt="" width={40} />
        </span>
        <span className="pevents__go" aria-hidden="true">▶</span>
      </Link>

      <section className="phl" aria-label="สรุปแพทช์">
        {HIGHLIGHTS.map((h) => (
          <article key={h.title} className="phl__tile">
            <p className="phl__big">{h.big}</p>
            <h2 className="phl__title">{h.title}</h2>
            <p className="phl__body">{h.body}</p>
            {h.href && (
              h.href.startsWith('#') ? <a className="phl__link" href={h.href}>{h.link} →</a> : <Link className="phl__link" href={h.href}>{h.link} →</Link>
            )}
          </article>
        ))}
      </section>

      <section className="card card--cyan" id="npc" style={{ marginTop: 30, scrollMarginTop: 90 }}>
        <h2 className="section-title">NPC ที่ Al De Baran</h2>
        <div className="ct-npcs">
          {NPCS.map((n) => (
            <div key={n.name} className="ct-npc">
              <strong>{n.name}</strong>
              <span className="muted">{n.what}</span>
              <NaviCopy cmd={`/navi ${n.navi}`} />
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 14 }}>
          เควสรายวันรับได้เฉพาะ Base Lv 70 ขึ้นไป · แพตช์โน้ตไม่บอกขั้นตอนเควสและรางวัล
        </p>
      </section>

      <section id="gear" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">อุปกรณ์ใหม่</h2>
        <h3 className="pxh">แลกที่ Hat Maker</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>ใช้ของที่เก็บระหว่างผจญภัย แพตช์โน้ตไม่บอกว่าต้องใช้อะไร</p>
        <ul className="ct-gear">{HAT_MAKER.map(gearRow)}</ul>
        <h3 className="pxh">ของจาก Clock Tower</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>แพตช์โน้ตเรียกว่า Exclusive Equipment ไม่บอกว่าดรอปจากมอนตัวไหน</p>
        <ul className="ct-gear">{EXCLUSIVE.map(gearRow)}</ul>
        <h3 className="pxh">Clock Tower Gear อัปเกรดหมวก</h3>
        <p className="muted pxp" style={{ fontSize: 14, lineHeight: 1.65 }}>
          ใช้อัปเกรดหมวก 4 ชิ้น: Clock Tower Manager Headphones, Pocket Watch Ornament, Clock Casket, Black Witch Hat
          ให้ได้ความสามารถเพิ่ม · <strong>ค่าตีบวกกับการ์ดที่ใส่อยู่ไม่หาย</strong> · แพตช์โน้ตไม่บอกว่าได้อะไรเพิ่มและหา Gear จากไหน
        </p>
      </section>

      <section className="card card--yellow" id="maint" style={{ marginTop: 34 }}>
        <h2 className="section-title">ปิดปรับปรุงเมื่อไหร่ (เวลาไทย)</h2>
        <table className="stat-table ct-times">
          <tbody>
            <tr><td>วันที่</td><td className="num">พฤหัส 29 ต.ค. 2569</td></tr>
            <tr><td>เริ่มปิด</td><td className="num">08:00 น.</td></tr>
            <tr><td>เปิดเซิร์ฟ</td><td className="num">14:00 น. (ปิด 6 ชั่วโมง)</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>
          เวลาเปิดจากประกาศเริ่มปิดปรับปรุงเช้า 29 ต.ค. อาจเลื่อนได้ · ออกจากเกมก่อนปิด · ของใน Kafra Shop ที่ขายอยู่อาจหมดรอบหลังปิดปรับปรุง ใครจะซื้อให้ดูวันหมดเขตก่อน
        </p>
      </section>

      <section className="card" id="woe" style={{ marginTop: 14, scrollMarginTop: 90 }}>
        <h2 className="section-title">WoE เซิร์ฟ EU เลื่อนช้าลง 1 ชั่วโมง</h2>
        <table className="stat-table ct-times">
          <tbody>
            <tr><td>เซิร์ฟ</td><td className="num">Skadi (EU)</td></tr>
            <tr><td>เดิม (เวลาไทย)</td><td className="num">02:00–03:00 น.</td></tr>
            <tr><td>ใหม่ (เวลาไทย)</td><td className="num">03:00–04:00 น.</td></tr>
            <tr><td>วัน</td><td className="num">พฤหัส และ จันทร์</td></tr>
          </tbody>
        </table>
        <p className="muted" style={{ marginTop: 8 }}>
          เพราะยุโรปเปลี่ยนเวลาฤดูหนาว เริ่มรอบแรกหลังปิดปรับปรุง 29 ต.ค. · ประกาศเป็น 20:00–21:00 UTC คืนวันพุธกับคืนวันอาทิตย์ ·
          เซิร์ฟ SEA (Odin, Loki) เวลาเดิม 21:00–22:00 น. · <Link href="/guides/woe#time">ไกด์ WoE</Link>
        </p>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> แพตช์โน้ตทางการ roz.mygnjoy.com &ldquo;The Clock Strikes, A New Adventure Begins – October 29 Update&rdquo; (29 ต.ค. 2569) ·
        ประกาศ Discord ทางการ Ragnarok Zero: Global &ldquo;Global Scheduled Maintenance Reminder – 29th October, 2026&rdquo; (28 ต.ค. 2569)
        และ &ldquo;War of Emperium EU Schedule Adjustment&rdquo; (23 ต.ค. 2569) · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

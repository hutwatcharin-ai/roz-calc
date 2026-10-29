// app/news/events-2026-11/page.tsx
//
// The two events that start with the 29 Oct 2026 patch: the Gatchaman collab
// (to the 26 Nov maintenance) and Black Friday (to the 23 Nov maintenance).
//
// Source: the official notices on roz.mygnjoy.com/th/news/event (174 and 173,
// 29 Oct 2026), which are images; transcribed by hand on the day. The
// client of this patch was not extracted yet, so none of the event items or
// monsters are in our database: names are as the notice spells them, with no
// links. Where the notice contradicts itself, the page says so instead of
// picking one.
//
// UTC times are converted to Thai time (+7): the weekend rounds start 00:00
// UTC on Friday, which is 07:00 Friday here.
import '../patch-2026-10-01/page.css';
import '../patch-2026-10-29/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import NaviCopy from '@/components/NaviCopy';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

export const revalidate = 86400;

const PATH = '/news/events-2026-11';
const PUBLISHED = '2026-10-29T15:00:00+07:00';

export const metadata: Metadata = {
  title: 'กิจกรรม Gatchaman และ Black Friday Ragnarok Zero — เควส รางวัล EXP x2 วันเสาร์อาทิตย์',
  description:
    'สรุปกิจกรรม 29 ต.ค. – 26 พ.ย. 2569 ของ Ragnarok Zero Global ภาษาไทย: คอลแลบ Gatchaman ที่ Morocc เควสหลัก เควสรายวัน 5 เควส แลกการ์ด Gatchaman/Galactor/Bird Missile และคอสตูม · Black Friday EXP x2 ดรอป +20% 5 รอบวันเสาร์อาทิตย์ เวลาไทย และกล่องคอสตูมผี Ghostly',
};

// Double EXP weekends, Thai time (notice: 00:00 Fri - 23:59 Sun UTC+0).
const ROUNDS = [
  ['1', 'ศุกร์ 30 ต.ค. 07:00', 'จันทร์ 2 พ.ย. 06:59'],
  ['2', 'ศุกร์ 6 พ.ย. 07:00', 'จันทร์ 9 พ.ย. 06:59'],
  ['3', 'ศุกร์ 13 พ.ย. 07:00', 'จันทร์ 16 พ.ย. 06:59'],
  ['4', 'ศุกร์ 20 พ.ย. 07:00', 'จันทร์ 23 พ.ย. 06:59'],
  ['5', 'ศุกร์ 27 พ.ย. 07:00', 'จันทร์ 30 พ.ย. 06:59'],
];

const DAILY = [
  { name: 'Launch! Mid Missile!', goal: 'เก็บ Mid Powder 10 ชิ้น', navi: 'morocc 32/194', reward: 1 },
  { name: "All Right! I'll Smash Them All!", goal: 'ล่า Galaring 10 ตัว', navi: 'morocc 32/194', reward: 1 },
  { name: "Galactor's Monsters Will Never Return to Their Base!", goal: 'ล่า Squid Bomb 10 ตัว', navi: 'morocc 32/194', reward: 1 },
  { name: 'Prepare Yourself, Berg Katse!', goal: 'หา Berg Katse ในรอยแยก ล้ม Mutant Galaring', navi: 'morocc 29/193', reward: 2 },
  { name: "Please, I'm Begging You!", goal: 'ตามหา Joe ที่หายไป (เควสนี้ขึ้นแบบสุ่ม)', navi: 'morocc 34/192', reward: 1 },
];

const SHOP = [
  { name: 'Resistant Feather', fx: 'MHP +3% MSP +3% นาน 60 นาที', cost: 3 },
  { name: 'Light Feather', fx: 'FLEE +15 HIT +15 นาน 60 นาที', cost: 3 },
  { name: 'Glamourous Feather', fx: 'CRI +5 ASPD +1 นาน 60 นาที', cost: 3 },
  { name: 'Heavy Feather', fx: 'ATK +4% MATK +3% นาน 60 นาที', cost: 3 },
  { name: '[Costume] Honorary Gatchaman', fx: 'คอสตูมหัวบน · ช่วงอีเวนต์ EXP จากมอน +5%', cost: 25 },
  { name: 'Gatchaman Card', fx: 'ATK +7', cost: 55 },
  { name: 'Galactor Card', fx: 'MATK +7', cost: 55 },
  { name: 'Bird Missile Card', fx: 'MHP +70', cost: 55 },
];

const COSTUMES_1 = ['G-1 Ken, the Eagle', 'G-2 Joe, the Condor', 'G-3 Jun, the Swan', 'G-4 Jinpei, the Swallow', 'G-5 Ryu, the Owl'];
const COSTUMES_2 = ["Galactor's Leader", "Doctor's Urgent Transmission", 'Operation Firebird Footprints', 'Gatchaman! Move Out!', 'Farewell Gatchaman!'];

const GHOSTLY = [
  { name: 'Ghostring Tall Hat', where: 'หัวบน', note: 'หมวกทรงสูงลายปะผ้าแบบ Ghostring' },
  { name: "Fallen Bishop Hibram's Evil Spirit", where: 'ผ้าคลุม', note: 'วิญญาณร้ายของ Fallen Bishop ตัวพองเหมือนลูกโป่ง' },
  { name: "Whisper's Blessing", where: 'ผ้าคลุม', note: 'Whisper เกาะหลัง' },
  { name: 'Ghost Bat', where: 'หัวล่าง', note: 'ค้างคาวสายแวมไพร์' },
  { name: 'Enhanced Whisper Mask', where: 'หัวกลาง', note: 'หน้ากาก Whisper รุ่นแรงขึ้น' },
];

export default function Events202611Page() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'กิจกรรม Gatchaman · Black Friday', path: PATH },
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
        <Link href="/news">ข่าว</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">Gatchaman · Black Friday</span>
      </nav>

      <header className="phero">
        <p className="phero__date">กิจกรรม 29 ต.ค. – 26 พ.ย. 2569</p>
        <h1 className="phero__title">Gatchaman บุก Morocc · Black Friday EXP x2</h1>
        <p className="phero__lead">
          คอลแลบ Gatchaman มีเควสหลัก เควสรายวัน แลกการ์ดและคอสตูม เลเวล 10 ขึ้นไปเล่นได้ ·
          Black Friday แจก EXP x2 ดรอป +20% ทุกวันเสาร์อาทิตย์ 5 รอบ และกล่องคอสตูมผีใน Kafra Shop
        </p>
        <a className="phero__pill phero__pill--link" href="#gatchaman">Gatchaman ถึงปิดปรับปรุง 26 พ.ย. ↓</a>{' '}
        <a className="phero__pill phero__pill--link" href="#exp">EXP x2 รอบแรก ศุกร์ 30 ต.ค. 07:00 น. ↓</a>
      </header>

      <section className="phl" aria-label="สรุปกิจกรรม">
        <article className="phl__tile">
          <p className="phl__big">x2</p>
          <h2 className="phl__title">EXP วันเสาร์อาทิตย์</h2>
          <p className="phl__body">EXP +100% ดรอป +20% ตายเสีย EXP ลดครึ่ง ได้ทุกตัวละครอัตโนมัติ</p>
          <a className="phl__link" href="#exp">ดูเวลา 5 รอบ →</a>
        </article>
        <article className="phl__tile">
          <p className="phl__big">Q</p>
          <h2 className="phl__title">เควส Gatchaman</h2>
          <p className="phl__body">เควสหลักที่ Morocc แล้วปลดเควสรายวัน 5 เควส ได้ Mid Missile Button</p>
          <a className="phl__link" href="#quest">ทำยังไง →</a>
        </article>
        <article className="phl__tile">
          <p className="phl__big">55</p>
          <h2 className="phl__title">การ์ดคอลแลบ</h2>
          <p className="phl__body">ปุ่ม 55 อันแลกการ์ดผ้าคลุม 1 ใบ ช่วงอีเวนต์ EXP +15% ดรอป +7%</p>
          <a className="phl__link" href="#shop">ร้านแลก →</a>
        </article>
        <article className="phl__tile">
          <p className="phl__big">👻</p>
          <h2 className="phl__title">คอสตูมผี</h2>
          <p className="phl__body">Ghostring Tall Hat, Whisper's Blessing และอีก 3 ชิ้น ใน Kafra Shop</p>
          <a className="phl__link" href="#ghostly">ดูของ →</a>
        </article>
      </section>

      <section className="card card--cyan" id="exp" style={{ marginTop: 30, scrollMarginTop: 90 }}>
        <h2 className="section-title">Black Friday EXP x2 วันเสาร์อาทิตย์ (เวลาไทย)</h2>
        <table className="stat-table ev11-table">
          <thead>
            <tr><th>รอบ</th><th>เริ่ม</th><th>จบ</th></tr>
          </thead>
          <tbody>
            {ROUNDS.map(([n, from, to]) => (
              <tr key={n}><td className="num">{n}</td><td>{from}</td><td>{to}</td></tr>
            ))}
          </tbody>
        </table>
        <ul className="ev11-list">
          <li>EXP +100% (x2) · ดรอปไอเทม +20% · ตายแล้วเสีย EXP น้อยลง 50%</li>
          <li>ได้เองทุกตัวละคร ไม่ต้องกดรับ</li>
          <li>ประกาศเขียนเวลาเป็น UTC+0 (ศุกร์ 00:00 ถึงอาทิตย์ 23:59) เว็บนี้บวก 7 ชั่วโมงเป็นเวลาไทย</li>
          <li>รอบ 5 เลยวันจบอีเวนต์ Black Friday (ปิดปรับปรุง 23 พ.ย.) ตามที่ประกาศเขียนไว้ ประกาศบอกว่าตารางเปลี่ยนได้</li>
        </ul>
      </section>

      <section id="gatchaman" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">คอลแลบ Gatchaman</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14.5, lineHeight: 1.65 }}>
          29 ต.ค. หลังปิดปรับปรุง ถึงปิดปรับปรุง 26 พ.ย. · เลเวล 10 ขึ้นไป · รอยแยกปริศนาโผล่ที่ Morocc
          มอนกับคนแปลกหน้าออกมาทุกคืน ทีมนินจาวิทยาศาสตร์ Gatchaman ทั้ง 5 คนมาช่วยสู้องค์กร Galactor
        </p>

        <h3 className="pxh" id="quest" style={{ scrollMarginTop: 90 }}>1. เควสหลัก Visitors from Another World</h3>
        <ol className="ev11-steps">
          <li>
            คุยกับ <strong>[Urgent] Anomalous Rift Receptionist</strong> สมัครเข้าทีมสำรวจรอยแยก
            <NaviCopy cmd="/navi morocc 196/261" />
          </li>
          <li>ฟังเรื่องรอยแยก คนแปลกหน้า และมอนแปลก ๆ ตามเบาะแสจากชาวเมืองจนเจอทีม Gatchaman</li>
          <li>ช่วยกันไล่กองทัพ Galactor กลับไป · จบเควสแล้วปลดเควสรายวันข้างล่าง</li>
        </ol>

        <h3 className="pxh">2. เควสรายวัน (หลังจบเควสหลัก)</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          รับจาก <strong>Jun</strong> ที่ Morocc · รางวัลเป็น <strong>Mid Missile Button</strong> ใช้แลกของที่ Joe · ปุ่มนี้หายเมื่ออีเวนต์จบ
        </p>
        <div className="ev11-tablewrap">
          <table className="stat-table ev11-table">
            <thead>
              <tr><th>เควส</th><th>ต้องทำ</th><th>ได้ปุ่ม</th></tr>
            </thead>
            <tbody>
              {DAILY.map((q) => (
                <tr key={q.name}>
                  <td><strong>{q.name}</strong><br /><span className="mono muted">/navi {q.navi}</span></td>
                  <td>{q.goal}</td>
                  <td className="num">{q.reward}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="pxh" id="shop" style={{ scrollMarginTop: 90 }}>3. Let&apos;s Go! Gatchaman! แลกของที่ Joe</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          <NaviCopy cmd="/navi morocc 34/192" />
        </p>
        <div className="ev11-tablewrap">
          <table className="stat-table ev11-table">
            <thead>
              <tr><th>ของ</th><th>ผล</th><th>ใช้ปุ่ม</th></tr>
            </thead>
            <tbody>
              {SHOP.map((s) => (
                <tr key={s.name}><td><strong>{s.name}</strong></td><td>{s.fx}</td><td className="num">{s.cost}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="ev11-list">
          <li>
            การ์ด 3 ใบใส่<strong>ผ้าคลุม</strong> · ค่าหลัก (ATK/MATK/MHP) กับ DEF +3 MDEF +1 เพิ่มทุก 10 Base Lv นับถึง Lv 50
          </li>
          <li>
            ช่วงอีเวนต์การ์ดทั้ง 3 ใบได้เพิ่ม: ดาเมจกายภาพ/เวทใส่มอนทุกเผ่า +10% (ไม่รวมผู้เล่น) ทุกขนาด +10% EXP จากมอน +15% ดรอป +7% ·
            <strong> ค่าพวกนี้หายเมื่ออีเวนต์จบ</strong> เหลือแค่ค่าหลัก
          </li>
          <li>ขนนก 4 แบบหายเมื่ออีเวนต์จบ · คอสตูม Honorary Gatchaman อยู่ต่อ แต่ EXP +5% หายเมื่ออีเวนต์จบ</li>
          <li>ทำเควสรายวันครบได้ปุ่มวันละ 5 อัน (6 อันวันที่เควสหา Joe ขึ้น) การ์ด 1 ใบจึงใช้ราว 10–11 วัน · อีเวนต์ยาว 4 สัปดาห์ เก็บได้ราว 2 ใบ</li>
        </ul>

        <h3 className="pxh">4. แพ็กเกจคอสตูมใน Kafra Shop (จำกัดบัญชีละ 5)</h3>
        <div className="ev11-tablewrap">
          <table className="stat-table ev11-table">
            <thead>
              <tr><th>แพ็กเกจ</th><th>ได้</th><th>ราคา</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Gatchaman Costume Package I</strong></td>
                <td>Selection Scroll I · Zelstar ×50 · World Teleport Ticket ×50 · Enriched Elunium ×20 · Growth Elixir ×5</td>
                <td className="num">35,000 KP</td>
              </tr>
              <tr>
                <td><strong>Gatchaman Costume Package II</strong></td>
                <td>Selection Scroll II · Zelstar ×50 · World Teleport Ticket ×50 · Enriched Oridecon ×20 · Bubble Gum ×10</td>
                <td className="num">35,000 KP</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="ev11-two">
          <div>
            <p className="ev11-k">Scroll I เลือก 1 ชิ้น · หัวบน+กลาง</p>
            <ul className="ev11-list">{COSTUMES_1.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
          <div>
            <p className="ev11-k">Scroll II เลือก 1 ชิ้น</p>
            <ul className="ev11-list">{COSTUMES_2.map((c) => <li key={c}>{c}</li>)}</ul>
          </div>
        </div>
        <p className="muted pxp" style={{ fontSize: 13.5 }}>
          ประกาศขัดกันเอง: Scroll I เขียนว่าเลือก 1 จาก 6 แต่ลิสต์มา 5 ชิ้น · Scroll II เขียนว่า 1 จาก 2 แต่ลิสต์ 5 ชิ้น ·
          Galactor&apos;s Leader เป็นหัวบน+กลาง ส่วน Doctor&apos;s Urgent Transmission, Farewell Gatchaman! และ Move Out! เป็นหัวล่าง ·
          Operation Firebird Footprint เป็นของเอ็นชานต์ช่องที่ 4 ของคอสตูมผ้าคลุม ประกาศไม่บอกผล · เช็กในเกมก่อนซื้อ
        </p>
      </section>

      <section id="ghostly" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">Black Friday คอสตูมผี Ghostly</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14.5 }}>
          ขายใน Kafra Shop 29 ต.ค. หลังปิดปรับปรุง ถึงปิดปรับปรุง 23 พ.ย.
        </p>
        <div className="ev11-tablewrap">
          <table className="stat-table ev11-table">
            <thead>
              <tr><th>เซิร์ฟ Asia (เรา)</th><th>ได้</th><th>ราคา</th></tr>
            </thead>
            <tbody>
              <tr><td><strong>Ghostly Scroll Box</strong></td><td>Ghostly Scroll ×1</td><td className="num">350 KP</td></tr>
              <tr><td><strong>Ghostly Scroll 10 Box</strong></td><td>Ghostly Scroll ×10</td><td className="num">3,500 KP</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          Ghostly Scroll เปิดแล้ว<strong>สุ่ม</strong>ได้ 1 อย่างจาก: คอสตูม 5 ชิ้นข้างล่าง · Mileage Ticket · Giant Fly Wing 100 อัน ·
          Special Buff Selection Box · Small Mana Potion ×2 · Token of Siegfried · Small Healing Potion ×3 · Life Insurance ·
          ประกาศไม่บอกโอกาสได้แต่ละอย่าง · เซิร์ฟ EU ขายเป็นกล่องเลือกเอง (15,000 / 35,000 KP) ไม่ใช่สุ่ม
        </p>
        <ul className="ev11-ghost">
          {GHOSTLY.map((g) => (
            <li key={g.name}>
              <strong>{g.name}</strong>
              <span className="ev11-where">{g.where}</span>
              <span className="muted">{g.note}</span>
            </li>
          ))}
        </ul>
        <p className="muted pxp" style={{ fontSize: 13.5 }}>
          หลังอีเวนต์จบ คอสตูมพวกนี้เปลี่ยนเป็นผูกบัญชี (ขายต่อไม่ได้) เพื่อให้เอ็นชานต์ได้ · ลองใส่ดูก่อนได้ที่{' '}
          <Link href="/tools/dress-up">ห้องแต่งตัว</Link> เมื่อของเข้าฐานข้อมูลแล้ว
        </p>
      </section>

      <aside className="pnote">
        <strong>ของในหน้านี้ยังไม่มีในฐานข้อมูลของเว็บ</strong> เพราะยังไม่ได้แกะไคลเอนต์แพตช์นี้ ชื่อของสะกดตามประกาศ
        จะใส่ลิงก์ไอเทม รูป และมอน Galaring / Squid Bomb ตามมา · แพตช์เดียวกัน: <Link href="/news/patch-2026-10-29">Clock Tower</Link>
      </aside>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศทางการ roz.mygnjoy.com &ldquo;[Collaboration Event] Science Ninja Team Gatchaman Arrives in Ragnarok Zero: Global!&rdquo;
        และ &ldquo;Black Friday Event&rdquo; (29 ต.ค. 2569) · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ · Gatchaman © Tatsunoko Production
      </p>
    </main>
  );
}

// app/news/events-2026-11/page.tsx
//
// The events that start with the 29 Oct 2026 patch, laid out like the
// October page (owner, 29 Oct: "/news/events-2026-10 is easy to follow --
// quests, pictures, details"): the Gatchaman collab (to the 26 Nov
// maintenance) and Black Friday (to the 23 Nov maintenance).
//
// Sources, in order of trust:
//   - the client patched on 29 Oct (D:/RagnarokZero/System and the GRF
//     snapshot weekly/2026-10-29): quest steps and places are the quest log
//     text (OngoingQuestInfoList_enUS) and navi_npc.lub; item names, effects
//     and icons are the item table; NPC and monster pictures are rendered
//     from its sprites (scripts/build-event-2026-11-images.py);
//   - the official notices on roz.mygnjoy.com (event 173 and 174, 29 Oct) for
//     dates, quest rewards, Joe's exchange prices and the Kafra Shop lineup.
//     The client carries no reward lists.
// Where the notice contradicts itself, the page says so instead of picking.
// UTC times are converted to Thai time (+7).
import '../events-2026-10/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import NaviCopy from '@/components/NaviCopy';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

export const revalidate = 86400;

const PATH = '/news/events-2026-11';
const PUBLISHED = '2026-10-29T15:00:00+07:00';
const MODIFIED = '2026-10-29T20:00:00+07:00';
const ENDS = '2026-11-26T08:00:00+07:00';
const IMG = '/images/events/2026-11';
// Item icons: the 29 Oct imports are PNG; older items keep their GIF, and
// Whisper's Blessing has no icon file in the client yet.
const GIF = new Set([105671, 31123]);
const NO_ICON = new Set([20547]);
const ico = (id: number) => `/images/items/${id}.${GIF.has(id) ? 'gif' : 'png'}`;

export const metadata: Metadata = {
  title: 'กิจกรรม Gatchaman และ Black Friday Ragnarok Zero — วิธีทำเควส รางวัล EXP x2',
  description:
    'วิธีทำกิจกรรม 29 ต.ค. – 26 พ.ย. 2569 ใน Ragnarok Zero Global: คอลแลบ Gatchaman ที่ Morocc เควสหลักทีละขั้นพร้อม /navi เควสรายวัน ร้านแลกการ์ด Gatchaman/Galactor/Bird Missile และคอสตูม · Black Friday EXP x2 ดรอป +20% 5 รอบเวลาไทย · คอสตูมผี Ghostly Scroll',
};

type Mat = { id: number; name: string; qty: number };
const item = (m: Mat) => (
  <li key={m.id}>
    <Link href={`/database/items/${m.id}`} className="evmat">
      <img src={ico(m.id)} alt="" width={24} height={24} loading="lazy" />
      <span>{m.name}</span>
      <b>×{m.qty}</b>
    </Link>
  </li>
);

function Npc({ img, name, navi, w = 60 }: { img: string; name: string; navi: string; w?: number }) {
  return (
    <figure className="evnpc">
      <span className="evnpc__art"><img src={`${IMG}/${img}.png`} alt={name} width={w} loading="lazy" /></span>
      <figcaption>
        <strong>{name}</strong>
        <NaviCopy cmd={`/navi ${navi}`} />
      </figcaption>
    </figure>
  );
}

function Mob({ img, name, note, w = 56 }: { img: string; name: string; note: string; w?: number }) {
  return (
    <div className="evmob ev11-mob">
      <img src={`${IMG}/${img}.png`} alt="" width={w} loading="lazy" />
      <span><b>{name}</b> {note}</span>
    </div>
  );
}

// Joe's exchange (notice prices; effects from the client's item text).
const SHOP: { id: number; name: string; fx: string; cost: number; costume?: boolean }[] = [
  { id: 105672, name: 'Sturdy Feather', fx: 'MHP +3% MSP +3% 60 นาที', cost: 3 },
  { id: 105669, name: 'Swift Feather', fx: 'FLEE +15 HIT +15 60 นาที', cost: 3 },
  { id: 105668, name: 'Brilliant Feather', fx: 'CRI +5 ASPD +1 60 นาที', cost: 3 },
  { id: 105667, name: 'Heavy Feather', fx: 'ATK +4% MATK +3% 60 นาที', cost: 3 },
  { id: 401207, name: '[Costume] Honorary Gatchaman', fx: 'หัวบน · ช่วงอีเวนต์ EXP จากมอน +5%', cost: 25, costume: true },
  { id: 300732, name: 'Gatchaman Card', fx: 'ผ้าคลุม · ATK +7 ต่อ 10 Base Lv', cost: 55 },
  { id: 300733, name: 'Galactor Army Card', fx: 'ผ้าคลุม · MATK +7 ต่อ 10 Base Lv', cost: 55 },
  { id: 300734, name: 'Bird Missile Card', fx: 'ผ้าคลุม · MHP +70 ต่อ 10 Base Lv', cost: 55 },
];

const SCROLL_1 = [
  { id: 430026, name: 'Ken the Eagle' },
  { id: 430027, name: 'Joe the Condor' },
  { id: 430028, name: 'Jun the Swan' },
  { id: 430029, name: 'Jinpei the Swallow' },
  { id: 430030, name: 'Ryu the Owl' },
];
const SCROLL_2 = [
  { id: 430025, name: 'Leader of Galactor', where: 'หัวบน+กลาง' },
  { id: 420731, name: "Dr. Nambu's Emergency Transmission", where: 'หัวล่าง' },
  { id: 420729, name: 'Farewell, Gatchaman!', where: 'หัวล่าง' },
  { id: 420730, name: 'Gatchaman, Move Out!', where: 'หัวล่าง' },
];

// Black Friday double-EXP weekends, Thai time (notice: Fri 00:00 - Sun 23:59 UTC+0).
const ROUNDS = [
  ['1', 'ศุกร์ 30 ต.ค. 07:00', 'จันทร์ 2 พ.ย. 06:59'],
  ['2', 'ศุกร์ 6 พ.ย. 07:00', 'จันทร์ 9 พ.ย. 06:59'],
  ['3', 'ศุกร์ 13 พ.ย. 07:00', 'จันทร์ 16 พ.ย. 06:59'],
  ['4', 'ศุกร์ 20 พ.ย. 07:00', 'จันทร์ 23 พ.ย. 06:59'],
  ['5', 'ศุกร์ 27 พ.ย. 07:00', 'จันทร์ 30 พ.ย. 06:59'],
];

const GHOSTLY = [
  { id: 31123, name: 'Ghostring Tall Hat', where: 'หัวบน' },
  { id: 31669, name: 'Enhanced Whisper Mask', where: 'หัวกลาง' },
  { id: 420078, name: 'Ghost Bat', where: 'หัวล่าง' },
  { id: 480473, name: "Fallen Bishop Hibram's Evil Spirit", where: 'ผ้าคลุม' },
  { id: 20547, name: "Whisper's Blessing", where: 'ผ้าคลุม' },
];

export default function Events202611() {
  const over = Date.now() > Date.parse(ENDS);
  return (
    <main className="shell evpage" style={{ paddingBlock: 28 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'กิจกรรม Gatchaman · Black Friday', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({ path: PATH, headline: String(metadata.title), description: String(metadata.description), datePublished: PUBLISHED, dateModified: MODIFIED })}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/news/patch-2026-10-29">แพทช์ 29 ต.ค.</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">Gatchaman · Black Friday</span>
      </nav>

      <header className="evhero">
        <p className="evhero__kicker">EVENT · 2 กิจกรรม</p>
        <h1 className="pagehead__title">Gatchaman บุก Morocc · Black Friday EXP x2</h1>
        <p className="evhero__date">
          {over ? <span className="tag tag--unknown">จบแล้ว</span> : <span className="evhero__live">กำลังจัด</span>} 29 ต.ค. หลังปิดปรับปรุง – ปิดปรับปรุง 26 พ.ย.
        </p>
        <ul className="evtiles">
          <li><a href="#gatchaman"><img src={`${IMG}/ken.png`} alt="" width={36} /><span>Gatchaman Collab</span><small>เควสที่ Morocc · แลกการ์ดและคอสตูม</small></a></li>
          <li><a href="#exp"><img src={ico(105671)} alt="" width={32} /><span>Black Friday EXP x2</span><small>ทุกเสาร์อาทิตย์ 5 รอบ</small></a></li>
          <li><a href="#ghostly"><img src={ico(108434)} alt="" width={32} /><span>คอสตูมผี Ghostly</span><small>Kafra Shop ถึง 23 พ.ย.</small></a></li>
        </ul>
        <p className="muted evhero__src">
          ขั้นตอนเควสและพิกัดมาจากบันทึกเควสกับไฟล์นำทางในไคลเอนต์แพทช์ 29 ต.ค. · รางวัล ราคา และวันจากประกาศทางการ · รูปจากไฟล์เกม
        </p>
      </header>

      {/* ---------------- Gatchaman ---------------- */}
      <section id="gatchaman" className="evsec evsec--cyan">
        <p className="evsec__tag">EVENT 01 · COLLAB</p>
        <h2 className="evsec__title">Science Ninja Team Gatchaman × Ragnarok Zero</h2>
        <p className="evsec__lead">
          รอยแยกปริศนาเปิดขึ้นที่ Morocc คนแปลกหน้ากับมอนแปลก ๆ โผล่ออกมาทุกคืน ทีมนินจาวิทยาศาสตร์ Gatchaman ทั้ง 5 คนหลุดมาจากโลกอื่น
          ช่วยพวกเขาสู้กองทัพ Galactor ของ Berg Katse และสร้าง Mid Missile เพื่อกลับบ้าน · เลเวล 10 ขึ้นไป
        </p>
        <div className="evnpcs">
          <Npc img="ken" name="Ken" navi="morocc 29/193" />
          <Npc img="joe" name="Joe (ร้านแลกของ)" navi="morocc 34/192" />
          <Npc img="jun" name="Jun (เควสรายวัน)" navi="morocc 32/194" />
          <Npc img="jinpei" name="Jinpei" navi="morocc 129/270" w={56} />
          <Npc img="ryu" name="Ryu" navi="morocc 173/35" />
          <Npc img="berg-katse" name="Berg Katse" navi="morocc 22/188" w={70} />
        </div>

        <h3 className="evh">เควสหลัก Visitors from Another World (ทำครั้งเดียว)</h3>
        <ol className="evsteps">
          <li>คุย <b>Morroc Resident</b> (morocc 248/178) เรื่องรอยแยกที่โผล่ในเมือง</li>
          <li>ถามคนที่เห็นเหตุการณ์ต่อ: <b>Villager</b> ร้านทางใต้ (morocc 202/101) → <b>Weapon Deliveryman</b> แถวร้านอาวุธ (morocc 259/65) → <b>Water Quality Inspector</b> กลางเมือง (morocc 170/139)</li>
          <li>ไปดูคนแต่งตัวแปลก ๆ ที่ประตูเหนือ (morocc 129/270) เจอ <b>Jinpei</b> ที่หิวมาก พาไปหาของกินที่ร้านอาหาร (morocc 54/249)</li>
          <li><b>Ryu</b> ได้ข่าวว่ามีคนชุดขาวออกไปทางประตูใต้ ตามไป (morocc 173/35) แล้วสืบมอนแปลก ๆ นอกเมือง</li>
          <li>ล่า Galaring และ Squid Bomb แถว Morocc <b>อย่างละประมาณ 3 ตัว</b> แล้วกลับเข้าเมือง</li>
          <li><b>Ken</b> อยากรู้สถานการณ์ ไปถามทีมสำรวจ <b>[Emergency] Anomalous Rift Investigation Team</b> (morocc 196/261)</li>
          <li>ไปดูรอยแยกกับยาม (morocc 296/175) เจอทหาร Galactor แอบดูอยู่ ตามไปจนเห็น <b>Berg Katse</b> คุยอยู่หน้ารอยแยกลับ (morocc 22/188)</li>
          <li>รอ Berg Katse ไปแล้วทำให้รอยแยกนิ่ง เข้าไปสำรวจข้างใน (เป็นดันเจี้ยนความทรงจำ ระบบนำทางอาจใช้ไม่ได้ข้างใน)</li>
          <li>กลับไปคุย <b>Ken</b> (morocc 29/193) แล้วช่วยทีมสร้าง Mid Missile: ล่า Galaring และ Squid Bomb <b>อย่างละ 5 ตัว</b> เก็บ:</li>
        </ol>
        <ul className="evmats">{[{ id: 1002381, name: 'Mid Powder', qty: 5 }].map(item)}</ul>
        <p className="evnote">Mid Powder ดรอปจากลูกน้อง Galactor (Galaring, Squid Bomb) · หายเมื่ออีเวนต์จบ</p>

        <h3 className="evh">มอนของอีเวนต์</h3>
        <div className="ev11-mobs">
          <Mob img="galaring" name="Galaring" note="ทุ่งรอบ Morocc" />
          <Mob img="squid-bomb" name="Squid Bomb" note="ทุ่งรอบ Morocc" w={50} />
          <Mob img="mutant-galaring" name="Mutant Galaring" note="ในรอยแยก (เควส Berg Katse)" w={80} />
        </div>
        <p className="evnote">
          เกิดที่ moc_fild01, 02, 03, 11, 12, 13, 16, 17, 18 ตามไฟล์นำทางของเกม · ยังไม่มีเลเวลและค่าพลังในฐานข้อมูล
        </p>

        <h3 className="evh">เควสรายวัน (หลังจบเควสหลัก · กับ Jun)</h3>
        <div className="ev11-dailies">
          <div className="evdaily">
            <img src={ico(1002381)} alt="" width={32} height={32} />
            <div><b>Launch! Mid Missile!</b><p className="evsmall">เก็บ Mid Powder 10 ชิ้น</p></div>
            <span className="ev11-get">ปุ่ม ×1</span>
          </div>
          <div className="evdaily">
            <img src={`${IMG}/galaring.png`} alt="" width={40} />
            <div><b>All right! I&apos;ll smash them all.</b><p className="evsmall">ล่า Galaring 10 ตัว</p></div>
            <span className="ev11-get">ปุ่ม ×1</span>
          </div>
          <div className="evdaily">
            <img src={`${IMG}/squid-bomb.png`} alt="" width={36} />
            <div><b>Galactor&apos;s monster won&apos;t make it back to base.</b><p className="evsmall">ล่า Squid Bomb 10 ตัว</p></div>
            <span className="ev11-get">ปุ่ม ×1</span>
          </div>
          <div className="evdaily">
            <img src={`${IMG}/mutant-galaring.png`} alt="" width={44} />
            <div><b>Prepare Yourself, Berg Katse!</b><p className="evsmall">เข้ารอยแยกที่ Berg Katse ซ่อมไว้ (morocc 29/193) ล้ม Mutant Galaring</p></div>
            <span className="ev11-get">ปุ่ม ×2</span>
          </div>
          <div className="evdaily">
            <img src={`${IMG}/joe.png`} alt="" width={30} />
            <div><b>Please, I&apos;m Begging You!</b><p className="evsmall">ตามหา Joe ที่หายไป · ขึ้นแบบสุ่มบางวัน (morocc 34/192)</p></div>
            <span className="ev11-get">ปุ่ม ×1</span>
          </div>
        </div>
        <div className="evreward">
          <span className="evreward__tag">DAILY</span>{' '}
          <Link href="/database/items/1002382">Mid Missile Button</Link> ตามจำนวนข้างบน (ตามประกาศ) · รีเซ็ตทุกวัน 04:00 ตามที่เกมเขียน · ปุ่มหายเมื่ออีเวนต์จบ
        </div>

        <h3 className="evh">Let&apos;s Go! Gatchaman! แลกของที่ Joe</h3>
        <div className="ev11-where"><NaviCopy cmd="/navi morocc 34/192" /></div>
        <div className="ev11-shop">
          {SHOP.map((s) => (
            <Link key={s.id} href={s.costume ? `/database/costumes/${s.id}` : `/database/items/${s.id}`} className="ev11-shopit">
              <img src={ico(s.id)} alt="" width={28} height={28} loading="lazy" />
              <span><b>{s.name}</b><small>{s.fx}</small></span>
              <em>{s.cost}</em>
            </Link>
          ))}
        </div>
        <p className="evnote">
          ตัวเลขขวาคือจำนวน Mid Missile Button ที่ใช้ · การ์ด 3 ใบได้ค่าหลักกับ DEF +3 MDEF +1 ทุก 10 Base Lv นับถึง Lv 50 ·
          ช่วงอีเวนต์การ์ดได้เพิ่ม: ดาเมจกายภาพ/เวทใส่มอนทุกเผ่า +10% (ไม่รวมผู้เล่น) ทุกขนาด +10% EXP +15% ดรอป +7% · <b>ค่าช่วงอีเวนต์หายเมื่ออีเวนต์จบ</b> ·
          ขนนก 4 แบบหายเมื่ออีเวนต์จบ
        </p>

        <h3 className="evh">แพ็กเกจคอสตูมใน Kafra Shop (จำกัดบัญชีละ 5)</h3>
        <div className="evshop">
          <div>
            <Link href="/database/items/200831"><b>Gatchaman Collaboration Package I</b></Link> · 35,000 KP
            <p>Selection Scroll I · Zelstar ×50 · World Teleport Ticket ×50 · Enriched Elunium ×20 · Growth Elixir ×5</p>
          </div>
          <div>
            <Link href="/database/items/200832"><b>Gatchaman Collaboration Package II</b></Link> · 35,000 KP
            <p>Selection Scroll II · Zelstar ×50 · World Teleport Ticket ×50 · Enriched Oridecon ×20 · Bubble Gum ×10</p>
          </div>
        </div>
        <div className="ev11-two">
          <div>
            <p className="ev11-k">Scroll I · เลือก 1 · หัวบน+กลาง</p>
            <ul className="ev11-costumes">
              {SCROLL_1.map((c) => (
                <li key={c.id}><Link href={`/database/costumes/${c.id}`}><img src={ico(c.id)} alt="" width={24} height={24} loading="lazy" />{c.name}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <p className="ev11-k">Scroll II · เลือก 1</p>
            <ul className="ev11-costumes">
              {SCROLL_2.map((c) => (
                <li key={c.id}><Link href={`/database/costumes/${c.id}`}><img src={ico(c.id)} alt="" width={24} height={24} loading="lazy" />{c.name} <small>{c.where}</small></Link></li>
              ))}
              <li><Link href="/database/items/1002642"><img src={ico(1002642)} alt="" width={24} height={24} loading="lazy" />Operation Firebird Footprints <small>เอ็นชานต์ช่อง 4 ผ้าคลุมคอสตูม</small></Link></li>
            </ul>
          </div>
        </div>
        <p className="evnote">
          ประกาศขัดกันเอง: Scroll I เขียนว่าเลือก 1 จาก 6 แต่ลิสต์ 5 ชิ้น · Scroll II เขียนว่า 1 จาก 2 แต่ลิสต์ 5 ชิ้น ·
          ไฟล์เกมเขียนว่าทั้งสองม้วนเลือกได้ 1 จาก 5 · คอสตูมคอลแลบมีออปชันช่วงอีเวนต์ EXP +5% (บางชิ้นดรอป +5%) หายเมื่ออีเวนต์จบ
        </p>
      </section>

      {/* ---------------- Black Friday ---------------- */}
      <section id="exp" className="evsec evsec--yellow">
        <p className="evsec__tag">EVENT 02</p>
        <h2 className="evsec__title">Black Friday: EXP x2 ทุกเสาร์อาทิตย์</h2>
        <p className="evsec__lead">
          ช่วงสุดสัปดาห์ได้ <b>EXP +100%</b> ดรอปไอเทม <b>+20%</b> และตายเสีย EXP น้อยลง <b>50%</b> ได้เองทุกตัวละคร ไม่ต้องกดรับ
        </p>
        <table className="stat-table ev11-table">
          <thead><tr><th>รอบ</th><th>เริ่ม (เวลาไทย)</th><th>จบ</th></tr></thead>
          <tbody>
            {ROUNDS.map(([n, from, to]) => (
              <tr key={n}><td className="num">{n}</td><td>{from}</td><td>{to}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="evnote">ประกาศเขียนเป็น UTC+0 (ศุกร์ 00:00 ถึงอาทิตย์ 23:59) เว็บนี้บวก 7 ชั่วโมง · ประกาศบอกว่าตารางเปลี่ยนได้โดยไม่แจ้งล่วงหน้า</p>

        <h3 className="evh" id="ghostly" style={{ scrollMarginTop: 90 }}>คอสตูมผี Ghostly (Kafra Shop ถึงปิดปรับปรุง 23 พ.ย.)</h3>
        <div className="evshop">
          <div>
            <Link href="/database/items/201154"><b>Ghostly Scroll Box</b></Link> · 350 KP
            <p>Ghostly Scroll ×1 · เซิร์ฟ Asia</p>
          </div>
          <div>
            <Link href="/database/items/201155"><b>Ghostly Scroll 10 Box</b></Link> · 3,500 KP
            <p>Ghostly Scroll ×10 · เซิร์ฟ Asia</p>
          </div>
        </div>
        <p className="evsmall">
          <Link href="/database/items/108434"><b>Ghostly Scroll</b></Link> เปิดแล้วสุ่มได้ 1 อย่าง: คอสตูม 5 ชิ้นข้างล่าง · Mileage Ticket · Giant Fly Wing 100 อัน ·
          Special Buff Selection Box · Small Mana Potion ×2 · Token of Siegfried · Small Healing Potion ×3 · Life Insurance · ประกาศไม่บอกโอกาส ·
          เซิร์ฟ EU ขายเป็นกล่องเลือกเอง (15,000 / 35,000 KP)
        </p>
        <ul className="ev11-ghost">
          {GHOSTLY.map((g) => (
            <li key={g.id}>
              <Link href={`/database/costumes/${g.id}`}>
                {NO_ICON.has(g.id) ? <span className="ev11-noicon" aria-hidden="true" /> : <img src={ico(g.id)} alt="" width={28} height={28} loading="lazy" />}
                <span><b>{g.name}</b><small>{g.where}</small></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="evnote">หลังอีเวนต์จบ คอสตูมพวกนี้ผูกบัญชีได้ (ขายต่อไม่ได้) เพื่อให้เอ็นชานต์ได้</p>
      </section>

      <p className="source-note" style={{ marginTop: 24 }}>
        <strong>ที่มา:</strong> ประกาศทางการ roz.mygnjoy.com &ldquo;[Collaboration Event] Science Ninja Team Gatchaman Arrives in Ragnarok Zero: Global!&rdquo;
        และ &ldquo;Black Friday Event&rdquo; (29 ต.ค. 2569) · บันทึกเควส ไฟล์นำทาง คำอธิบายไอเทม และรูปจากไคลเอนต์แพทช์ 29 ต.ค. ·
        หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ · Gatchaman © Tatsunoko Production
      </p>
      <p className="muted" style={{ marginTop: 12 }}>
        ดูสรุปแพทช์ทั้งหมด: <Link href="/news/patch-2026-10-29">แพทช์ 29 ต.ค. 2569 (Clock Tower)</Link>
      </p>
    </main>
  );
}

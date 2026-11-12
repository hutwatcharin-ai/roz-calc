// app/news/patch-2026-11-12/page.tsx
//
// The 12 Nov 2026 patch (Base level 80). Written the day before from the
// Discord notices, then rebuilt on 12 Nov from the official site (owner, 12
// Nov: read it, every time): Update Notice 189 (eight images: level 80, the two
// dungeon areas, Ant Hell memorial with its NPC and /navi, Level 70 memorial
// gear, Hunting Season, Blacksmith's Blessing exchange, Reset Cat, EXP table),
// notice 192 (maintenance done 01:00-04:45 UTC, eight bug fixes) and the Game
// Guide's Character Level table. The patched client (GrfDiffTool snapshot
// 2026-11-12) fills in what the notices leave out: navi_mob gives every new
// floor's monsters and counts, new items name the hunting-event tokens and the
// SEA Light gacha boxes. Those lines carry a small "from the game files" tag.
//
// Laid out like /news/events-2026-10 (owner's favourite): one coloured section
// per thing a player can do, numbered steps, NPC picture with a copyable
// /navi, item icons, a REWARD box -- and a "before it ends" strip on top,
// because three of these run out on a date.
import '../patch-2026-10-01/page.css';
import '../events-2026-10/page.css';
import './page.css';
import NaviCopy from '@/components/NaviCopy';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

const PATH = '/news/patch-2026-11-12';
const PUBLISHED = '2026-11-11T16:00:00+07:00';
const MODIFIED = '2026-11-12T16:00:00+07:00';
const IMG = '/images/events/2026-11-12';

export const metadata: Metadata = {
  title: 'แพทช์ 12 พ.ย. 2569 Ragnarok Zero — เลเวลตัน 80, Ant Hell Memorial, ดันใหม่ Karu และ Izlude ใต้น้ำ 4–5',
  description:
    'Ragnarok Zero Global แพทช์ 12 พฤศจิกายน 2569 (ปิดปรับปรุง 08:00–11:45 น.): เลเวลตัน Base 80, ตาราง EXP ใหม่, Memorial Dungeon Ant Hell ทางเข้า /navi prt_fild06 37/197, อุปกรณ์ Memorial Lv 70, ดันใหม่ Western Cave Karu และ Izlude Undersea Cave ชั้น 4–5, Hunting Season Hode/Orc Warrior, แลก Blacksmith Blessing, Reset Cat รีเซ็ตฟรี 12–15 พ.ย.',
};

type Mob = { id: number; name: string; n?: number };
type Mat = { id: number; name: string; qty?: number | string; ext?: 'gif' | 'png' };

const DUNGEONS: { code: string; name: string; th: string; mobs: Mob[] }[] = [
  {
    code: 'beach_dun',
    name: 'Western Cave Karu',
    th: 'ถ้ำตะวันตก Karu · Comodo',
    mobs: [
      { id: 1148, name: 'Medusa', n: 60 },
      { id: 1255, name: 'Nereid', n: 20 },
      { id: 1256, name: 'Pest', n: 20 },
    ],
  },
  {
    code: 'iz_dun03',
    name: 'Izlude Undersea Cave 4F',
    th: 'ถ้ำใต้น้ำ Izlude ชั้น 4 · ต่อจากชั้น 3',
    mobs: [
      { id: 1158, name: 'Phen', n: 45 },
      { id: 1045, name: 'Marc', n: 40 },
      { id: 1069, name: 'Swordfish', n: 40 },
      { id: 1068, name: 'Hydra', n: 30 },
      { id: 1142, name: 'Marine Sphere', n: 20 },
    ],
  },
  {
    code: 'iz_dun04',
    name: 'Izlude Undersea Cave 5F',
    th: 'ถ้ำใต้น้ำ Izlude ชั้น 5 · ต่อจากชั้น 4',
    mobs: [
      { id: 1264, name: 'Merman', n: 61 },
      { id: 1065, name: 'Strouf', n: 58 },
      { id: 1068, name: 'Hydra', n: 18 },
      { id: 1069, name: 'Swordfish', n: 11 },
      { id: 1142, name: 'Marine Sphere', n: 11 },
      { id: 1108, name: 'Deviace', n: 3 },
    ],
  },
];

function MobList({ mobs }: { mobs: Mob[] }) {
  return (
    <ul className="pmobs">
      {mobs.map((m) => (
        <li key={m.id}>
          <Link href={`/database/monsters/${m.id}`} className="pmob">
            <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
            <span className="pmob__name">{m.name}</span>
            {m.n != null && <span className="pmob__meta">×{m.n}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

function Mats({ items }: { items: Mat[] }) {
  return (
    <ul className="evmats">
      {items.map((m) => (
        <li key={m.id}>
          <Link href={`/database/items/${m.id}`} className="evmat">
            <img src={`/images/items/${m.id}.${m.ext ?? 'gif'}`} alt="" width={24} height={24} loading="lazy" />
            <span>{m.name}</span>
            {m.qty != null && <b>×{m.qty}</b>}
          </Link>
        </li>
      ))}
    </ul>
  );
}

const Tag = () => <span className="unverified">จากไฟล์เกม</span>;

const JUMPS: { href: string; img: string; label: string; sub: string }[] = [
  { href: '#reset-cat', img: '/images/items/6635.gif', label: 'Reset Cat', sub: 'รีเซ็ตฟรี ถึง 15 พ.ย.' },
  { href: '#ant-hell', img: '/images/monsters/1147.gif', label: 'Ant Hell Memorial', sub: 'ดันใหม่ Lv 70' },
  { href: '#hunting', img: '/images/monsters/1127.gif', label: 'Hunting Season', sub: 'ถึง 26 พ.ย.' },
  { href: '#blessing', img: '/images/items/1002357.gif', label: 'แลก Blessing', sub: 'สัปดาห์ละครั้ง ถึง 26 พ.ย.' },
  { href: '#dungeons', img: '/images/monsters/1264.gif', label: 'ดันใหม่ 3 ชั้น', sub: 'Karu · Izlude 4–5' },
  { href: '#level', img: '/images/items/15221.gif', label: 'เลเวล 80 + EXP', sub: 'ตาราง EXP ใหม่' },
];

export default function Patch20261112() {
  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'แพทช์ 12 พ.ย.', path: PATH },
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
        <span className="crumbs__here">แพทช์ 12 พ.ย.</span>
      </nav>

      <header className="evhero">
        <p className="evhero__kicker">PATCH · 12 NOV 2026</p>
        <h1 className="evsec__title" style={{ marginTop: 0 }}>แพทช์ 12 พ.ย. · เลเวลตัน 80</h1>
        <p className="evhero__date">
          <span className="evhero__live">LIVE</span>
          ปิดปรับปรุง 08:00–11:45 น. เซิร์ฟเปิดแล้ว · Base Level สูงสุด 80 (Job ยัง 70)
        </p>
        <ul className="evtiles">
          {JUMPS.map((j) => (
            <li key={j.href}>
              <a href={j.href}>
                <img src={j.img} alt="" loading="lazy" />
                <span>{j.label}</span>
                <small>{j.sub}</small>
              </a>
            </li>
          ))}
        </ul>
      </header>

      <section className="pdeadline" aria-label="ของที่มีวันหมด">
        <h2 className="pdeadline__h">ทำก่อนหมดเวลา</h2>
        <ol className="pdeadline__list">
          <li><time>15 พ.ย.</time><span><a href="#reset-cat">Reset Cat</a> รีเซ็ตสเตตัสและสกิลฟรี</span></li>
          <li><time>26 พ.ย.</time><span><a href="#hunting">Hunting Season</a> เก็บการ์ด Hode / Orc Warrior</span></li>
          <li><time>26 พ.ย.</time><span><a href="#blessing">แลก Blacksmith Blessing</a> สัปดาห์ละ 1 ขวด</span></li>
        </ol>
        <p className="pdeadline__note">วันตามประกาศ (เวลา UTC) · ประกาศไม่บอกชั่วโมงที่จบ</p>
      </section>

      {/* ---------------- Reset Cat ---------------- */}
      <section id="reset-cat" className="evsec evsec--pink">
        <p className="evsec__tag">EVENT · 12–15 NOV</p>
        <h2 className="evsec__title">Reset Cat กลับมา: รีเซ็ตฟรี</h2>
        <p className="evsec__lead">มาให้ทันเลเวลตัน 80 · รีเซ็ตสเตตัสและสกิลได้ฟรี ไม่เสีย Zelstar</p>
        <ol className="evsteps">
          <li>ไป Payon <NaviCopy cmd="/navi payon 165/49" /></li>
          <li>คุยกับ Reset Cat เลือกรีเซ็ตสเตตัสหรือสกิล</li>
        </ol>
        <p className="evnote">
          ปกติรีเซ็ตฟรีถึง Lv 40 เกินจากนั้นเสีย Zelstar (<Link href="/guides/social">ค่ารีเซ็ต</Link>) ·
          วางแผนก่อนรีเซ็ตที่ <Link href="/tools/build">ตัวจัดบิลด์</Link> กับ <Link href="/tools/skill-planner">วางแผนสกิล</Link>
        </p>
      </section>

      {/* ---------------- Ant Hell ---------------- */}
      <section id="ant-hell" className="evsec evsec--yellow">
        <p className="evsec__tag">MEMORIAL DUNGEON · LV 70</p>
        <h2 className="evsec__title">Ant Hell Memorial</h2>
        <p className="evsec__lead">
          <b>ทางเข้าอยู่ Prontera Field ไม่ใช่ในดัน Ant Hell เดิม</b> · เข้าเป็นปาร์ตี้ Base Lv 70 ขึ้นไป
        </p>
        <div className="pnpc">
          <figure className="evnpc">
            <span className="evnpc__art"><img src={`${IMG}/memorial-member.png`} alt="Memorial Association Member" width={42} loading="lazy" /></span>
            <figcaption>
              <strong>Memorial Association Member</strong>
              <NaviCopy cmd="/navi prt_fild06 37/197" />
            </figcaption>
          </figure>
        </div>

        <h3 className="evh">วิธีเล่น</h3>
        <ol className="evsteps">
          <li>คุย Memorial Association Member แล้วเข้าวาร์ปข้าง NPC</li>
          <li>อุดบ่อพิษให้ครบ (จุดแดงบนแผนที่) ระหว่างทางเจอ Cannibal Deniro, Vitata, Andre, Pierre</li>
          <li>สู้บอส <b>Cannibal Maya</b></li>
        </ol>
        <table className="stat-table pboss">
          <tbody>
            <tr><td>บอส</td><td>Cannibal Maya · Lv 70</td></tr>
            <tr><td>HP</td><td className="num">2,200,000</td></tr>
            <tr><td>DEF / MDEF</td><td className="num">183 / 50</td></tr>
            <tr><td>ประเภท</td><td>แมลง ขนาดใหญ่ ธาตุดิน 4 → ใช้อาวุธธาตุลม</td></tr>
          </tbody>
        </table>

        <div className="evreward">
          <span className="evreward__tag">REWARD</span> หีบธรรมดา
          <Mats items={[
            { id: 25424, name: 'Faintly Glowing Crystal' },
            { id: 25475, name: 'Crystal of Blue Light' },
            { id: 23649, name: 'Jellopy Fragment Box' },
          ]} />
          <span className="evreward__tag">REWARD</span> หีบโหด
          <Mats items={[
            { id: 28571, name: 'Red Oath Ring' },
            { id: 25460, name: 'Ruby Soaked in Blood' },
            { id: 25424, name: 'Faintly Glowing Crystal' },
          ]} />
          <span className="evsmall">+ แร่ Mithril / Elunium / Oridecon และหินธาตุ</span>
        </div>
        <p className="evnote">
          ทางเข้าจากประกาศทางการ · วิธีเล่น บอส และของรางวัลจากไกด์ผู้เล่นก่อนเปิดบน Global ยังไม่ได้เช็กในเกม ·{' '}
          <Link href="/guides/memorial-dungeons">ดันเจี้ยนความทรงจำทั้งหมด</Link>
        </p>

        <h3 className="evh">อุปกรณ์ Memorial Lv 70 (Expedition)</h3>
        <Mats items={[{ id: 15221, name: "Expedition's Armor" }, { id: 29405, name: 'Crusader Essence Lv.1' }]} />
        <ul className="evsteps" style={{ listStyle: 'disc' }}>
          <li>อัปจากชุด Subjugation (Lv 60) ด้วย <b>Faintly Glowing Crystal ×50</b> + Jellostone · อัปแล้วขั้นตีบวก การ์ด เอนแชนต์ของชิ้นเดิมหาย</li>
          <li><b>เสื้อ Expedition ตี +9 เอนแชนต์ได้ Essence อาชีพ 2</b> · เห็นในเกมแล้ว 12 พ.ย. (<Link href="/tools/enchant#essence">Essence ทุกอาชีพ</Link>)</li>
          <li>เซ็ต 4 ชิ้นสายกายภาพ ATK +20 · ตีบวกรวม 21 ขึ้นไป ASPD +5% ลดเวลาร่ายแบบคงที่ 5%</li>
        </ul>
        <p className="evnote">
          <Link href="/guides/memorial-gear">อุปกรณ์ Memorial ทุกแรงค์</Link> · แรงค์ II (Lv 80) ยังไม่ประกาศ
        </p>
      </section>

      {/* ---------------- Hunting Season ---------------- */}
      <section id="hunting" className="evsec evsec--cyan">
        <p className="evsec__tag">EVENT · 12–26 NOV</p>
        <h2 className="evsec__title">Hunting Season: Hode และ Orc Warrior</h2>
        <p className="evsec__lead">
          สองตัวนี้เกิดถี่ขึ้น · เก็บการ์ดไว้แลกคอสตูมพิเศษ · ประกาศบอกให้เตรียมรับ <b>Phreeoni กับ Maya</b>
        </p>
        <div className="evdaily">
          <div className="evmob">
            <img src="/images/monsters/1127.gif" alt="" loading="lazy" />
            <span><Link href="/database/monsters/1127"><b>Hode</b></Link> Lv 81 ธาตุดิน<br /><small>Sograt Desert · <Link href="/database/maps/moc_fild16">moc_fild16</Link> / <Link href="/database/maps/moc_fild17">17</Link></small></span>
          </div>
          <div className="evmob">
            <img src="/images/monsters/1023.gif" alt="" loading="lazy" />
            <span><Link href="/database/monsters/1023"><b>Orc Warrior</b></Link> Lv 52 ธาตุดิน<br /><small>Orc Village · <Link href="/database/maps/gef_fild10">gef_fild10</Link></small></span>
          </div>
        </div>
        <h3 className="evh">ของแลก <Tag /></h3>
        <Mats items={[
          { id: 1003364, name: '[Event] Warrior Token', ext: 'png' },
          { id: 1003365, name: '[Event] Insect Token', ext: 'png' },
        ]} />
        <p className="evsmall">ได้จากการแลกการ์ด ใช้แลก Costume · หายเมื่อจบอีเวนต์</p>
        <p className="evnote">
          ทั้งสองตัวธาตุดิน ใช้อาวุธธาตุลม · กติกาแลกและรายการคอสตูม ทีมงานจะลงประกาศแยก (ยังไม่ออก)
        </p>
      </section>

      {/* ---------------- Blacksmith's Blessing ---------------- */}
      <section id="blessing" className="evsec evsec--pink">
        <p className="evsec__tag">EVENT · 12–26 NOV</p>
        <h2 className="evsec__title">แลก Blacksmith Blessing</h2>
        <p className="evsec__lead">ของกันอุปกรณ์แตกหรือลดขั้นตอนตีบวก +7 ขึ้นไป · อีกทางนอกจากกล่อง MVP Raid</p>
        <div className="pswap">
          <Mats items={[{ id: 1002357, name: 'Blacksmith Blessing Powder', qty: 100 }]} />
          <span className="pswap__plus">+ 1,000,000 Zeny</span>
          <span className="pswap__arrow" aria-hidden="true">→</span>
          <Mats items={[{ id: 6635, name: 'Blacksmith Blessing', qty: 1 }]} />
        </div>
        <div className="evreward">
          <span className="evreward__tag">LIMIT</span> สัปดาห์ละครั้ง ต่อตัวละคร · ถึง 26 พ.ย.
        </div>
        <p className="evnote">
          NPC ที่แลก ทีมงานจะบอกในประกาศแยก · <Link href="/guides/mvp">ไกด์ MVP</Link> · <Link href="/tools/refine">ตีบวก</Link>
        </p>
      </section>

      {/* ---------------- Dungeons ---------------- */}
      <section id="dungeons" className="evsec evsec--cyan">
        <p className="evsec__tag">NEW AREA</p>
        <h2 className="evsec__title">ดันเจี้ยนใหม่ 3 ชั้น</h2>
        <p className="evsec__lead">Western Cave Karu ที่ Comodo กับ Izlude Undersea Cave ชั้น 4 และ 5</p>
        <div className="pdungeons">
          {DUNGEONS.map((d) => (
            <div key={d.code} className="pdungeon">
              <h3 className="evh" style={{ marginTop: 0 }}>
                <Link href={`/database/maps/${d.code}`}>{d.name}</Link>
              </h3>
              <p className="evsmall">{d.th}</p>
              <MobList mobs={d.mobs} />
            </div>
          ))}
        </div>
        <p className="evnote">
          <Tag /> มอนและจำนวนจากไคลเอนต์ 12 พ.ย. ไม่รวม Knight Poring ที่ออกทุกแมพและมอน Challenge ·
          มอนใน Karu เลเวล 89–102 สูงกว่าเลเวลตัน · Strouf กับ Merman ธาตุน้ำ 3 ใช้ธาตุลม
        </p>
      </section>

      {/* ---------------- Level and EXP ---------------- */}
      <section id="level" className="evsec evsec--yellow">
        <p className="evsec__tag">LEVEL 80</p>
        <h2 className="evsec__title">เลเวลตัน 80 และ EXP ใหม่</h2>
        <ul className="evsteps" style={{ listStyle: 'disc' }}>
          <li>Base Level สูงสุด <b>80</b> · Job Level ยังตันที่ 70</li>
          <li>เควสรายวันขั้นใหม่สำหรับ Lv 80 (ประกาศยังไม่บอก NPC)</li>
          <li>EXP เลเวล 2–70 ลดลงมาก เช่น แถบ 49 → 50 จาก 14,834,800 เหลือ <b>1,506,000</b></li>
        </ul>
        <h3 className="evh">EXP กระโดดทุก 10 เลเวลหลัง 50</h3>
        <table className="stat-table pexp">
          <tbody>
            <tr><td>Lv 50 → 51</td><td className="num">1,731,900</td></tr>
            <tr><td>Lv 51 → 52</td><td className="num">8,659,500 <small>×5</small></td></tr>
            <tr><td>Lv 61 → 62</td><td className="num">81,671,600 <small>×4</small></td></tr>
            <tr><td>Lv 71 → 72</td><td className="num">577,729,800 <small>×3</small></td></tr>
            <tr><td>Lv 79 → 80</td><td className="num">853,569,600</td></tr>
          </tbody>
        </table>
        <div className="evreward">
          <span className="evreward__tag">สรุป</span> 70 → 80 ใช้ราว 6,560 ล้าน EXP · ราว 5 เท่าของ 1 → 70 ทั้งหมด ·
          ลด EXP 2–70 ช่วยคนตามหลัง ไม่ได้ทำให้ตัน 80 ง่ายขึ้น
        </div>
        <p className="evnote">
          <Link href="/guides/exp">ตาราง EXP ทุกเลเวล + ตัวคำนวณ</Link> (มี Job EXP อาชีพ 2 ถึง 70 แล้ว) ·
          เครื่องมือในเว็บขยับเพดานเป็น 80 แล้ว
        </p>
      </section>

      {/* ---------------- Shop and fixes ---------------- */}
      <section id="shop" className="evsec evsec--pink">
        <p className="evsec__tag">KAFRA SHOP · BUG FIX</p>
        <h2 className="evsec__title">ร้านและบั๊กที่แก้</h2>
        <h3 className="evh" style={{ marginTop: 6 }}>Light Gacha Scroll (เซิร์ฟ SEA) <Tag /></h3>
        <div className="evshop">
          <div>
            <b>Special Light Costume Box</b>
            <Mats items={[{ id: 31143, name: 'Krathong Crown', ext: 'png' }, { id: 19817, name: 'Ifrit’s Breath', ext: 'png' }]} />
            <p>เลือกได้ 1 ชิ้น</p>
          </div>
          <div>
            <b>Premium Light Costume Box</b>
            <p>เลือก 1 ชิ้น: Sky Lantern, Katashiro Flying หรือ Leaf Umbrella</p>
          </div>
        </div>
        <p className="evnote">
          <Link href="/database/items/108534">Light Scroll</Link> ขายเป็นกล่องเดี่ยวและกล่องสิบ · ยังไม่รู้ราคาและอัตราสุ่ม · เซิร์ฟ EU ได้ Costume Package แทน ·{' '}
          <Link href="/database/cash-shop">ร้าน Kafra</Link>
        </p>

        <details className="pfixes">
          <summary>บั๊กที่แก้รอบนี้ 8 ข้อ</summary>
          <ul>
            <li><b>การ์ด Orc Lady</b> เพิ่มดาเมจไม่ติดกับ Orc บางตัว</li>
            <li>หน้าต่างสเตตัสเขียน ATK ผิดเป็น P. ATK</li>
            <li>อุปกรณ์โชว์ไอคอนช่องการ์ดผิด</li>
            <li>มอนใน Clock Tower 4F เกิดใหม่แล้วค้าง</li>
            <li>ของดรอปตกในจุดที่เดินไปเก็บไม่ได้</li>
            <li>ประกาศบอส Raid ไม่บอกชื่อบอส</li>
            <li>จำนวนมอนในหน้าต่าง Navigation แสดงผิด</li>
            <li>คำอธิบายสกิล Sight ชัดขึ้น</li>
          </ul>
        </details>
      </section>

      <section id="ongoing" className="ct-ch" style={{ marginTop: 28 }}>
        <Link href="/news/events-2026-11" className="pevents">
          <span className="pevents__tag">ถึง 26 พ.ย.</span>
          <span className="pevents__body">
            <strong>ยังเล่นได้ต่อ: Gatchaman · Black Friday EXP x2</strong>
            <small>เควสคอลแลบที่ Morocc · EXP x2 ดรอป +20% ทุกเสาร์อาทิตย์ · คอสตูมผี Ghostly</small>
          </span>
          <span className="pevents__go" aria-hidden="true">▶</span>
        </Link>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศทางการ <a href="https://roz.mygnjoy.com/en/news/update/189" rel="noopener" target="_blank">Update Notice 12 พ.ย.</a>
        กับ <a href="https://roz.mygnjoy.com/en/news/notice/192" rel="noopener" target="_blank">ปิดปรับปรุงเสร็จ</a> และประกาศ Discord ทางการ 10–12 พ.ย. ·
        ตาราง EXP จาก <a href="https://roz.mygnjoy.com/en/intro/guide/21" rel="noopener" target="_blank">คู่มือทางการ Character Level</a> ·
        ป้าย <Tag /> = มาจากไคลเอนต์หลังแพทช์ 12 พ.ย. ยังไม่ได้เช็กในเกม · วิธีเล่นและของรางวัล Ant Hell จากไกด์ผู้เล่น ·
        Essence อาชีพ 2 และโบนัสเซ็ต Expedition จากภาพหน้าจอในเกมของเจ้าของเว็บ · รูป NPC จากไฟล์เกม ·
        หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

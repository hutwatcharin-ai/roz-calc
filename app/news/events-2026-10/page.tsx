// The three October 2026 events on one page (owner, 1 Oct 2026): Baphomet
// Cult, The Legend of Amon Ra, and the Kumamon collab. All run 1 Oct after
// maintenance to 29 Oct before maintenance.
//
// Sources, in order of trust:
//   - the client of the 1 Oct patch (D:/data_grf_comparison_20261001):
//     every quest line, count and item id below is the NPCs' own dialogue
//     (data/i18n/sc string tables), every /navi spot is navi_npc.lub, and the
//     buff wording is stateiconinfo_thth.lub;
//   - the official notices (owner's screenshots) for dates, the costume
//     rewards and the Cash Shop packages. Where a notice image is too small
//     to read a number, the page says so rather than guessing.
//
// Pictures come from the same client (scripts/build-event-2026-10-images.py).

import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

export const revalidate = 86400;

const PATH = '/news/events-2026-10';
const PUBLISHED = '2026-10-01T16:00:00+07:00';
const ENDS = '2026-10-29T10:00:00+07:00';
const IMG = '/images/events/2026-10';

export const metadata: Metadata = {
  title: 'กิจกรรมเดือนตุลาคม 2569 Ragnarok Zero — Baphomet Cult, Amon Ra, Kumamon วิธีทำเควสครบ',
  description:
    'วิธีทำกิจกรรม 1–29 ต.ค. 2569 ใน Ragnarok Zero Global: Baphomet Cult (Priest Raymond), The Legend of Amon Ra (Al Noma, Apep) และ Kumamon Collab (ฟาร์ม Kumamoto) — พิกัด /navi ของที่ต้องเตรียม มอนที่ดรอป รางวัลคอสตูม และบัฟรายวัน',
};

type Mat = { id: number; name: string; qty: number };
const item = (m: Mat) => (
  <li key={m.id}>
    <Link href={`/database/items/${m.id}`} className="evmat">
      <img src={`/images/items/${m.id}.gif`} alt="" width={24} height={24} loading="lazy" />
      <span>{m.name}</span>
      <b>×{m.qty}</b>
    </Link>
  </li>
);

function Npc({ img, name, navi, w = 70 }: { img: string; name: string; navi: string; w?: number }) {
  return (
    <figure className="evnpc">
      <span className="evnpc__art"><img src={`${IMG}/${img}.png`} alt={name} width={w} loading="lazy" /></span>
      <figcaption>
        <strong>{name}</strong>
        <code>/navi {navi}</code>
      </figcaption>
    </figure>
  );
}

function Buff({ name, lines, hours }: { name: string; lines: string[]; hours: number }) {
  return (
    <div className="evbuff">
      <p className="evbuff__hd"><span>BUFF</span> {name} · {hours} ชั่วโมง</p>
      <ul>{lines.map((l) => <li key={l}>{l}</li>)}</ul>
    </div>
  );
}

// Kumamoto Experience Farm is 276x280 cells; the minimap covers the whole map.
const FARM = { w: 276, h: 280 };
const FARM_PINS = [
  // Kumamon (158,115) and Barmundt (172,115) stand side by side: one pin.
  { x: 165, y: 115, label: 'Kumamon + Barmundt (รับเควส)', c: 'yellow' },
  { x: 182, y: 62, label: 'Watermelon Poring', c: 'cyan' },
  { x: 215, y: 51, label: 'แปลงแตงโม', c: 'green' },
  { x: 115, y: 51, label: 'แปลงมะเขือเทศ', c: 'red' },
];

export default function Events202610() {
  const over = Date.now() > Date.parse(ENDS);
  return (
    <main className="shell evpage" style={{ paddingBlock: 28 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news/roadmap' },
          { name: 'กิจกรรมเดือนตุลาคม 2569', path: PATH },
        ])}
      />
      <JsonLd
        data={articleJsonLd({ path: PATH, headline: String(metadata.title), description: String(metadata.description), datePublished: PUBLISHED, dateModified: PUBLISHED })}
      />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/news/patch-2026-10-01">แพทช์ 1 ต.ค.</Link><span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">กิจกรรมเดือนตุลาคม</span>
      </nav>

      <header className="evhero">
        <p className="evhero__kicker">EVENT · 3 กิจกรรม</p>
        <h1 className="pagehead__title">กิจกรรมเดือนตุลาคม 2569</h1>
        <p className="evhero__date">
          {over ? <span className="tag tag--unknown">จบแล้ว</span> : <span className="evhero__live">กำลังจัด</span>} 1 ต.ค. หลังปิดปรับปรุง – 29 ต.ค. ก่อนปิดปรับปรุง
        </p>
        <ul className="evtiles">
          <li><a href="#baphomet"><img src={`${IMG}/raymond.png`} alt="" width={40} /><span>Baphomet Cult</span><small>ได้หมวก Golden Majestic Goat</small></a></li>
          <li><a href="#amonra"><img src={`${IMG}/amon-ra.png`} alt="" width={56} /><span>The Legend of Amon Ra</span><small>ได้หมวก Sun God&apos;s Hat</small></a></li>
          <li><a href="#kumamon"><img src={`${IMG}/kumamon.png`} alt="" width={46} /><span>Kumamon Collab</span><small>ได้ Kumamon Mask</small></a></li>
        </ul>
        <p className="muted evhero__src">
          ขั้นตอน จำนวนของ และพิกัดทุกจุดในหน้านี้มาจากบทพูดของ NPC และไฟล์นำทางในไคลเอนต์แพทช์ 1 ต.ค. · รูปจากไฟล์เกม
        </p>
      </header>

      {/* ---------------- Baphomet Cult ---------------- */}
      <section id="baphomet" className="evsec evsec--pink">
        <p className="evsec__tag">EVENT 01</p>
        <h2 className="evsec__title">Baphomet Cult</h2>
        <p className="evsec__lead">
          Priest Raymond ได้ยินเสียงแพะเรียกชื่อตัวเอง ช่วยสืบจนรู้ว่าเป็นสัญญาของบรรพบุรุษกับ Baphomet แล้วช่วยทำพิธีตัดสัญญาทุกวัน
        </p>
        <div className="evnpcs">
          <Npc img="raymond" name="Priest Raymond" navi="prontera 247/307" />
          <Npc img="yen" name="Shepherd Girl Yen" navi="prontera 276/325" />
          <Npc img="anselm" name="High Priest Anselm" navi="prt_church 13/16" />
          <Npc img="dark-figure" name="Dark Figure" navi="prt_church 15/20" w={90} />
        </div>

        <h3 className="evh">เควสหลัก (ทำครั้งเดียว)</h3>
        <ol className="evsteps">
          <li>คุย <b>Priest Raymond</b> (prontera 247/307) รับปากช่วย</li>
          <li>ไปถาม <b>Shepherd Girl Yen</b> (prontera 276/325) ข้างสุสาน เรื่องเสียงร้อง เธอบอกว่าเป็นเสียงแพะ ไม่ใช่แกะ และอาจเป็นเสียงปีศาจ</li>
          <li>กลับไปบอก Raymond แล้วไปหา <b>High Priest Anselm</b> ในโบสถ์ (prt_church 13/16)</li>
          <li>หาของให้ Anselm ทำพิธีไล่ปีศาจ:</li>
        </ol>
        <ul className="evmats">
          {[{ id: 912, name: 'Zargon', qty: 60 }, { id: 923, name: 'Evil Horn', qty: 60 }, { id: 1028, name: 'Mane', qty: 60 }].map(item)}
        </ul>
        <ol className="evsteps" start={5}>
          <li>Dark Figure โผล่มาประกาศว่า Raymond ต้องเข้าลัทธิ Baphomet ตามสัญญาบรรพบุรุษ Anselm ขับไล่ไปได้ชั่วคราว</li>
          <li>Raymond ยกหมวกเขาประจำตระกูลให้ (ตัวสัญญา) จบเควสหลัก</li>
        </ol>
        <div className="evreward">
          <span className="evreward__tag">REWARD</span>{' '}
          <Link href="/database/costumes/401571">[Costume] Golden Majestic Goat (Bound)</Link> — หมวกช่องบน ทุกอาชีพ
        </div>

        <h3 className="evh">เควสรายวัน (กับ Priest Raymond)</h3>
        <div className="evdaily">
          <Link href="/database/monsters/1101" className="evmob">
            <img src="/images/monsters/1101.gif" alt="" loading="lazy" />
            <span>ล่า <b>Baphomet Jr.</b> 66 ตัว</span>
          </Link>
          <div>
            <p className="evsmall">แล้วส่งของ:</p>
            <ul className="evmats">
              {[{ id: 935, name: 'Shell', qty: 6 }, { id: 1031, name: 'Mantis Scythe', qty: 6 }, { id: 937, name: 'Venom Canine', qty: 6 }].map(item)}
            </ul>
          </div>
        </div>
        <div className="evreward">
          <span className="evreward__tag">DAILY</span> <Link href="/database/items/526">Royal Jelly</Link> ×5 (ตามประกาศ) + บัฟ 4 ชั่วโมง
        </div>
        <Buff name="Blessing of Exorcism" hours={4} lines={['Damage ที่ได้รับจากมอนสเตอร์เผ่า Demon ลดลง 30%']} />
        <p className="evnote">
          ประกาศเขียนว่าบัฟนี้ได้ DEF +8 และ MDEF +8 ด้วย แต่คำอธิบายบัฟในเกมมีแค่บรรทัดลดดาเมจจากเผ่า Demon · Anselm บอกว่าทำทุกวันราวหนึ่งเดือนสัญญาจะขาด
        </p>
      </section>

      {/* ---------------- Amon Ra ---------------- */}
      <section id="amonra" className="evsec evsec--yellow">
        <p className="evsec__tag">EVENT 02</p>
        <h2 className="evsec__title">The Legend of Amon Ra</h2>
        <p className="evsec__lead">
          Al Noma ชายลึกลับในทะเลทราย Sograt อยากเล่าตำนาน Amon Ra ให้ฟัง ถ้าหาวัตถุโบราณ 3 ชิ้นมาให้ก่อน… แล้วความจริงก็เฉลยตอนจบ
        </p>
        <div className="evnpcs">
          <Npc img="al-noma" name="Al Noma" navi="moc_fild19 107/101" />
          <Npc img="apep" name="Apep" navi="moc_ruins 125/125" />
          <Npc img="amon-ra" name="Amon Ra" navi="moc_fild19 107/101" w={110} />
        </div>

        <h3 className="evh">เควสหลัก (ทำครั้งเดียว)</h3>
        <ol className="evsteps">
          <li>คุย <b>Al Noma</b> (moc_fild19 107/101) เขาขอวัตถุโบราณ 3 ชิ้น:</li>
        </ol>
        <ul className="evmats">
          {[{ id: 2611, name: 'Silver Ring', qty: 1 }, { id: 639, name: 'Armlet of Obedience', qty: 1 }, { id: 2618, name: "Matyr's Leash", qty: 1 }].map(item)}
        </ul>
        <ol className="evsteps" start={2}>
          <li>Al Noma ให้กล่องไปให้ <b>Apep</b> ที่ซากเมือง Morroc (moc_ruins 125/125) ชำระคำสาปวัตถุ</li>
          <li>กลับไปหา Al Noma ฟังตำนาน… แล้วเขาเผยตัวว่าคือ <b>Amon Ra</b> ที่คุณเพิ่งปลดผนึกให้</li>
        </ol>
        <div className="evreward">
          <span className="evreward__tag">REWARD</span>{' '}
          <Link href="/database/costumes/430017">[Costume] Sun God&apos;s Hat (Bound)</Link> — หมวกช่องบนและกลาง ทุกอาชีพ
        </div>

        <h3 className="evh">เควสรายวัน (กับ Apep)</h3>
        <div className="evdaily">
          <Link href="/database/monsters/1297" className="evmob">
            <img src="/images/monsters/1297.gif" alt="" loading="lazy" />
            <span>ล่า <b>Ancient Mummy</b> 30 ตัว (ในพีระมิด)</span>
          </Link>
          <div>
            <p className="evsmall">แล้วส่งของ:</p>
            <ul className="evmats">
              {[{ id: 930, name: 'Rotten Bandage', qty: 10 }, { id: 1096, name: 'Round Shell', qty: 10 }, { id: 929, name: 'Immortal Heart', qty: 10 }].map(item)}
            </ul>
          </div>
        </div>
        <div className="evreward">
          <span className="evreward__tag">DAILY</span> <Link href="/database/items/521">Aloe Leaflet</Link> ×5 (ตามประกาศ) + บัฟ 4 ชั่วโมง
        </div>
        <Buff name="Power of Amon Ra" hours={4} lines={['เพิ่มความต้านทานต่อการโจมตีธาตุ Fire 30%', 'DEF + 8, MDEF + 8']} />
      </section>

      {/* ---------------- Kumamon ---------------- */}
      <section id="kumamon" className="evsec evsec--cyan">
        <p className="evsec__tag">EVENT 03 · COLLAB</p>
        <h2 className="evsec__title">Kumamon × Ragnarok Zero</h2>
        <div className="evkuma">
          <img className="evkuma__art" src={`${IMG}/kumamon-collab.png`} alt="Kumamon" width={160} height={200} loading="lazy" />
          <div>
            <p className="evsec__lead" style={{ marginTop: 0 }}>
              Kumamon มาชวนไปเที่ยว <b>Kumamoto Experience Farm</b> แมพใหม่ที่ Barmundt ย้ายฟาร์มแตงโมกับมะเขือเทศของคุมาโมโตะมาไว้ เก็บผลผลิตวันละครั้ง ได้หน้ากาก Kumamon และของกินบัฟ
            </p>
            <div className="evnpcs">
              <Npc img="kumamon" name="Kumamon (ทางเข้า)" navi="prontera 105/77" w={56} />
              <Npc img="barmundt" name="Barmundt" navi="clb_kuma 172/115" />
              <Npc img="watermelon-poring" name="Watermelon Poring" navi="clb_kuma 182/62" w={56} />
            </div>
          </div>
        </div>

        <h3 className="evh">วิธีเล่น</h3>
        <ol className="evsteps">
          <li>คุย <b>Kumamon</b> ที่ prontera 105/77 เข้าฟาร์ม (ต้องเลเวล 10 ขึ้นไป)</li>
          <li>รับเควส "Kumamoto Farm Experience" กับ <b>Barmundt</b> (clb_kuma 172/115)</li>
          <li>เก็บแตงโม 1 ลูกจากแปลงแตงโม และมะเขือเทศ 1 ลูกจากแปลงมะเขือเทศ — เลือกลูกให้ถูก ถ้าเลือกผิดต้องเริ่มใหม่</li>
          <li>กลับไปส่ง Barmundt · ทำได้วันละครั้ง อย่าถือของเยอะจนเต็มตัว</li>
        </ol>
        <div className="evtips">
          {/* Only what the NPCs themselves say; the dialogue does not show
              which choices always succeed, so no "answer key" here. */}
          <p><b>คำใบ้แตงโม (Watermelon Farmer):</b> "ตบลูกที่สุกแรงๆ ทีเดียวมันก็หลุดออกมา" · ชาวสวนยังบอกว่าแตงโมที่ขั้วแห้งคือลูกอร่อย ส่วนใช้กรรไกรตัดเถามีโอกาสบี้แตก</p>
          <p><b>คำใบ้มะเขือเทศ (Grandmother):</b> "อยากได้ลูกอร่อยต้องเบามือและระวัง" · ดึงแรงหรือใช้กรรไกรพลาดมีโอกาสช้ำ</p>
          <p className="muted">เก็บพลาดแค่เริ่มใหม่ ไม่เสียของ</p>
        </div>
        <div className="evreward">
          <span className="evreward__tag">REWARD</span> ครั้งแรก: <Link href="/database/costumes/400799">[Costume] Kumamon Mask</Link> (หนึ่งชิ้นต่อบัญชี · ช่วงกิจกรรมได้ EXP จากมอน +5%) · ครั้งต่อไป:{' '}
          <Link href="/database/items/106885">Kumamoto-grown Watermelon</Link> ×2 + <Link href="/database/items/106886">Kumamoto-grown Tomato</Link> ×2
        </div>

        <h3 className="evh">เควสลับ: Watermelon Poring</h3>
        <p className="evsmall">
          ใส่ <b>Kumamon Mask</b> แล้วคุย Watermelon Poring (clb_kuma 182/62) — Poring ที่ฉลาดขึ้นเพราะกินแตงโมคุมาโมโตะ ขอให้เก็บแตงโมกับมะเขือเทศที่มันทำหล่นทั่วฟาร์ม:
          ส่ง <b>Kumamoto Watermelon 5</b> และ <b>Kumamoto Tomato 5</b> ได้ของคืนบางส่วน ทำได้วันละครั้ง
        </p>

        <h3 className="evh">ของกินบัฟ</h3>
        <div className="evfood">
          <div className="evfood__it">
            <img src={`${IMG}/kumamoto-watermelon.png`} alt="" width={24} height={24} />
            <div>
              <Link href="/database/items/106885"><b>Kumamoto-grown Watermelon</b></Link> → <i>Delicious Buff</i>
              <p>เพิ่ม Damage กายภาพ/เวทมนตร์ต่อมอนสเตอร์ทั่วไปและประเภท Boss <b>10%</b> นาน <b>30 นาที</b> · ใช้ได้ตั้งแต่เลเวล 10</p>
            </div>
          </div>
          <div className="evfood__it">
            <img src={`${IMG}/kumamoto-tomato.png`} alt="" width={24} height={24} />
            <div>
              <Link href="/database/items/106886"><b>Kumamoto-grown Tomato</b></Link> → <i>Fresh Buff</i>
              <p>เพิ่ม Damage กายภาพ/เวทมนตร์ต่อมอนสเตอร์ทุกเผ่า <b>10%</b> นาน <b>30 นาที</b> (ไม่รวมผู้เล่น) · ใช้ได้ตั้งแต่เลเวล 10</p>
            </div>
          </div>
        </div>
        <p className="evnote">ตัวเลขจากคำอธิบายไอเทมในเกม · ของสองอย่างนี้ถูกลบเมื่อกิจกรรมจบ</p>

        <h3 className="evh">แผนที่ฟาร์ม</h3>
        <figure className="evmap">
          <div className="evmap__box">
            <img src={`${IMG}/clb_kuma.webp`} alt="แผนที่ Kumamoto Experience Farm" width={512} height={512} loading="lazy" />
            {FARM_PINS.map((p) => (
              <span
                key={p.label}
                className={`evpin evpin--${p.c}`}
                style={{ left: `${(p.x / FARM.w) * 100}%`, top: `${(1 - p.y / FARM.h) * 100}%` }}
              >
                <i />
                <b>{p.label}</b>
              </span>
            ))}
          </div>
          <figcaption className="muted">ในฟาร์มยังมีจุดถ่ายรูปคู่ Kumamon 7 จุด เปิด/ปิดตุ๊กตาและป้าย Kumamon ยักษ์ได้ · ปราสาทคุมาโมโตะทางซ้ายบน ภูเขาอะโซะทางขวาบน</figcaption>
        </figure>

        <h3 className="evh">แพ็กเกจใน Cash Shop (1–29 ต.ค.)</h3>
        <div className="evshop">
          <div>
            <Link href="/database/items/200860"><b>Kumamon Refinement Package</b></Link> · 35,000 KP
            <p>[Costume] Kumamon Doll ×1 พร้อมแร่ตีบวก Enriched Elunium และ Enriched Oridecon</p>
          </div>
          <div>
            <Link href="/database/items/200861"><b>Kumamon Growth Package</b></Link> · 35,000 KP
            <p>[Costume] Kumamon Doll ×1 พร้อมของเก็บเวล (Growth Elixir, Bubble Gum และยา)</p>
          </div>
        </div>
        <p className="evnote">
          <Link href="/database/costumes/480559">[Costume] Kumamon Doll</Link> เป็นผ้าคลุม (Garment) ใส่ได้ทุกอาชีพ ออปชันช่วงกิจกรรม: EXP จากมอน <b>+5%</b> และถ้าใส่คู่ Kumamon Mask อัตราดรอปไอเทม <b>+5%</b> · ออปชันหายเมื่อจบกิจกรรม ·
          จำนวนของอื่นในแพ็กเกจอ่านจากภาพประกาศไม่ชัด จึงไม่ได้ใส่ตัวเลข
        </p>
      </section>

      <p className="muted" style={{ marginTop: 24 }}>
        ดูสรุปแพทช์ทั้งหมด: <Link href="/news/patch-2026-10-01">แพทช์ 1 ต.ค. 2569</Link>
      </p>
    </main>
  );
}

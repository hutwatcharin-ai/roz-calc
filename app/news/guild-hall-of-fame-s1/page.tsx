// app/news/guild-hall-of-fame-s1/page.tsx
//
// Guild Hall of Fame, Season 1 (15 Oct 2026 - the 7 Jan 2027 maintenance).
// From the official event pages, step1-step6 (owner's PDFs of
// roz.mygnjoy.com/th/event/guild/guildEvent, saved 15 Oct 2026) and the owner's
// written summary of them (Ragnarok-Zero-Update-2026-10-15.th.md). Ordered by
// what a player does: how points work, the one-time quest chain, the dailies,
// what the guild wins, the exchange machine.
//
// Kept to what the pages say. Not stated anywhere yet, and so written as
// unknown rather than guessed: where the Knight monsters spawn, drop rates,
// whether monthly rewards stack, the cut-off time, how ties break.
import '../patch-2026-10-01/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { costumeId } from '@/lib/costume-twins';

export const revalidate = 86400;

const PATH = '/news/guild-hall-of-fame-s1';
const PUBLISHED = '2026-10-15T12:00:00+07:00';
const OFFICIAL = 'https://roz.mygnjoy.com/th/event/guild/guildEvent?step=step1';

export const metadata: Metadata = {
  title: 'Guild Hall of Fame ซีซั่น 1 Ragnarok Zero — เควส Liechtenauer, คะแนน Guild\'s Honor, รางวัล',
  description:
    'วิธีเก็บคะแนนกิลด์ Guild Hall of Fame ซีซั่น 1 (15 ต.ค. 2569 - 7 ม.ค. 2570) ใน Ragnarok Zero Global: เควสหลัก Liechtenauer เลือกโล่ Passion/Calm/Embrace/Wisdom, เควสรายวัน, Dangle, คะแนน Guild\'s Honor Iron/Bronze/MVP, รางวัลอันดับและรายเดือน, เครื่องแลกโล่',
};

const item = (id: number, name: string) => <Link href={`/database/items/${id}`}>{name}</Link>;

const SHIELDS = [
  { id: 1270291, name: 'Passion', hunt: 'Poring Knight', fx: 'ATK +10%', flame: 'Red' },
  { id: 1270292, name: 'Calm', hunt: 'Pouring Knight', fx: 'MATK +5%', flame: 'Blue' },
  { id: 1270293, name: 'Embrace', hunt: 'Poporing Knight', fx: 'DEF +10, MDEF +2', flame: 'Green' },
  { id: 1270294, name: 'Wisdom', hunt: 'Drops Knight', fx: 'MaxHP +100, MaxSP +75', flame: 'Yellow' },
];
const TICKETS = [
  { id: 108172, name: 'Passion', fx: 'ATK +3%', flame: 'Red' },
  { id: 108175, name: 'Calm', fx: 'MATK +2%', flame: 'Blue' },
  { id: 108173, name: 'Embrace', fx: 'DEF +3, MDEF +1', flame: 'Green' },
  { id: 108203, name: 'Wisdom', fx: 'MaxHP +50, MaxSP +20', flame: 'Yellow' },
];
const KNIGHTS = [
  { img: 'red', name: 'Poring Knight', drop: 'Iron 1' },
  { img: 'yellow', name: 'Drops Knight', drop: 'Iron 1' },
  { img: 'blue', name: 'Pouring Knight', drop: 'Iron 1' },
  { img: 'green', name: 'Poporing Knight', drop: 'Iron 1' },
  { img: 'gold', name: 'Golden Knight', drop: 'Iron 1-8' },
];
const FLAMES: Record<string, number> = { Red: 1003110, Blue: 1003111, Green: 1003112, Yellow: 1003113 };
const MVP_HONOR = [
  [1086, 'Golden Thief Bug'], [1150, 'Moonlight Flower'], [1087, 'Orc Hero'], [1046, 'Doppelganger'], [1190, 'Orc Lord'],
  [1038, 'Osiris'], [1389, 'Dracula'], [1511, 'Amon Ra'], [1039, 'Baphomet'],
] as const;
const MONTHLY = [
  { pts: '10,000', box: 108000, label: 'รางวัลเข้าร่วม', badge: 10, yellow: 2, extra: '' },
  { pts: '30,000', box: 108001, label: '', badge: 20, yellow: 5, extra: '' },
  { pts: '40,000', box: 108002, label: '', badge: 20, yellow: 5, extra: 'Bubble Gum 2' },
  { pts: '50,000', box: 108003, label: '', badge: 20, yellow: 5, extra: 'Bubble Gum 2 · Premium Course Meal 2' },
  { pts: '70,000', box: null, label: '', badge: 20, yellow: 5, extra: 'Bubble Gum 2 · Premium Course Meal 2 · Unlimited Drink 2' },
  { pts: '100,000', box: null, label: '', badge: 20, yellow: 5, extra: 'Bubble Gum 2 · Premium Course Meal 2 · Unlimited Drink 2 · Challenger Drink 2' },
];

export default function GuildHallOfFamePage() {
  return (
    <main className="shell ghof" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd data={breadcrumbJsonLd([{ name: 'หน้าแรก', path: '/' }, { name: 'ข่าว', path: '/news' }, { name: 'Guild Hall of Fame ซีซั่น 1', path: PATH }])} />
      <JsonLd data={articleJsonLd({ path: PATH, headline: String(metadata.title), description: String(metadata.description), datePublished: PUBLISHED, dateModified: PUBLISHED })} />
      <nav className="crumbs" aria-label="ตำแหน่งหน้า">
        <Link href="/">หน้าแรก</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <Link href="/news">ข่าว</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">Guild Hall of Fame</span>
      </nav>

      <header className="phero">
        <p className="phero__date">SEASON 1 · 15 ต.ค. 2569 – 7 ม.ค. 2570 (ปิดปรับปรุง)</p>
        <h1 className="phero__title">Guild Hall of Fame ซีซั่น 1</h1>
        <p className="phero__lead">
          สมาชิกกิลด์ช่วยกันเก็บ <strong>Guild Honor Point</strong> จัดอันดับแยกเซิร์ฟเวอร์ ·
          กิลด์ที่ 1-3 ได้ปีกคอสตูมประจำซีซั่น · ทุกคนในกิลด์ที่ทำได้ 100 คะแนนขึ้นไปได้รางวัลรายเดือน
        </p>
        <a className="phero__pill phero__pill--link" href="#start">เริ่มยังไง ↓</a>{' '}
        <a className="phero__pill phero__pill--link" href="#rewards">ได้อะไร ↓</a>
      </header>

      <section className="phl" aria-label="สรุป">
        <article className="phl__tile">
          <p className="phl__big">100</p>
          <h2 className="phl__title">คะแนนขั้นต่ำต่อคน</h2>
          <p className="phl__body">ต่ำกว่า 100 ไม่ได้รางวัล · ต้องอยู่กิลด์ 1 สัปดาห์ขึ้นไป</p>
        </article>
        <article className="phl__tile">
          <p className="phl__big">30</p>
          <h2 className="phl__title">Bronze = 30 คะแนน</h2>
          <p className="phl__body">ได้จากเควสหลักและเควสรายวันของ Liechtenauer</p>
        </article>
        <article className="phl__tile">
          <p className="phl__big">+5%</p>
          <h2 className="phl__title">โล่กิลด์ EXP +5%</h2>
          <p className="phl__body">เลือก 1 ใน 4 แบบ เปลี่ยนทีหลังได้ที่เครื่องแลก</p>
        </article>
        <article className="phl__tile">
          <p className="phl__big">1 / วัน</p>
          <h2 className="phl__title">เควสรายวัน</h2>
          <p className="phl__body">ส่ง Flame สีเดียว 10 ชิ้น · รีเซ็ต 11:00 น. เวลาไทย</p>
        </article>
      </section>

      <section className="ghsec" id="points">
        <h2 className="section-title">คะแนนมาจากไหน</h2>
        <p className="muted ghsec__lead">มีแค่ <strong>Guild&apos;s Honor</strong> ที่เพิ่มคะแนนได้ · ทุกชิ้นถูกลบเมื่อกิจกรรมจบ</p>
        <div className="ghtable">
          <table className="stat-table">
            <thead><tr><th scope="col">ไอเทม</th><th scope="col">คะแนน</th><th scope="col">ได้จาก</th></tr></thead>
            <tbody>
              <tr><th scope="row">{item(107810, "Guild's Honor (Iron)")}</th><td className="num">1</td><td>Poring / Drops / Pouring / Poporing Knight ตัวละ 1 ชิ้น · Golden Knight 1-8 ชิ้น</td></tr>
              <tr><th scope="row">{item(107811, "Guild's Honor (Bronze)")}</th><td className="num">30</td><td>เควสหลัก 3 ขั้น และเควสรายวันของ Liechtenauer</td></tr>
              <tr><th scope="row">{item(107812, "Guild's Honor (MVP)")}</th><td className="num">100</td><td>MVP 9 ตัวด้านล่าง</td></tr>
            </tbody>
          </table>
        </div>
        {/* Where the Knights are: the 15 Oct client's navi_mob lists all
            five on 215 of the 239 map groups it covers (fields and
            dungeons), at Lv 15. Sprites from the same client
            (scripts/build-guild-knight-images.py). */}
        <p className="ghsub" id="knights">มอน Knight ออกที่ไหน</p>
        <ul className="pmobs">
          {KNIGHTS.map((k) => (
            <li key={k.img}>
              <span className="pmob">
                <span className="pmob__art"><img src={`/images/events/guild-s1/knight-${k.img}.png`} alt="" loading="lazy" /></span>
                <span className="pmob__name">{k.name}</span>
                <span className="pmob__meta">{k.drop}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>
          ไฟล์นำทางในเกม (แพทช์ 15 ต.ค.) ใส่ Knight ทั้ง 5 สีไว้ <strong>แทบทุกแมพ ทั้งทุ่งและดันเจี้ยน</strong>
          เลเวล 15 · ตีที่แมพที่ฟาร์มอยู่แล้วได้เลย ไม่ต้องไปที่เฉพาะ · ไฟล์ไม่ได้บอกว่าเกิดถี่แค่ไหน
        </p>
        <p className="ghsub">MVP ที่ดรอป Guild&apos;s Honor (MVP)</p>
        <ul className="pmobs">
          {MVP_HONOR.map(([id, name]) => (
            <li key={id}>
              <Link href={`/database/monsters/${id}`} className="pmob">
                <span className="pmob__art"><img src={`/images/monsters/${id}.gif`} alt="" loading="lazy" /></span>
                <span className="pmob__name">{name}</span>
                {(id === 1511 || id === 1039) && <span className="pmob__meta">Raid ใหม่ 15 ต.ค.</span>}
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>
          หน้าทางการไม่บอกอัตราดรอป · <Link href="/guides/mvp">วิธีเข้า MVP Raid</Link>
        </p>
      </section>

      <section className="ghsec" id="start">
        <h2 className="section-title">เควสหลัก (ทำครั้งเดียว)</h2>
        <p className="muted ghsec__lead">
          NPC <strong>Liechtenauer</strong> <code>/navi prontera 155/307</code> · ต้องเป็นสมาชิกกิลด์ · ทำครบ 3 ขั้นแล้วปลดเควสรายวัน
        </p>
        <ol className="ghsteps">
          <li>
            <b>For the Guild</b>
            <span>ล่า Poring Knight, Drops Knight, Pouring Knight, Poporing Knight อย่างละ 10 ตัว · ส่ง {item(FLAMES.Red, 'Flame of the Guild')} แดง น้ำเงิน เขียว เหลือง สีละ 10 ชิ้น · ในไฟล์เกมแบ่งเป็น 2 เควสชื่อเดียวกัน (Poring + Drops กับ Flame แดง เหลือง / Pouring + Poporing กับ Flame น้ำเงิน เขียว)</span>
          </li>
          <li>
            <b>คุณธรรมที่สำคัญที่สุด</b>
            <span>เลือก 1 สาย ล่า Knight ตัวที่กำหนด 30 ตัว ได้โล่ประจำสายนั้น</span>
          </li>
          <li>
            <b>จุดสูงสุดของเหล่าอัศวิน</b>
            <span>ล่า Golden Knight 1 ตัว</span>
          </li>
        </ol>
        <p className="muted" style={{ fontSize: 13.5 }}>
          แต่ละขั้นได้ {item(107811, "Guild's Honor (Bronze)")} และ [Event] Potion Pouch (White Potion 20 + Blue Potion 10 แบบผูกตัว) · หน้าทางการไม่ได้บอกจำนวน Bronze ต่อขั้น
        </p>

        <p className="ghsub">เลือกโล่ (ขั้นที่ 2)</p>
        <ul className="ghshields">
          {SHIELDS.map((s) => (
            <li key={s.id} className={`ghshield ghshield--${s.flame.toLowerCase()}`}>
              <Link href={`/database/costumes/${costumeId(s.id)}`}><b>{s.name}</b></Link>
              <span className="ghshield__fx">{s.fx}</span>
              <span className="ghshield__how">ล่า {s.hunt} 30 ตัว</span>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 13.5 }}>ทุกแบบได้ EXP จากมอน +5% เพิ่ม · โล่ถูกลบเมื่อกิจกรรมจบ</p>
      </section>

      <section className="ghsec" id="daily">
        <h2 className="section-title">เควสรายวัน</h2>
        <div className="ghcols">
          <div className="card">
            <h3 className="ghh3">Liechtenauer <code>/navi prontera 155/307</code></h3>
            <ul className="ghlist">
              <li>ต้องผ่านเควสหลักครบก่อน</li>
              <li>ส่ง Flame of the Guild <strong>สีเดียวกัน 10 ชิ้น</strong> สีไหนก็ได้</li>
              <li>ได้ Bronze (30 คะแนน) + {item(108202, '[Event] Guild Ticket Box')} สุ่มตั๋ว 1 ใบจาก 4 แบบ</li>
              <li>วันละ 1 ครั้ง · รีเซ็ต 11:00 น. เวลาไทย</li>
            </ul>
          </div>
          <div className="card">
            <h3 className="ghh3">Dangle <code>/navi prt_in 42/105</code></h3>
            <ul className="ghlist">
              <li>สุ่มเควสล่ามอน 50 ตัว ตามขนาด เลือกช่วงตามเลเวลเรา (10+, 30+, 50+)</li>
              <li>มอนตัวเล็ก: [Event] Authoritative Badge 5</li>
              <li>มอนตัวกลาง: [Event] Blue Potion Box 1</li>
              <li>มอนตัวใหญ่: World Moving Ticket 3</li>
            </ul>
          </div>
        </div>
        <p className="ghsub">ตั๋วกิลด์ (บัฟเมื่อใช้)</p>
        <ul className="ghtickets">
          {TICKETS.map((t) => (
            <li key={t.id}>{item(t.id, `[Event] ${t.name} Guild Ticket`)} <span>{t.fx}</span></li>
          ))}
        </ul>
        <p className="muted" style={{ fontSize: 13.5 }}>หน้าทางการไม่ได้บอกว่าบัฟอยู่นานเท่าไรและซ้อนกันได้ไหม</p>
      </section>

      <section className="ghsec" id="rewards">
        <h2 className="section-title">ได้อะไร</h2>
        <div className="pnote" style={{ marginTop: 6 }}>
          <strong>ต้องผ่านทั้ง 2 ข้อ:</strong> อยู่ในกิลด์ 1 สัปดาห์ขึ้นไป และทำคะแนนเองได้อย่างน้อย 100 คะแนน (เช่น Bronze 3 + Iron 10 หรือ MVP 1)
        </div>
        <p className="ghsub">รางวัลอันดับกิลด์ (จบซีซั่น)</p>
        <div className="ghtable">
          <table className="stat-table">
            <thead><tr><th scope="col"></th><th scope="col">ที่ 1</th><th scope="col">ที่ 2</th><th scope="col">ที่ 3</th></tr></thead>
            <tbody>
              <tr><th scope="row">กล่อง</th><td>{item(108004, '1st Place Reward')}</td><td>{item(108005, '2nd Place Reward')}</td><td>{item(108006, '3rd Place Reward')}</td></tr>
              <tr><th scope="row">ปีกคอสตูม</th><td>Wavy Orange Angel Wings</td><td>Wavy Rudra Angel Wings</td><td>Wavy Green Angel Wings</td></tr>
              <tr><th scope="row">Small Healing Potion</th><td className="num">15</td><td className="num">10</td><td className="num">10</td></tr>
              <tr><th scope="row">Small Mana Potion</th><td className="num">10</td><td className="num">10</td><td className="num">5</td></tr>
              <tr><th scope="row">Challenger / Unlimited Drink</th><td className="num">20 / 20</td><td className="num">15 / 15</td><td className="num">15 / 15</td></tr>
              <tr><th scope="row">Ale&apos;s Blessing / Agi Up Potion</th><td className="num">20 / 20</td><td className="num">15 / 15</td><td className="num">15 / 15</td></tr>
              <tr><th scope="row">Unlimited Fly Wing</th><td>5 วัน</td><td>3 วัน</td><td>—</td></tr>
            </tbody>
          </table>
        </div>
        <p className="ghsub">รางวัลรายเดือนตามคะแนนรวมของกิลด์</p>
        <div className="ghtable">
          <table className="stat-table">
            <thead><tr><th scope="col">คะแนนกิลด์</th><th scope="col">Authoritative Badge</th><th scope="col">20 Yellow Potion Box</th><th scope="col">เพิ่ม</th></tr></thead>
            <tbody>
              {MONTHLY.map((m) => (
                <tr key={m.pts}>
                  <th scope="row">{m.box ? item(m.box, m.pts) : m.pts}{m.label && <small> {m.label}</small>}</th>
                  <td className="num">{m.badge}</td>
                  <td className="num">{m.yellow}</td>
                  <td>{m.extra || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 13.5 }}>
          ทุกชิ้นเป็นของ [Event] · ยังไม่รู้ว่าได้ทุกขั้นที่ผ่านหรือแค่ขั้นสูงสุด วันตัดยอดรายเดือน และคะแนนรีเซ็ตทุกเดือนไหม
        </p>
      </section>

      <section className="ghsec" id="exchange">
        <h2 className="section-title">เครื่องแลกโล่และตั๋ว</h2>
        <p className="muted ghsec__lead">Exchange Vending Machine <code>/navi prontera 161/307</code> (ข้าง Liechtenauer)</p>
        <div className="ghcols">
          <div className="card">
            <h3 className="ghh3">เปลี่ยนโล่</h3>
            <p style={{ margin: 0 }}>โล่เดิม + Flame สีของโล่ที่อยากได้ 40 ชิ้น</p>
            <ul className="ghlist">
              {SHIELDS.map((s) => <li key={s.id}>{s.name} ← {item(FLAMES[s.flame], `Flame ${s.flame}`)} 40</li>)}
            </ul>
          </div>
          <div className="card">
            <h3 className="ghh3">เลือกตั๋วเอง</h3>
            <p style={{ margin: 0 }}>Flame สีเดียว 20 ชิ้น แลกตั๋วสีนั้น</p>
            <ul className="ghlist">
              {TICKETS.map((t) => <li key={t.id}>{t.name} ← {item(FLAMES[t.flame], `Flame ${t.flame}`)} 20</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="ghsec">
        <h2 className="section-title">ลำดับที่แนะนำ</h2>
        <ol className="ghlist ghlist--num">
          <li>เข้ากิลด์ให้ครบ 1 สัปดาห์ก่อนตัดรางวัล</li>
          <li>ทำเควสหลัก 3 ขั้นกับ Liechtenauer เลือกโล่ที่เข้ากับอาชีพ (สายตี Passion, สายเวท Calm, สายแทงค์ Embrace)</li>
          <li>ทุกวัน: ส่ง Flame สีเดียว 10 ชิ้น (30 คะแนน) แล้วรับเควสของ Dangle</li>
          <li>ไป MVP Raid ด้วย MVP ที่ดรอป Honor (MVP) ได้ 100 คะแนนต่อชิ้น</li>
          <li>ใช้ตั๋วและของ [Event] ก่อนกิจกรรมจบ เพราะถูกลบทั้งหมด</li>
        </ol>
      </section>

      <aside className="pnote">
        ที่มา: <a href={OFFICIAL} rel="noopener" target="_blank">หน้ากิจกรรม Guild Hall of Fame ทางการ</a> แท็บ step1-step6 (บันทึก 15 ต.ค. 2569) ·
        จุดเกิด Knight และรายการเควสมาจากไฟล์เกมแพทช์ 15 ต.ค. ·
        ยังไม่ระบุ: อัตราดรอป, วิธีกดส่งคะแนน, เวลาตัดคะแนน, รางวัล Pre-Season · ถ้าในเกมไม่ตรงบอกได้ ·{' '}
        <Link href="/news/patch-2026-10-15">แพทช์ 15 ต.ค.</Link> · <Link href="/guides/guild">ไกด์กิลด์</Link>
      </aside>
    </main>
  );
}

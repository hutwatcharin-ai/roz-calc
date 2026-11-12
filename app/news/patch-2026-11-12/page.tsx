// app/news/patch-2026-11-12/page.tsx
//
// The 12 Nov 2026 maintenance, written the day before from the two Discord
// notices: "Scheduled Maintenance – 12th November 2026" (10 Nov) and the
// 11 Nov reminder with the update highlights. No patch notes yet, and the
// client files of 9 Nov carry none of this patch, so every line about the
// update is the reminder's one-line highlight, plus what this site already
// knew about each map, monster or dungeon it names.
//
// The official site was not read for this page: its robots.txt blocks
// ClaudeBot again (11 Nov 2026).
import '../patch-2026-10-01/page.css';
import '../patch-2026-10-29/page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';

const PATH = '/news/patch-2026-11-12';
const PUBLISHED = '2026-11-11T16:00:00+07:00';
const MODIFIED = PUBLISHED;

export const metadata: Metadata = {
  title: 'แพทช์ 12 พ.ย. 2569 Ragnarok Zero — เลเวลตัน 80, Ant Hell Memorial, ดันใหม่ Karu และ Izlude ใต้น้ำ 4–5',
  description:
    'Ragnarok Zero Global ปิดปรับปรุงพฤหัสบดี 12 พฤศจิกายน 2569 เริ่ม 08:00 น. เวลาไทย: ขยายเลเวลตัน Base เป็น 80, เควสรายวัน Lv 80, ดันเจี้ยน Western Cave Karu และ Izlude Undersea Cave ชั้น 4–5, Memorial Dungeon Ant Hell, อุปกรณ์ Memorial Lv 70, อีเวนต์ล่า Hode และ Orc Warrior, แลก Blacksmith Blessing, Reset Cat รีเซ็ตฟรี, EXP เลเวล 2–70 ลดลง',
};

const HIGHLIGHTS: { big: string; title: string; body: string; href?: string; link?: string }[] = [
  { big: '80', title: 'เลเวลตัน Base 80', body: 'จาก 70 เป็น 80 · Job Level ตันที่ 70 เท่าเดิม · มีเควสรายวันใหม่สำหรับ Lv 80', href: '#level', link: 'รายละเอียด' },
  { big: 'EXP', title: 'EXP เลเวล 2–70 ลดลง', body: 'EXP ที่ต้องใช้ขึ้นเลเวล Base 2 ถึง 70 น้อยลง ประกาศยังไม่บอกตัวเลข', href: '#level', link: 'รายละเอียด' },
  { big: '2', title: 'ดันเจี้ยนใหม่', body: 'Western Cave Karu (Comodo) · Izlude Undersea Cave ชั้น 4 และ 5', href: '#dungeons', link: 'มอนในแมพ' },
  { big: 'MD', title: 'Memorial Dungeon Ant Hell', body: 'ดันเจี้ยนความทรงจำใหม่ บอส Cannibal Maya · อุปกรณ์ Memorial Lv 70', href: '#memorial', link: 'ดูข้อมูลดัน' },
  { big: 'EV', title: 'อีเวนต์ 3 อย่าง', body: 'ล่า Hode กับ Orc Warrior · แลก Blacksmith Blessing · Reset Cat รีเซ็ตฟรี', href: '#events', link: 'รายละเอียด' },
];

type Mob = { id: number; name: string };

// Monster lists as the site had them before the patch (monster_spawns). Karu
// had no monsters in the game when the owner walked it on 28 Oct, so its
// list is from the source database, not the game.
const DUNGEONS: { code: string; name: string; th: string; where: string; mobs: Mob[] }[] = [
  {
    code: 'beach_dun',
    name: 'Western Cave Karu',
    th: 'ถ้ำตะวันตก Karu',
    where: 'Comodo · แมพเปิดแล้วแต่ยังไม่มีมอน (เช็กในเกม 28 ต.ค.)',
    mobs: [
      { id: 1148, name: 'Medusa' },
      { id: 1255, name: 'Nereid' },
      { id: 1256, name: 'Pest' },
    ],
  },
  {
    code: 'iz_dun03',
    name: 'Izlude Undersea Cave 4F',
    th: 'ถ้ำใต้น้ำ Izlude ชั้น 4',
    where: 'ต่อจากชั้น 3 (iz_dun02)',
    mobs: [
      { id: 1045, name: 'Marc' },
      { id: 1069, name: 'Swordfish' },
      { id: 1158, name: 'Phen' },
      { id: 1142, name: 'Marine Sphere' },
      { id: 1068, name: 'Hydra' },
    ],
  },
  {
    code: 'iz_dun04',
    name: 'Izlude Undersea Cave 5F',
    th: 'ถ้ำใต้น้ำ Izlude ชั้น 5',
    where: 'ต่อจากชั้น 4',
    mobs: [
      { id: 1264, name: 'Merman' },
      { id: 1065, name: 'Strouf' },
      { id: 1069, name: 'Swordfish' },
      { id: 1108, name: 'Deviace' },
      { id: 1142, name: 'Marine Sphere' },
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
          </Link>
        </li>
      ))}
    </ul>
  );
}

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

      <header className="phero">
        <p className="phero__date">ประกาศ 10–11 พฤศจิกายน 2569</p>
        <h1 className="phero__title">แพทช์ 12 พ.ย. · เลเวลตัน 80</h1>
        <p className="phero__lead">
          ขยายเลเวลตันเป็น 80 · ดันเจี้ยนใหม่ Karu และ Izlude ใต้น้ำชั้น 4–5 · Memorial Dungeon Ant Hell ·
          อีเวนต์ล่า Hode/Orc Warrior, แลก Blacksmith Blessing, Reset Cat รีเซ็ตฟรี
        </p>
        <p className="phero__pill">ปิดปรับปรุง พฤหัส 12 พ.ย. 08:00 น. เวลาไทย</p>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>เขียนก่อนแพทช์ลง</strong> จากประกาศ Discord ทางการ ซึ่งบอกเป็นหัวข้อสั้นๆ ทีมงานแจ้งว่ารายละเอียดจะประกาศแยก ·
        ไฟล์เกมชุดล่าสุด (9 พ.ย.) ยังไม่มีของแพทช์นี้ · ข้อมูลมอนและดันเจี้ยนด้านล่างเป็นข้อมูลเดิมของเว็บ อาจเปลี่ยนหลังแพทช์ลง
      </aside>

      <section className="phl" aria-label="สรุปแพทช์" style={{ marginTop: 18 }}>
        {HIGHLIGHTS.map((h) => (
          <article key={h.title} className="phl__tile">
            <p className="phl__big">{h.big}</p>
            <h2 className="phl__title">{h.title}</h2>
            <p className="phl__body">{h.body}</p>
            {h.href && <a className="phl__link" href={h.href}>{h.link} →</a>}
          </article>
        ))}
      </section>

      <section id="maint" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">1</span>เวลาปิดปรับปรุง (เวลาไทย)</h2>
        <div className="card card--yellow">
          <table className="stat-table ct-times">
            <tbody>
              <tr><td>วันที่</td><td className="num">พฤหัส 12 พ.ย. 2569</td></tr>
              <tr><td>เริ่มปิด</td><td className="num">08:00 น.</td></tr>
              <tr><td>เปิดเซิร์ฟ</td><td className="num">ยังไม่ประกาศ</td></tr>
            </tbody>
          </table>
          <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
            เวลาอาจเลื่อนได้ ถ้าเปลี่ยนทีมงานจะประกาศก่อน · ออกจากเกมก่อน 08:00 น. ·
            ของใน Kafra Shop บางชิ้นอาจหมดรอบหลังปิดปรับปรุง ดูวันหมดเขตในร้านก่อน
          </p>
        </div>
      </section>

      <section id="level" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">2</span>เลเวลตัน 80 และ EXP</h2>
        <div className="ct-two">
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>Base Lv 70 → 80</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              ขยายเฉพาะ Base Level · Job Level ยังตันที่ 70 เท่าเดิม · เพิ่มเควสรายวันสำหรับ Lv 80 ด้วย
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              เครื่องมือในเว็บ (สกิล บิลด์ อุปกรณ์ Memorial) ยังคิดที่เลเวลตัน 70 จนกว่าแพทช์ลงแล้ว ·
              ตามแผนปีแรก <Link href="/news/roadmap">โรดแมป</Link> เดือน พ.ย. คือขยายเลเวลตันกับ Ant Hell ตรงกับรอบนี้
            </p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>EXP เลเวล 2–70 ลดลง</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              EXP ที่ต้องใช้ขึ้นเลเวล Base 2 ถึง 70 น้อยลง ประกาศยังไม่บอกว่าลดเท่าไร
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              ตารางใน <Link href="/guides/exp">ไกด์ EXP</Link> เป็นค่าก่อนแพทช์ จะอัปเดตเมื่อได้ตัวเลขใหม่
            </p>
          </div>
        </div>
      </section>

      <section id="dungeons" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">3</span>ดันเจี้ยนใหม่</h2>
        <div className="ct-two">
          {DUNGEONS.map((d) => (
            <div key={d.code} className="card">
              <h3 className="pxh" style={{ marginTop: 0 }}>
                <Link href={`/database/maps/${d.code}`}>{d.name}</Link>
              </h3>
              <p className="muted" style={{ margin: '0 0 10px', fontSize: 13.5 }}>{d.th} · {d.where}</p>
              <MobList mobs={d.mobs} />
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          รายชื่อมอนเป็นข้อมูลเดิมของเว็บ ยังไม่ได้เช็กกับเกมหลังแพทช์ · Karu ตอนแมพเปิดเมื่อ 28 ต.ค. ยังไม่มีมอน
        </p>
      </section>

      <section id="memorial" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">4</span>Memorial Dungeon Ant Hell และอุปกรณ์ Lv 70</h2>
        <div className="ct-two">
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>Ant Hell (Lv 70)</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              เข้าเป็นปาร์ตี้ · อุดบ่อพิษให้ครบ แล้วสู้บอส <b>Cannibal Maya</b> (HP 2.2 ล้าน ธาตุดิน 4)
            </p>
            <MobList mobs={[{ id: 1147, name: 'Maya' }, { id: 1095, name: 'Andre' }]} />
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              ข้อมูลจากไกด์ผู้เล่นก่อนเปิดบน Global รูปในการ์ดเป็นมอนต้นแบบ ไม่ใช่ตัวในดัน ·{' '}
              <Link href="/guides/memorial-dungeons">ดันเจี้ยนความทรงจำ</Link>
            </p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>อุปกรณ์ Memorial Lv 70</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              ประกาศเขียนว่า &ldquo;Level 70 Memorial Dungeon Equipment&rdquo; · ในเว็บคือแรงค์ III <b>Expedition</b> (สวมได้ Lv 70)
              อัปจากแรงค์ IV ด้วย Faintly Glowing Crystal
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              <Link href="/guides/memorial-gear">อุปกรณ์ Memorial ทุกแรงค์</Link> · ประกาศยังไม่บอกว่าเปิดทางอัปแบบไหน
            </p>
          </div>
        </div>
      </section>

      <section id="events" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">5</span>อีเวนต์และร้าน</h2>
        <div className="ct-two">
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>Hunting Season: Hode และ Orc Warrior</h3>
            <MobList mobs={[{ id: 1127, name: 'Hode' }, { id: 1023, name: 'Orc Warrior' }]} />
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              Hode อยู่ <Link href="/database/maps/moc_fild17">Sograt Desert (moc_fild17)</Link> ·
              Orc Warrior อยู่ <Link href="/database/maps/gef_fild10">Orc Village (gef_fild10)</Link> ·
              ประกาศยังไม่บอกกติกาและของรางวัล
            </p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>แลก Blacksmith Blessing</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              อีเวนต์แลก <Link href="/database/items/6635">Blacksmith Blessing</Link> ของที่กันอุปกรณ์แตกตอนตีบวก ·
              ประกาศยังไม่บอกว่าแลกด้วยอะไร
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              ตอนนี้ได้จากกล่อง MVP Raid ด้วย (<Link href="/guides/mvp">ไกด์ MVP</Link>)
            </p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>Reset Cat กลับมา</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              รีเซ็ตสเตตัสและสกิลฟรี · ประกาศยังไม่บอกว่าถึงวันไหน
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              ปกติฟรีถึง Lv 40 เกินจากนั้นเสีย Zelstar (<Link href="/guides/social">ค่ารีเซ็ต</Link>)
            </p>
          </div>
          <div className="card">
            <h3 className="pxh" style={{ marginTop: 0 }}>Kafra Shop</h3>
            <p style={{ margin: 0, lineHeight: 1.65 }}>
              เซิร์ฟ SEA: Light Gacha Scroll · เซิร์ฟ EU: Costume Package
            </p>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              <Link href="/database/cash-shop">ร้าน Kafra</Link> · ยังไม่มีรายการของในกาชา
            </p>
          </div>
        </div>
      </section>

      <section id="ongoing" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">6</span>ที่ยังเล่นได้ต่อ</h2>
        <Link href="/news/events-2026-11" className="pevents">
          <span className="pevents__tag">ถึง 26 พ.ย.</span>
          <span className="pevents__body">
            <strong>Gatchaman · Black Friday EXP x2</strong>
            <small>เควสคอลแลบที่ Morocc · EXP x2 ดรอป +20% ทุกเสาร์อาทิตย์ · คอสตูมผี Ghostly</small>
          </span>
          <span className="pevents__go" aria-hidden="true">▶</span>
        </Link>
      </section>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศ Discord ทางการ Ragnarok Zero: Global &ldquo;Scheduled Maintenance – 12th November 2026&rdquo; (10 พ.ย. 2569)
        และ &ldquo;Scheduled Maintenance Reminder – 12th November, 2026&rdquo; (11 พ.ย. 2569) · มอน แมพ และ Memorial Dungeon จากฐานข้อมูลของเว็บก่อนแพทช์ ·
        หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

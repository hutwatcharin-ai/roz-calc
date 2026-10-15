// app/news/patch-2026-10-15/page.tsx
//
// The 15 Oct 2026 patch. First written from the maintenance reminder the
// owner pasted that morning; filled in the same day from the official pages
// (update 156, event 157, the Guild Hall of Fame tabs -- the owner's
// screenshots, PDFs and summary, Ragnarok-Zero-Update-2026-10-15.th.md):
// where each raid is, the Deep Deep Sea schedule and monsters. Whatever those
// pages do not spell out stays marked unknown.
//
// What is ours: the two MVPs' and Marc's stats and maps (monsters,
// monster_spawns), Marc Card's effect (item 4105's own description), and that
// Marc's home map is not open yet (data/map-availability.json: iz_dun03 TBD)
// -- which is why the event is the "early" chance the notice talks about.
import '../patch-2026-10-01/page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { CostumeCell } from '@/components/CostumeFit';
import './page.css';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseRead } from '@/lib/supabase';
import { ELEMENT_TH, RACE_TH } from '@/lib/monster-th';
import availability from '@/data/map-availability.json';

export const revalidate = 3600;

const PATH = '/news/patch-2026-10-15';
const PUBLISHED = '2026-10-15T08:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 15 ต.ค. 2569 Ragnarok Zero — MVP Raid Amon Ra, Baphomet และการ์ด Marc',
  description:
    'สรุปแพทช์ 15 ต.ค. 2569 ของ Ragnarok Zero Global ภาษาไทย: MVP Raid ใหม่ Amon Ra กับ Baphomet ค่าสถานะ ธาตุ และแมพ, อีเวนต์ GM The Deep Deep Sea ล่า Marc เอาการ์ดกันแช่แข็ง, Guild Hall of Fame ซีซั่น 1 และคอสตูมฮาโลวีนใน Kafra Shop',
};

const RAID_MVPS = [1511, 1039];
const MARC = 1045;
const MARC_CARD = 4105;

const HALLOWEEN_BOXES = [
  {
    id: 201148, tier: 'special', name: 'Special Shadow Costume Box',
    costumes: [
      { id: 19893, name: 'Fasolla Magic Hat', slot: 'หัวบน', quote: 'โดเรมีโดเรมีซ้อลหล่า~ หนูขอเวลาซักสามนาที....', note: '' },
      { id: 31852, name: "Witch's Cloak", slot: 'หัวล่าง', quote: 'ผ้าคลุมที่มอบให้แก่แม่มดฝึกหัด', note: 'ในเกมนับเป็นช่องหัวล่าง' },
    ],
  },
  {
    id: 201149, tier: 'premium', name: 'Premium Shadow Costume Box',
    costumes: [
      { id: 410198, name: 'Deviruchi Party', slot: 'หัวกลาง', quote: 'สวมใส่แล้วเหมือนได้เข้าร่วมปาร์ตี้กับเหล่า Deviruchi', note: 'ขยับได้' },
      { id: 20588, name: 'Broom of Witch', slot: 'ผ้าคลุม', quote: 'ไม้กวาดในฝันของผู้ที่เลือกเดินบนเส้นทางแห่งเวทมนตร์', note: '' },
    ],
  },
] as const;
const BOUND_NEW = [
  { id: 401615, name: 'Helmet of Light and Darkness', slot: 'หัวบน', quote: 'มงกุฎสำหรับวีรบุรุษผู้กอบกู้ Rune-Midgarts' },
  { id: 410201, name: 'Haunting Skull', slot: 'หัวกลาง', quote: 'กะโหลกวิญญาณกับหนังสือลอยวนรอบตัว' },
  { id: 420449, name: 'Abyssal Hair', slot: 'หัวล่าง', quote: 'วิกผมสไตล์คลาสสิก' },
  { id: 421025, name: 'Eremes Scarf', slot: 'หัวล่าง', quote: 'ผ้าพันคอแดงขาดรุ่งริ่งแบบ Eremes Guile' },
  { id: 480971, name: 'Wings of Uriel', slot: 'ผ้าคลุม', quote: 'ปีกมหาเทวทูต Uriel' },
];

const CLOSED = (availability as { maps: Record<string, { when: string; area?: string }> }).maps;

const HIGHLIGHTS = [
  { big: '2', title: 'MVP Raid ใหม่', body: 'Amon Ra และ Baphomet', href: '#raids', link: 'ดูค่าสถานะและธาตุ' },
  { big: 'GM', title: 'The Deep Deep Sea', body: '15-29 ต.ค. ทุกวัน 19:00-19:30 น. (Odin, Loki) ล่า Marc เอาการ์ดก่อนแมพเปิด', href: '#marc', link: 'เวลาและวิธีเข้า' },
  { big: 'S1', title: 'Guild Hall of Fame', body: 'ซีซั่น 1 ถึง 7 ม.ค. 2570 · เควส Liechtenauer เก็บคะแนนกิลด์', href: '/news/guild-hall-of-fame-s1', link: 'วิธีเก็บคะแนนและรางวัล' },
  { big: 'HW', title: 'คอสตูมฮาโลวีน', body: `กาชา Shadow Scroll ลุ้นกล่องแล้วเลือกเองได้ 1 จาก 2 ชิ้น · คอสตูมใหม่ ${4 + BOUND_NEW.length} แบบ`, href: '#halloween', link: 'ดูภาพตอนใส่' },
  { big: 'FIX', title: 'ปรับระบบ แก้บั๊ก', body: 'ประกาศยังไม่บอกว่าแก้อะไร' },
];

interface Mob {
  id: number;
  name_en: string;
  level: number;
  hp: number | null;
  element: string | null;
  race: string | null;
  size: string | null;
  monster_spawns: { map_code: string; map_display_name: string | null }[];
}

const SIZE_TH: Record<string, string> = { Small: 'เล็ก', Medium: 'กลาง', Large: 'ใหญ่' };

/** "Shadow 3" or "Shadow" in Thai, kept as-is when we have no word for it. */
function elementTh(el: string | null): string | null {
  if (!el) return null;
  const [name, lv] = el.split(' ');
  return ELEMENT_TH[name] ? `${ELEMENT_TH[name]}${lv ? ` ${lv}` : ''}` : el;
}

function Stats({ m }: { m: Mob }) {
  const facts = [
    `Lv ${m.level}`,
    m.hp != null ? `HP ${m.hp.toLocaleString('en-US')}` : null,
    elementTh(m.element) ? `ธาตุ${elementTh(m.element)}` : null,
    m.race ? `เผ่า${RACE_TH[m.race] ?? m.race}` : null,
    m.size ? `ขนาด${SIZE_TH[m.size] ?? m.size}` : null,
  ].filter(Boolean);
  return <span className="pmob__meta">{facts.join(' · ')}</span>;
}

export default async function Patch20261015Page() {
  const { data, error } = await supabaseRead()
    .from('monsters')
    .select('id, name_en, level, hp, element, race, size, monster_spawns(map_code, map_display_name)')
    .in('id', [...RAID_MVPS, MARC]);
  const mobs = (data ?? []) as unknown as Mob[];
  const raids = RAID_MVPS.map((id) => mobs.find((m) => m.id === id)).filter(Boolean) as Mob[];
  const marc = mobs.find((m) => m.id === MARC);
  // One row per map name: iz_dun03 and its iz_d03_a/_b/_z copies all read
  // "Undersea Cave 4F". The plain code is put last so it is the one kept.
  const isCopy = (code: string) => /_[a-z]$/.test(code);
  const marcMaps = [...new Map(
    [...(marc?.monster_spawns ?? [])]
      .sort((a, b) => Number(isCopy(b.map_code)) - Number(isCopy(a.map_code)))
      .map((s) => [s.map_display_name ?? s.map_code, s]),
  ).values()];

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าว', path: '/news' },
          { name: 'แพทช์ 15 ต.ค.', path: PATH },
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
        <span className="crumbs__here">แพทช์ 15 ต.ค.</span>
      </nav>

      <header className="phero">
        <p className="phero__date">อัปเดต 15 ตุลาคม 2569</p>
        <h1 className="phero__title">MVP Raid ใหม่ Amon Ra กับ Baphomet</h1>
        <p className="phero__lead">
          เพิ่ม MVP Raid 2 ตัว · อีเวนต์ GM ล่า Marc เอาการ์ดกันแช่แข็ง · Guild Hall of Fame ซีซั่น 1 · คอสตูมฮาโลวีนใน Kafra Shop
        </p>
        <p className="phero__pill">ปิดปรับปรุงเริ่ม 08:00 น. เวลาไทย</p>{' '}
        <Link className="phero__pill phero__pill--link" href="/news/guild-hall-of-fame-s1">ไกด์ Guild Hall of Fame →</Link>
      </header>

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

      {error && (
        <p className="filterstate" role="alert" style={{ marginTop: 14 }}>
          โหลดข้อมูลจากฐานข้อมูลไม่ครบ บางส่วนด้านล่างอาจว่าง
        </p>
      )}

      <section id="raids" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">MVP Raid ใหม่ 2 ตัว</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14 }}>
          <strong>Amon Ra</strong> ในส่วนลึกของ Pyramid (<code>/navi moc_pryd06 99/121</code>) · <strong>Baphomet</strong> ใน Labyrinth Forest ชั้น 3 (<code>/navi prt_maze03 93/104</code>) ·
          เข้าแบบเดียวกับ MVP Raid ตัวอื่น รับเควสรายวันที่ Eden Group แล้วเข้าประตูแดง · <Link href="/guides/mvp">ดูวิธีเข้า MVP Raid</Link>
        </p>
        <ul className="pmobs" style={{ marginTop: 10 }}>
          {raids.map((m) => (
            <li key={m.id}>
              <Link href={`/database/monsters/${m.id}`} className="pmob">
                <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                <span className="pmob__name">{m.name_en}</span>
                <Stats m={m} />
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          ทั้งสองตัวดรอป <Link href="/database/items/107812">Guild&apos;s Honor (MVP)</Link> = 100 คะแนน{' '}
          <Link href="/news/guild-hall-of-fame-s1#points">Guild Hall of Fame</Link> ·
          ไคลเอนต์แพทช์ 1 ต.ค. มี<Link href="/guides/mvp#dolls">กล่องรางวัลตุ๊กตา Baphomet กับ Amon Ra</Link>รออยู่แล้ว ·
          ประกาศไม่ได้บอกเงื่อนไขเข้า Raid ของรางวัล และว่าตุ๊กตาเปิดพร้อมกันไหม
        </p>
      </section>

      <section id="marc" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <p className="stagebanner" aria-hidden="true">GM EVENT · THE DEEP DEEP SEA</p>
        <h2 className="section-title">ล่า Marc เอา Marc Card</h2>
        <div className="pdun__head" style={{ marginTop: 8 }}>
          {marc && (
            <Link href={`/database/monsters/${MARC}`} className="pmob" style={{ minWidth: 120 }}>
              <span className="pmob__art"><img src={`/images/monsters/${MARC}.gif`} alt="" loading="lazy" /></span>
              <span className="pmob__name">{marc.name_en}</span>
              <Stats m={marc} />
            </Link>
          )}
          <div>
            <p style={{ margin: 0 }}>
              <Link href={`/database/cards/${MARC_CARD}`}><strong>Marc Card</strong></Link> ใส่ชุดเกราะ ·{' '}
              <strong>กันสถานะแช่แข็ง 100%</strong> และต้านธาตุน้ำ +5%
            </p>
            <p className="pdun__note">
              กันโดนแช่แข็งจากสกิลอย่าง Frost Diver และ Storm Gust ได้ขาด · ปกติ Marc เกิดใน
              {marcMaps.length > 0
                ? marcMaps.map((s, i) => (
                    <span key={s.map_code}>
                      {i > 0 ? ',' : ''} <Link href={`/database/maps/${s.map_code}`}>{s.map_display_name ?? s.map_code}</Link>
                      {CLOSED[s.map_code] ? ' (ยังไม่เปิด)' : ''}
                    </span>
                  ))
                : ' แมพที่ยังไม่มีข้อมูล'}
              {' '}อีเวนต์นี้จึงเป็นโอกาสแรกที่จะได้การ์ด
            </p>
          </div>
        </div>
        <div className="ptimes">
          <div><b>15-29 ต.ค. ทุกวัน</b><span>Odin, Loki (SEA): <strong>19:00-19:30 น.</strong> เวลาไทย</span><span>Skadi (EU): 01:00-01:30 น. ของวันถัดไป</span></div>
          <div><b>ที่ <Link href="/database/maps/beach_dun">Western Cave Karu (beach_dun)</Link></b><span>GM เรียกมอนตามจุดต่างๆ ทั่วแมพ เดินหาแล้วตี</span></div>
        </div>
        <p className="muted" style={{ margin: '8px 0 4px', fontSize: 14 }}>มอนที่ออกในอีเวนต์</p>
        <ul className="pcards">
          {[[1045, 4105, 'Marc'], [1064, 4067, 'Megalodon'], [1044, 4093, 'Obeaune']].map(([mob, card, name]) => (
            <li key={mob}>
              <Link href={`/database/cards/${card}`} className="pcard">
                <img src={`/images/monsters/${mob}.gif`} alt="" className="pcard__mob" loading="lazy" />
                <span className="pcard__name">{name} Card</span>
                <span className="pcard__from">จาก {name}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          หน้าอีเวนต์ทางการบอกว่า Marc Card ช่วยคนที่เตรียมลง <Link href="/guides/woe">WoE</Link> · ไม่ได้บอกอัตราดรอป จำนวนมอนต่อรอบ และไม่รับประกันว่าได้การ์ด
        </p>
      </section>

      {/* Halloween, from the 15 Oct client itself (data/game-items.json): the
          two Shadow costume boxes name what they hold, each costume's own
          text says where it sits, and the fitting-room pictures are drawn
          from its sprites (scripts/build-costume-fit.py). Price and the odds
          of each box are not in the client. */}
      <section id="halloween" className="hwsec">
        <p className="hwsec__kicker" aria-hidden="true">🎃 HALLOWEEN · SHADOW SCROLL</p>
        <h2 className="hwsec__title">คอสตูมฮาโลวีน กาชา Shadow Scroll</h2>
        <ol className="hwflow">
          <li><b>ซื้อกล่อง</b><span><Link href="/database/items/201146">Shadow Scroll Box</Link> (1 ใบ) หรือ <Link href="/database/items/201147">10 Shadow Scroll Box</Link> ใน Kafra Shop</span></li>
          <li><b>เปิด Shadow Scroll</b><span><Link href="/database/items/108332">Shadow Scroll</Link> &ldquo;เมื่อใช้ อาจมีบางสิ่งปรากฏขึ้น&rdquo; ลุ้นได้กล่องคอสตูม</span></li>
          <li><b>เลือก 1 ชิ้น</b><span>กล่อง Special หรือ Premium ให้เลือกคอสตูมเองได้ 1 จาก 2 ชิ้นในกล่องนั้น</span></li>
        </ol>
        {HALLOWEEN_BOXES.map((box) => (
          <div key={box.id} className={`hwbox hwbox--${box.tier}`}>
            <p className="hwbox__head">
              <span className="hwbox__tag">{box.tier === 'premium' ? 'PREMIUM' : 'SPECIAL'}</span>
              <Link href={`/database/items/${box.id}`}>{box.name}</Link>
              <small>เลือกได้ 1 ชิ้น</small>
            </p>
            <ul className="hwcards">
              {box.costumes.map((c) => (
                <li key={c.id}>
                  <Link href={`/database/costumes/${c.id}`} className="hwcard">
                    <span className="hwcard__stage"><CostumeCell id={c.id} scale={2} box={150} /></span>
                    <span className="hwcard__body">
                      <span className="hwcard__slot">{c.slot}</span>
                      <strong className="hwcard__name">{c.name}</strong>
                      <span className="hwcard__quote">&ldquo;{c.quote}&rdquo;</span>
                      {c.note && <span className="hwcard__note">{c.note}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <h3 className="hwsub">คอสตูมใหม่อื่นในไฟล์เกม (แบบผูกตัว)</h3>
        <p className="muted" style={{ margin: '2px 0 10px', fontSize: 14 }}>มากับแพทช์นี้ ยังไม่รู้ว่าแจกหรือขายทางไหน · Costume Unbinding Injector ใช้ไม่ได้</p>
        <ul className="hwmini">
          {BOUND_NEW.map((c) => (
            <li key={c.id}>
              <Link href={`/database/costumes/${c.id}`} className="hwmini__card">
                <span className="hwmini__stage"><CostumeCell id={c.id} scale={1} box={72} /></span>
                <span><strong>{c.name}</strong><small>{c.slot} · {c.quote}</small></span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="muted" style={{ marginTop: 12, fontSize: 13.5 }}>
          ภาพจากไฟล์ในเกม ใส่บนตัว Novice · คอสตูมที่ขยับได้จะขยับในภาพ · ยังไม่รู้: ราคา Shadow Scroll Box และโอกาสได้กล่อง Special/Premium
        </p>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2 className="section-title">ส่วนที่ยังไม่มีรายละเอียด</h2>
        <ul style={{ margin: '6px 0 0', paddingInlineStart: 22, lineHeight: 1.7 }}>
          <li><strong>รางวัล Guild Hall of Fame พรีซีซั่น</strong> แจกรอบนี้ · ยังไม่รู้ว่าแต่ละอันดับได้อะไรและรับทางไหน</li>
          <li><strong>ปรับระบบและแก้บั๊ก</strong> · ยังไม่มีรายการ</li>
        </ul>
      </section>

      <aside className="pnote">
        สรุปจากประกาศปิดปรับปรุง หน้าอัปเดต และหน้าอีเวนต์ทางการ (15 ต.ค.) · ค่าสถานะมอนและผลการ์ดมาจากข้อมูลเกมในฐานข้อมูลเรา ·
        อีเวนต์ EXP/ดรอปเพิ่ม (13-15 ต.ค.) จบตอนปิดปรับปรุงนี้ · <Link href="/news">ข่าวทั้งหมด</Link>
      </aside>
    </main>
  );
}

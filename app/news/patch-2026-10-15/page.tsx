// app/news/patch-2026-10-15/page.tsx
//
// The 15 Oct 2026 patch. The publisher's maintenance reminder (owner pasted
// it on 15 Oct 2026, the morning of the patch -- the GNJOY site is off limits
// to us) is all there is so far: two new MVP raids, Guild Hall of Fame season
// 1, the GM event "The Deep Deep Sea" with Marc, Halloween costumes in the
// Kafra Shop, fixes. It says fuller notes come separately, so every part the
// notice does not spell out is marked unknown and the page is to be extended
// when the notes arrive.
//
// What is ours: the two MVPs' and Marc's stats and maps (monsters,
// monster_spawns), Marc Card's effect (item 4105's own description), and that
// Marc's home map is not open yet (data/map-availability.json: iz_dun03 TBD)
// -- which is why the event is the "early" chance the notice talks about.
import '../patch-2026-10-01/page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
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

const CLOSED = (availability as { maps: Record<string, { when: string; area?: string }> }).maps;

const HIGHLIGHTS = [
  { big: '2', title: 'MVP Raid ใหม่', body: 'Amon Ra และ Baphomet', href: '#raids', link: 'ดูค่าสถานะและธาตุ' },
  { big: 'GM', title: 'The Deep Deep Sea', body: 'อีเวนต์ GM ได้ล่า Marc เอา Marc Card ก่อนแมพเปิด', href: '#marc', link: 'Marc Card ทำอะไร' },
  { big: 'S1', title: 'Guild Hall of Fame', body: 'เริ่มซีซั่น 1 และแจกรางวัลพรีซีซั่น', href: '/guides/guild', link: 'ไกด์กิลด์' },
  { big: 'HW', title: 'คอสตูมฮาโลวีน', body: 'คอสตูมธีมฮาโลวีนใหม่ใน Kafra Shop' },
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
        <p className="phero__pill">ปิดปรับปรุงเริ่ม 08:00 น. · ประกาศยังไม่บอกเวลาเปิด</p>
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
          ไคลเอนต์แพทช์ 1 ต.ค. มี<Link href="/guides/mvp#dolls">กล่องรางวัลตุ๊กตา Baphomet กับ Amon Ra</Link>รออยู่แล้ว ·
          ประกาศรอบนี้ไม่ได้บอกว่าเปิดพร้อม Raid หรือไม่
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
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5 }}>
          ยังไม่รู้: อีเวนต์จัดที่ไหน กี่วัน และอัตราดรอปการ์ดในอีเวนต์ · ประกาศบอกแค่ว่าเป็นอีเวนต์ช่วงสั้น
        </p>
      </section>

      <section style={{ marginTop: 34 }}>
        <h2 className="section-title">ส่วนที่ยังไม่มีรายละเอียด</h2>
        <ul style={{ margin: '6px 0 0', paddingInlineStart: 22, lineHeight: 1.7 }}>
          <li>
            <strong>Guild Hall of Fame ซีซั่น 1</strong> เริ่มแล้ว และแจกรางวัลของพรีซีซั่น · ยังไม่รู้ว่านับคะแนนจากอะไรและรางวัลคืออะไร ·{' '}
            <Link href="/guides/woe">ไกด์ WoE</Link>
          </li>
          <li><strong>คอสตูมฮาโลวีนใน Kafra Shop</strong> · ยังไม่รู้ชื่อชิ้นและราคา</li>
          <li><strong>ปรับระบบและแก้บั๊ก</strong> · ยังไม่มีรายการ</li>
        </ul>
      </section>

      <aside className="pnote">
        สรุปจากประกาศปิดปรับปรุงวันที่ 15 ต.ค. ซึ่งบอกว่ารายละเอียดเต็มจะประกาศแยก · ค่าสถานะมอนและผลการ์ดมาจากข้อมูลเกมในฐานข้อมูลเรา ·
        จะเติมหน้านี้เมื่อมีประกาศเต็ม · <Link href="/news">ข่าวทั้งหมด</Link>
      </aside>
    </main>
  );
}

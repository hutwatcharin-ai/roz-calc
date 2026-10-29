// app/news/patch-2026-10-29/page.tsx
//
// The 29 Oct 2026 patch, from the two Discord maintenance notices (27 Oct and
// the 28 Oct reminder with the highlight list) and the WoE EU schedule notice
// (23 Oct). The full patch notes are "shared separately" and had not come out
// when this was written, so the notice decides only what is listed; which
// Clock Tower floors open, the event steps and the costumes stay unknown.
//
// Rewritten the same evening at the owner's request ("more detail, more
// interesting"), on the 1 Oct page's layout: what lives on each of the eight
// floors is ours (monster_spawns), and so are the cards, star pieces and
// sets that only Clock Tower monsters drop -- every one of these monsters
// spawns nowhere open before this patch (FRESH_BEFORE_PATCH below).
import '../patch-2026-10-01/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import ItemSetCard from '@/components/ItemSetCard';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseRead } from '@/lib/supabase';
import { mapImage } from '@/lib/map-image';
import { monsterLabel } from '@/lib/monster-known-as';
import { isCVariant } from '@/lib/c-variant';
import { ELEMENT_TH, RACE_TH } from '@/lib/monster-th';
import { setsOf, type ItemSet } from '@/lib/item-sets';
import starDroppers from '@/data/star-droppers.json';

// Monsters in the tower whose every spawn was on a closed map before the
// patch, worked out from data/map-availability.json on 29 Oct 2026 and frozen
// here (same as the 1 Oct page): once the Clock Tower maps are opened in that
// file, a live check would find nothing new and empty the card list.
const FRESH_BEFORE_PATCH = [
  1102, 1131, 1189, 1193, 1195, 1199, 1211, 1213, 1216, 1269, 1270, 1320, 1377, 2682, 2717, 2721, 2805, 2871, 2885,
  2894, 2910, 20175, 20176, 20177, 20178, 20179,
];

export const revalidate = 3600;

const PATH = '/news/patch-2026-10-29';
const PUBLISHED = '2026-10-28T18:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 29 ต.ค. 2569 Ragnarok Zero — เปิด Clock Tower, อีเวนต์ Gatchaman, Black Friday',
  description:
    'สรุปแพทช์ 29 ตุลาคม 2569 ของ Ragnarok Zero Global ภาษาไทย: ปิดเซิร์ฟ 08:00 น., ดันเจี้ยน Clock Tower มอนทุกชั้น การ์ดที่จะหาได้ครั้งแรกพร้อมผลการ์ด บอสชั้นใต้ดิน, เควสอีเวนต์ Curse of the Clock Tower, คอลแลบ Gatchaman, Black Friday, คอสตูมธีมผี และ WoE เซิร์ฟ EU เลื่อนเป็นตี 3',
};

const HIGHLIGHTS = [
  { big: '8', title: 'ดันเจี้ยน Clock Tower', body: 'หอนาฬิกา Al De Baran ชั้นบน 4 ชั้น ใต้ดิน 4 ชั้น', href: '#tower', link: 'มอนแต่ละชั้น' },
  { big: 'Q', title: 'เควสอีเวนต์', body: 'Curse of the Clock Tower' },
  { big: 'D', title: 'เควสรายวัน', body: 'เควสรายวันของ Clock Tower' },
  { big: 'EQ', title: 'อุปกรณ์ใหม่', body: 'อุปกรณ์ชุด Clock Tower ประกาศยังไม่บอกชื่อ' },
  { big: 'G', title: 'คอลแลบ Gatchaman', body: 'เริ่มอีเวนต์คอลแลบ Gatchaman' },
  { big: 'BF', title: 'Black Friday', body: 'อีเวนต์ Black Friday ของ ROZ Global' },
  { big: '👻', title: 'คอสตูมธีมผี', body: 'คอสตูมใหม่รับฮาโลวีน', href: '/tools/dress-up', link: 'ห้องแต่งตัว' },
  { big: '+1h', title: 'WoE เซิร์ฟ EU', body: 'เลื่อนเป็น 03:00–04:00 น. เวลาไทย', href: '#woe', link: 'ดูเวลา' },
];

const STAGES = [
  {
    key: 'upper',
    name: 'Clock Tower',
    th: 'หอนาฬิกา ชั้นบน',
    where: 'กลางเมือง Al De Baran',
    note: 'โลกของนาฬิกากับหนังสือ Rideword, Punk, Clock, Alarm เป็นตัวหลัก ชั้น 4 มี Owl Duke',
    codes: ['c_tower1', 'c_tower2', 'c_tower3', 'c_tower4'],
    labels: ['1F', '2F', '3F', '4F'],
  },
  {
    key: 'basement',
    name: 'Clock Tower Basement',
    th: 'หอนาฬิกา ใต้ดิน',
    where: 'ลงจากหอนาฬิกา Al De Baran',
    note: 'ยิ่งลงยิ่งแรง B2F ออร์ค B3F Penomena B4F Bathory กับ Joker',
    codes: ['alde_dun01', 'alde_dun02', 'alde_dun03', 'alde_dun04'],
    labels: ['B1F', 'B2F', 'B3F', 'B4F'],
  },
];
const CODES = STAGES.flatMap((s) => s.codes);

// Monsters in the tower with no fixed spawn count in the data (amount null):
// level 122-126, one per basement floor. How they appear is not in the data.
const BOSSES = [20179, 20178, 20177, 20175, 20176];

type StarPiece = { star: string; plainName: string; plainIcon: string; droppers: { id: number; name: string; rate: number | null }[] };
const STAR = (starDroppers as unknown as { pieces: Record<string, StarPiece> }).pieces;

interface Mon { id: number; name_en: string; level: number; is_aggressive: boolean; element: string | null; race: string | null }
interface Spawn { map_code: string; amount: number | null; monsters: Mon | null }
interface CardRow { monster_id: number; rate: number | null; items: { id: number; name_en: string; description_th: string | null } | null }
type Mob = Mon & { amount: number };

function floorMobs(rows: Spawn[]): Mob[] {
  const seen = new Map<number, Mob>();
  for (const row of rows) {
    const m = row.monsters;
    if (!m || isCVariant(m.name_en) || !row.amount) continue;
    seen.set(m.id, { ...m, amount: (seen.get(m.id)?.amount ?? 0) + row.amount });
  }
  return [...seen.values()].sort((a, b) => b.amount - a.amount);
}

/** The element and race most of a stage's monsters have, weighted by count. */
function mostly(mobs: Mob[], key: 'element' | 'race'): string | null {
  const count = new Map<string, number>();
  for (const m of mobs) if (m[key]) count.set(m[key]!, (count.get(m[key]!) ?? 0) + m.amount);
  const top = [...count.entries()].sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

const th = (map: Record<string, string>, v: string | null) => (v ? map[v] ?? v : '—');

export default async function Patch20261029Page() {
  const db = supabaseRead();
  const { data, error } = await db
    .from('monster_spawns')
    .select('map_code, amount, monsters(id, name_en, level, is_aggressive, element, race)')
    .in('map_code', CODES);
  const spawns = (data ?? []) as unknown as Spawn[];
  const monById = new Map(spawns.filter((s) => s.monsters).map((s) => [s.monsters!.id, s.monsters!]));
  const plainIds = [...monById.values()].filter((m) => !isCVariant(m.name_en)).map((m) => m.id);
  // Monsters every one of whose spawns is on a closed map: what this patch
  // makes reachable for the first time. Mimic, Whisper, Cramp and the like
  // already live elsewhere and stay out of the lists below.
  const fresh = new Set(plainIds.filter((id) => FRESH_BEFORE_PATCH.includes(id)));
  const cardsRes = await db
    .from('monster_drops')
    .select('monster_id, rate, items!inner(id, name_en, description_th, category)')
    .in('monster_id', plainIds)
    .eq('items.category', 'Card');
  const cardRows = ((cardsRes.data ?? []) as unknown as CardRow[]).filter((c) => c.items && fresh.has(c.monster_id));

  const byStage = STAGES.map((s) => ({ ...s, floors: s.codes.map((c) => floorMobs(spawns.filter((r) => r.map_code === c))) }));
  // Cards from monsters with a spawn count, one row per card; bosses apart.
  const seenCard = new Set<number>();
  const cards = cardRows
    .filter((c) => !BOSSES.includes(c.monster_id))
    .sort((a, b) => (monById.get(b.monster_id)?.level ?? 0) - (monById.get(a.monster_id)?.level ?? 0))
    .filter((c) => (seenCard.has(c.items!.id) ? false : (seenCard.add(c.items!.id), true)));
  const bossCards = new Map(cardRows.filter((c) => BOSSES.includes(c.monster_id)).map((c) => [c.monster_id, c.items!]));
  const sets = [...new Map(cardRows.flatMap((c) => setsOf(c.items!.id)).map((s): [string, ItemSet] => [s.name, s])).values()];
  const stars = Object.entries(STAR)
    .map(([id, p]) => ({ id, p, hits: p.droppers.filter((d) => fresh.has(d.id)) }))
    .filter((x) => x.hits.length > 0);
  const allMobs = byStage.flatMap((s) => s.floors.flat());
  const levels = allMobs.map((m) => m.level);
  const aggro = new Set(allMobs.filter((m) => m.is_aggressive).map((m) => m.id)).size;
  const kinds = new Set(allMobs.map((m) => m.id)).size;

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
          dateModified: PUBLISHED,
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
        <a className="phero__pill phero__pill--link" href="#cards">การ์ดใหม่ {cards.length} ใบ ↓</a>{' '}
        <a className="phero__pill phero__pill--link" href="#woe">WoE EU เลื่อนเวลา ↓</a>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>⚠ ข้อมูลอาจมีการเปลี่ยนแปลง</strong> หน้านี้สรุปจากประกาศก่อนปิดปรับปรุง ส่วนมอน การ์ด และชั้นต่างๆ มาจากข้อมูลเกมเดิม
        เกมจริงหลังแพทช์อาจไม่ตรงทั้งหมด ถ้ามีประกาศรายละเอียดหรือเข้าเกมแล้วเจอของใหม่ จะมาอัปเดตหน้านี้
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

      {error && (
        <p className="filterstate" role="alert" style={{ marginTop: 14 }}>
          โหลดข้อมูลจากฐานข้อมูลไม่ครบ บางส่วนด้านล่างอาจว่าง
        </p>
      )}

      {levels.length > 0 && (
        <section style={{ marginTop: 30 }}>
          <h2 className="section-title">ก่อนเข้าหอนาฬิกา</h2>
          <ul className="ct-facts">
            <li><strong>มอนเลเวล {Math.min(...levels)}–{Math.max(...levels)}</strong>สูงกว่าเพดาน 70 เกือบทุกตัว เกมนี้ตีมอนเลเวลสูงกว่าได้ EXP เต็ม</li>
            <li><strong>ตีก่อน {aggro} จาก {kinds} ชนิด</strong>เดินเข้าไปโดนรุมได้ง่าย พกยาและปีกแมลงวันไว้</li>
            {byStage.map((s) => {
              const mobs = s.floors.flat();
              return (
                <li key={s.key}>
                  <strong>{s.th}</strong>
                  ส่วนใหญ่ธาตุ {th(ELEMENT_TH, mostly(mobs, 'element'))} เผ่า {th(RACE_TH, mostly(mobs, 'race'))}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section id="tower" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">Clock Tower เจออะไรบ้าง</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14 }}>
          ประกาศยังไม่บอกว่าเปิดชั้นไหนบ้าง ข้างล่างคือมอนทุกชั้นตามข้อมูลเกม · เรียงจากที่เกิดเยอะสุด · กดรูปมอนดูของดรอป
        </p>

        {byStage.map((s) => {
          const pic = mapImage(s.codes[0]);
          return (
            <article key={s.key} id={s.key} className="pdun">
              <p className="stagebanner" aria-hidden="true">NEW STAGE UNLOCKED</p>
              <div className="pdun__head">
                {pic && <img className="pdun__map" src={pic.src} alt="" width={120} height={120} loading="lazy" />}
                <div>
                  <h3 className="pdun__name">{s.name} <span className="muted">{s.th}</span></h3>
                  <p className="pdun__where">{s.where} · {s.codes.length} ชั้น</p>
                  <p className="pdun__note">{s.note}</p>
                </div>
              </div>
              {s.codes.map((code, i) => {
                const mobs = s.floors[i];
                const lv = mobs.map((m) => m.level);
                return (
                  <div key={code} className="pfloor">
                    <p className="pfloor__label">
                      <Link href={`/database/maps/${code}`}>{s.labels[i]}</Link>
                      {lv.length > 0 && <span className="muted"> · Lv {Math.min(...lv)}–{Math.max(...lv)}</span>}
                    </p>
                    {mobs.length === 0 ? (
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>ไม่มีข้อมูลมอน</p>
                    ) : (
                      <ul className="pmobs">
                        {mobs.slice(0, 8).map((m) => (
                          <li key={m.id}>
                            <Link href={`/database/monsters/${m.id}`} className="pmob">
                              <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                              <span className="pmob__name">{monsterLabel(m.id, m.name_en)}</span>
                              <span className="pmob__meta">
                                Lv {m.level} · ×{m.amount}
                                {m.is_aggressive && <span className="pmob__aggro">ตีก่อน</span>}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </article>
          );
        })}
      </section>

      <section id="cards" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">สิ่งที่ประกาศไม่ได้บอก</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14 }}>
          มอนในหอนาฬิกาก่อนแพทช์นี้ไม่มีเกิดที่แมพไหนที่เปิดอยู่ ของข้างล่างจึงเพิ่งจะหาได้ ถ้าชั้นนั้นเปิด
        </p>

        <h3 className="pxh">การ์ดที่จะหาได้ครั้งแรก</h3>
        <ul className="pcards ct-cards">
          {cards.map((c) => {
            const m = monById.get(c.monster_id);
            return (
              <li key={c.items!.id}>
                <Link href={`/database/cards/${c.items!.id}`} className="pcard">
                  <img src={`/images/monsters/${c.monster_id}.gif`} alt="" className="pcard__mob" loading="lazy" />
                  <span className="pcard__name">{c.items!.name_en}</span>
                  <span className="pcard__from">
                    จาก {monsterLabel(c.monster_id, m?.name_en ?? '')}{m ? ` Lv ${m.level}` : ''}{c.rate != null ? ` · ${c.rate}%` : ''}
                  </span>
                  {c.items!.description_th && <span className="pcard__fx">{c.items!.description_th}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <h3 className="pxh">บอสชั้นใต้ดิน Lv 122–126</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          อยู่ในรายชื่อมอนของชั้นใต้ดินชั้นละตัว แต่ข้อมูลไม่บอกจำนวนหรือวิธีเกิด อาจเป็นบอสของเควสอีเวนต์ รอรายละเอียดแพทช์
        </p>
        <ul className="pcards ct-cards">
          {BOSSES.filter((id) => monById.has(id)).map((id) => {
            const m = monById.get(id)!;
            const card = bossCards.get(id);
            const floor = STAGES[1].labels[STAGES[1].codes.findIndex((c) => spawns.some((s) => s.map_code === c && s.monsters?.id === id))];
            return (
              <li key={id}>
                <Link href={`/database/monsters/${id}`} className="pcard">
                  <img src={`/images/monsters/${id}.gif`} alt="" className="pcard__mob" loading="lazy" />
                  <span className="pcard__name">{monsterLabel(id, m.name_en)}</span>
                  <span className="pcard__from">Lv {m.level}{floor ? ` · ${floor}` : ''} · ธาตุ {th(ELEMENT_TH, m.element)}</span>
                  {card && <span className="pcard__fx">{card.name_en}: {card.description_th ?? '—'}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {stars.length > 0 && (
          <>
            <h3 className="pxh">ของติดดาวที่มีมอนดรอปเพิ่ม</h3>
            <p className="muted pxp" style={{ fontSize: 14 }}>ของธรรมดาที่เอาไปแลกโทเคนปลุก ★ ได้ มีมอนในหอนาฬิกาดรอปด้วย</p>
            <ul className="pstar">
              {stars.map(({ id, p, hits }) => (
                <li key={id}>
                  <Link href={`/guides/star-gear#drops-${id}`} className="pstar__row">
                    <img src={p.plainIcon} alt="" width={28} height={28} loading="lazy" />
                    <span>
                      <strong>{p.star}</strong> <span className="muted">(ของธรรมดา {p.plainName})</span>
                      <span className="pstar__from">
                        ดรอปจาก {hits.map((d) => `${monsterLabel(d.id, d.name)}${d.rate != null ? ` ${d.rate}%` : ''}`).join(' · ')}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}

        {sets.length > 0 && (
          <>
            <h3 className="pxh">การ์ดคู่ที่ใช้การ์ดจากหอนาฬิกา</h3>
            <div className="isetgrid">
              {sets.map((s) => <ItemSetCard key={s.name} set={s} />)}
            </div>
          </>
        )}
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

      <aside className="pnote">
        <strong>ยังรอรายละเอียด</strong> ชั้นที่เปิด ขั้นตอนเควสอีเวนต์ ชื่ออุปกรณ์ใหม่ รางวัล Gatchaman กับ Black Friday และคอสตูมผี ประกาศบอกว่าจะแจ้งแยก ออกเมื่อไหร่จะเติมหน้านี้ ·{' '}
        ตีไหวไหมดูที่ <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
      </aside>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศ Discord ทางการ Ragnarok Zero: Global &ldquo;Global Scheduled Maintenance Reminder – 29th October, 2026&rdquo; (28 ต.ค. 2569)
        และ &ldquo;War of Emperium EU Schedule Adjustment&rdquo; (23 ต.ค. 2569) · มอน การ์ด และจุดเกิดจากฐานข้อมูลของเว็บนี้ · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

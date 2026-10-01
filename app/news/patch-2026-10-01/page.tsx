// app/news/patch-2026-10-01/page.tsx
//
// The 1 Oct 2026 patch, read against our own tables. The publisher's notice
// (30 Sep 2026, owner's screenshot -- the GNJOY site is off limits to us)
// names three new dungeons, the level 70 cap, a level 60-70 daily quest, two
// event quests, the Kumamon collab start, new Kafra Shop goods and the end of
// the Baby Shark collab. Only the notice decides what is listed; what lives on
// each floor is ours.
//
// Redesigned the same day at the owner's request ("make it nicer to read"):
// a dated hero, the notice as six tiles, and each dungeon as a card with its
// map picture and the monsters on each floor as sprites, most numerous first.
//
// Not shown on purpose: the MVPs whose raid maps sit in these areas. The
// notice names no MVP, and MVP Raid rotates by daily quest, so "Baphomet is
// out" would be our guess, not the notice.
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { mapImage } from '@/lib/map-image';
import { monsterLabel } from '@/lib/monster-known-as';
import ItemSetCard from '@/components/ItemSetCard';
import { ITEM_SETS } from '@/lib/item-sets';
import starDroppers from '@/data/star-droppers.json';
import { monsterModes } from '@/lib/monster-modes';

const isMini = (id: number) => { const m = monsterModes(id); return Boolean(m?.known && m.mini); };

export const revalidate = 3600;

const PATH = '/news/patch-2026-10-01';
const PUBLISHED = '2026-10-01T15:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 1 ต.ค. 2569 Ragnarok Zero — เลเวล 70, Labyrinth Forest, Sphinx, Mjolnir',
  description:
    'สรุปแพตช์ 1 ต.ค. 2569 ของ Ragnarok Zero Global เป็นภาษาไทย — เพดาน Base/Job Level 70, ดันใหม่ Labyrinth Forest, Sphinx, Mjolnir Abandoned Mine พร้อมมอนทุกชั้น, เควสรายวันเลเวล 60–70, อีเวนต์ Amon Ra และ Baphomet Cult, Kumamon',
};

const DUNGEONS = [
  {
    key: 'labyrinth',
    name: 'Labyrinth Forest',
    th: 'ป่าวงกต',
    where: 'ทางเหนือของ Prontera',
    note: 'ป่าวงกตเดินหลง ชั้น 3 มีหมาป่ากับงูตัวแรง',
    codes: ['prt_maze01', 'prt_maze02', 'prt_maze03'],
  },
  {
    key: 'sphinx',
    name: 'Sphinx',
    th: 'สฟิงซ์',
    where: 'ทะเลทราย Morroc',
    note: 'ยิ่งลงลึกยิ่งแรง ชั้นล่างมี Anubis กับ Pasana เป็นตัวหลัก',
    codes: ['in_sphinx1', 'in_sphinx2', 'in_sphinx3', 'in_sphinx4', 'in_sphinx5'],
  },
  {
    key: 'mjolnir',
    name: 'Mjolnir Abandoned Mine',
    th: 'เหมืองร้าง Mjolnir',
    where: 'ภูเขา Mjolnir · ในเกมชื่อแมพ Mjolnir Dead Pit',
    note: 'ชั้นบนเลเวลต่ำ ชั้น 2–3 มี Martin กับ Skeleton Worker',
    codes: ['mjo_dun01', 'mjo_dun02', 'mjo_dun03'],
  },
];

const HIGHLIGHTS = [
  { big: '70', title: 'เพดานเลเวลใหม่', body: 'Base Level และ Job Level สูงสุดเป็น 70', href: '/guides/exp', link: 'ดูตาราง EXP' },
  { big: '3', title: 'ดันเจี้ยนใหม่', body: 'Labyrinth Forest, Sphinx, Mjolnir Abandoned Mine', href: '#dungeons', link: 'ดูมอนแต่ละชั้น' },
  { big: '60–70', title: 'เควสรายวันใหม่', body: 'สำหรับตัวละครเลเวล 60 ถึง 70' },
  { big: '2', title: 'เควสอีเวนต์ใหม่', body: 'The Legend of Amon Ra และ The Baphomet Cult มีเฉพาะ Global' },
  { big: 'IV·III', title: 'ชุดดันใส่ได้เพิ่ม', body: 'ชุด Expedition (Lv 70) ใส่ได้แล้วตามเพดานใหม่', href: '/guides/memorial-gear', link: 'ดูชุดดัน' },
  { big: 'Shop', title: 'Kafra Shop และคอลแลบ', body: 'เริ่ม Kumamon · จบ Baby Shark · ของใหม่ Gacha Scroll, คอสตูม, แพ็กเกจผูกบัญชี' },
];

// What the notice does not say, worked out from our own data on 1 Oct 2026
// (owner's pick: everything except a level-cap warning). Every id below came
// from comparing data/map-availability.json before and after this patch:
// monsters whose every spawn was on a closed map and now has an open one.
const NEW_CARD_MONSTERS = [1120, 1092, 1243, 1169, 1101, 1145, 1209, 1121, 1151, 1098, 1140, 1154, 1164, 1178];
const NEW_SETS = ['Vagabond Wolf & Wolf Card', 'Cramp & Tarou Card'];
// Star pieces that gained an open dropper, and which newly reachable monster.
const NEW_STAR = [
  { star: 470418, monsters: [1101] },
  { star: 610092, monsters: [1145] },
  { star: 600070, monsters: [1209] },
  { star: 500124, monsters: [1209, 1151] },
  { star: 530080, monsters: [1154] },
];
const RAID_MVPS = [1039, 1157];
const LABYRINTH_CODES = ['prt_maze01', 'prt_maze02', 'prt_maze03'];

type StarPiece = { star: string; plainName: string; plainIcon: string; droppers: { id: number; name: string; rate: number | null }[] };
const STAR = (starDroppers as unknown as { pieces: Record<string, StarPiece> }).pieces;

interface CardRow {
  monster_id: number;
  rate: number | null;
  items: { id: number; name_en: string; icon_url: string | null; category: string | null } | null;
}

interface Spawn {
  map_code: string;
  map_display_name: string | null;
  amount: number | null;
  monsters: { id: number; name_en: string; level: number; is_aggressive: boolean } | null;
}

type Mob = { id: number; name: string; level: number; amount: number; aggressive: boolean };

/** Plain monsters on one floor, most numerous first; the C1-C9 copies dropped. */
function floorMobs(rows: Spawn[]): Mob[] {
  const seen = new Map<number, Mob>();
  for (const row of rows) {
    const m = row.monsters;
    if (!m || /^C\d /.test(m.name_en) || !row.amount) continue;
    const prev = seen.get(m.id);
    seen.set(m.id, { id: m.id, name: monsterLabel(m.id, m.name_en), level: m.level, amount: (prev?.amount ?? 0) + row.amount, aggressive: m.is_aggressive });
  }
  return [...seen.values()].sort((a, b) => b.amount - a.amount);
}

export default async function Patch20261001Page() {
  const db = supabaseBrowser();
  const { data, error } = await db
    .from('monster_spawns')
    .select('map_code, map_display_name, amount, monsters(id, name_en, level, is_aggressive)')
    .in('map_code', DUNGEONS.flatMap((d) => d.codes));
  const spawns = (data ?? []) as unknown as Spawn[];
  const [cardsRes, zenyRes, mvpRes] = await Promise.all([
    db.from('monster_drops').select('monster_id, rate, items!inner(id, name_en, icon_url, category)').in('monster_id', NEW_CARD_MONSTERS).eq('items.category', 'Card'),
    db.from('monster_farming_stats').select('monster_id, avg_zeny_per_kill'),
    db.from('monsters').select('id, name_en, level').in('id', RAID_MVPS),
  ]);
  const cardRows = ((cardsRes.data ?? []) as unknown as CardRow[]).filter((c) => c.items);
  const zeny = new Map(((zenyRes.data ?? []) as { monster_id: number; avg_zeny_per_kill: number | null }[]).map((z) => [z.monster_id, z.avg_zeny_per_kill]));
  const mvps = (mvpRes.data ?? []) as { id: number; name_en: string; level: number }[];
  const monsterName = new Map(spawns.filter((s) => s.monsters).map((s) => [s.monsters!.id, s.monsters!]));
  // Mini-bosses in Labyrinth, by the game's own mini-boss flag (a monster that
  // merely spawns once on a floor, like Creamy, is not one).
  const minis = [...new Map(
    spawns
      .filter((s) => LABYRINTH_CODES.includes(s.map_code) && s.monsters && isMini(s.monsters.id) && !/^C\d /.test(s.monsters.name_en))
      .map((s) => [s.monsters!.id, s.monsters!]),
  ).values()].sort((a, b) => (zeny.get(b.id) ?? 0) - (zeny.get(a.id) ?? 0));

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 1000 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ข่าวแพทช์', path: PATH },
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
        <Link href="/news/roadmap">ไทม์ไลน์อัปเดต</Link>
        <span className="crumbs__sep" aria-hidden="true">›</span>
        <span className="crumbs__here">แพทช์ 1 ต.ค.</span>
      </nav>

      <header className="phero">
        <p className="phero__date">อัปเดต 1 ตุลาคม 2569</p>
        <h1 className="phero__title">เลเวล 70 มาแล้ว พร้อมดันใหม่ 3 ที่</h1>
        <p className="phero__lead">
          Labyrinth Forest, Sphinx และ Mjolnir Abandoned Mine เปิดให้เข้าแล้ว · เควสรายวันใหม่สำหรับเลเวล 60–70 · อีเวนต์ Amon Ra กับ Baphomet Cult
        </p>
        <p className="phero__pill">ปิดปรับปรุง 08:00–14:00 น. เวลาไทย</p>{' '}
        <a className="phero__pill phero__pill--link" href="#hidden">การ์ดใหม่ {cardRows.length} ใบ และสิ่งที่ประกาศไม่ได้บอก ↓</a>
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

      <section id="dungeons" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">ดันเจี้ยนใหม่ เจออะไรบ้าง</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14 }}>มอนเรียงจากที่เกิดเยอะสุด · กดรูปมอนดูของดรอป · ป้ายแดงคือมอนที่ตีก่อน</p>

        {DUNGEONS.map((d) => {
          const pic = mapImage(d.codes[0]);
          return (
            <article key={d.key} id={d.key} className="pdun">
              <div className="pdun__head">
                {pic && <img className="pdun__map" src={pic.src} alt="" width={120} height={120} loading="lazy" />}
                <div>
                  <h3 className="pdun__name">{d.name} <span className="muted">{d.th}</span></h3>
                  <p className="pdun__where">{d.where} · {d.codes.length} ชั้น</p>
                  <p className="pdun__note">{d.note}</p>
                </div>
              </div>
              {d.codes.map((code, i) => {
                const rows = spawns.filter((s) => s.map_code === code);
                const mobs = floorMobs(rows);
                const levels = mobs.map((m) => m.level);
                return (
                  <div key={code} className="pfloor">
                    <p className="pfloor__label">
                      <Link href={`/database/maps/${code}`}>ชั้น {i + 1}</Link>
                      {levels.length > 0 && <span className="muted"> · Lv {Math.min(...levels)}–{Math.max(...levels)}</span>}
                    </p>
                    {mobs.length === 0 ? (
                      <p className="muted" style={{ margin: 0, fontSize: 13 }}>ไม่มีข้อมูลมอน</p>
                    ) : (
                      <ul className="pmobs">
                        {mobs.slice(0, 8).map((m) => (
                          <li key={m.id}>
                            <Link href={`/database/monsters/${m.id}`} className="pmob">
                              <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                              <span className="pmob__name">{m.name}</span>
                              <span className="pmob__meta">
                                Lv {m.level} · ×{m.amount}
                                {m.aggressive && <span className="pmob__aggro">ตีก่อน</span>}
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
        <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>
          เควสรายวันเลเวล 60–70 และเควสอีเวนต์ยังไม่มีในฐานข้อมูลของเรา ·
          อยากรู้ว่าตีไหวไหม ดูที่<Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
        </p>
      </section>

      <section id="hidden" style={{ marginTop: 34, scrollMarginTop: 90 }}>
        <h2 className="section-title">สิ่งที่ประกาศไม่ได้บอก</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 14 }}>
          เทียบแมพที่เปิดก่อนกับหลังแพทช์ในข้อมูลของเว็บนี้ แล้วดูว่าอะไรเพิ่งหาได้
        </p>

        <h3 className="pxh">การ์ดที่หาได้ครั้งแรก</h3>
        <p className="muted pxp">มอนพวกนี้ก่อนแพทช์เกิดแต่ในแมพที่ยังไม่เปิด การ์ดจึงเพิ่งตีได้</p>
        <ul className="pcards">
          {NEW_CARD_MONSTERS.flatMap((mid) => cardRows.filter((c) => c.monster_id === mid)).map((c) => (
            <li key={c.items!.id}>
              <Link href={`/database/cards/${c.items!.id}`} className="pcard">
                <img src={`/images/monsters/${c.monster_id}.gif`} alt="" className="pcard__mob" loading="lazy" />
                <span className="pcard__name">{c.items!.name_en}</span>
                <span className="pcard__from">
                  จาก {monsterLabel(c.monster_id, monsterName.get(c.monster_id)?.name_en ?? '')}
                  {monsterName.get(c.monster_id) ? ` Lv ${monsterName.get(c.monster_id)!.level}` : ''}
                  {c.rate != null ? ` · ${c.rate}%` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="pxh">ไอเทมเซ็ตที่ทำครบได้แล้ว</h3>
        <p className="muted pxp">การ์ดอีกใบในเซ็ตเพิ่งหาได้จากดันใหม่</p>
        <div className="isetgrid">
          {NEW_SETS.map((name) => ITEM_SETS.find((s) => s.name === name)).filter(Boolean).map((s) => (
            <ItemSetCard key={s!.name} set={s!} />
          ))}
        </div>

        <h3 className="pxh">ของติดดาวที่มีมอนดรอปเพิ่ม</h3>
        <p className="muted pxp">ของธรรมดาที่เอาไปแลกโทเคนปลุก ★ ได้ มีมอนในดันใหม่ดรอปด้วย</p>
        <ul className="pstar">
          {NEW_STAR.map(({ star, monsters }) => {
            const piece = STAR[String(star)];
            if (!piece) return null;
            return (
              <li key={star}>
                <Link href={`/guides/star-gear#drops-${star}`} className="pstar__row">
                  <img src={piece.plainIcon} alt="" width={28} height={28} loading="lazy" />
                  <span>
                    <strong>{piece.star}</strong> <span className="muted">(ของธรรมดา {piece.plainName})</span>
                    <span className="pstar__from">
                      ดรอปจาก{' '}
                      {monsters
                        .map((m) => piece.droppers.find((d) => d.id === m))
                        .filter(Boolean)
                        .map((d) => `${monsterLabel(d!.id, d!.name)}${d!.rate != null ? ` ${d!.rate}%` : ''}`)
                        .join(' · ')}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <h3 className="pxh">มินิบอสใน Labyrinth Forest</h3>
        <p className="muted pxp">มินิบอสเกิดชั้นละตัว ให้ซีนี่ต่อตัวสูงและการ์ดดี · ซีนี่คิดจากราคาขายของที่ดรอปคูณอัตราดรอป</p>
        <ul className="pmobs">
          {minis.map((m) => (
            <li key={m.id}>
              <Link href={`/database/monsters/${m.id}`} className="pmob">
                <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                <span className="pmob__name">{monsterLabel(m.id, m.name_en)}</span>
                <span className="pmob__meta">Lv {m.level}{zeny.get(m.id) ? ` · ≈${Math.round(zeny.get(m.id)!)}z` : ''}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h3 className="pxh">MVP ที่แมพ Raid อยู่ในโซนที่เปิด</h3>
        <p className="muted pxp">
          แมพ Raid ของสองตัวนี้อยู่ใน Labyrinth กับ Sphinx ซึ่งเปิดแล้ว แต่ MVP Raid วนตามเควสรายวัน
          ประกาศไม่ได้บอกว่าจะวนมาเมื่อไร · <Link href="/guides/mvp">ดูวิธีเข้า MVP Raid</Link>
        </p>
        <ul className="pmobs">
          {mvps.map((m) => (
            <li key={m.id}>
              <Link href={`/database/monsters/${m.id}`} className="pmob">
                <span className="pmob__art"><img src={`/images/monsters/${m.id}.gif`} alt="" loading="lazy" /></span>
                <span className="pmob__name">{m.name_en}</span>
                <span className="pmob__meta">MVP Lv {m.level}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <aside className="pnote">
        <strong>Clock Tower ยังไม่มา</strong> แผนรายปีบอกว่าเดือนนี้จะเปิด Clock Tower ด้วย แต่ประกาศแพทช์นี้ไม่มี เว็บนี้จึงยังติดป้าย &quot;ยังไม่เปิด&quot; ไว้ ·{' '}
        <Link href="/news/roadmap">ดูแผนทั้งปี</Link>
      </aside>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศ &ldquo;แจ้งเตือนการปิดปรับปรุงตามกำหนดการ – 1 ตุลาคม 2026&rdquo; (GNJOY, 30 ก.ย. 2569) ·
        มอนและจุดเกิดจากฐานข้อมูลของเว็บนี้
      </p>
    </main>
  );
}

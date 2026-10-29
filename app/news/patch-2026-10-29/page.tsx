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
//
// 29 Oct afternoon: the five Lv 122-126 basement monsters came off, then
// came back the same hour as the Hat Maker's suppliers: each drops one of the
// five materials the two Hat Maker headgears need (data/crafting-recipes.json,
// the prontera quest export; the NPC and its spot match the patch notes).
// Effects the notes leave out --
// Safety Boots, the three new capes' item ids -- come from the client the
// owner's game patched to on 29 Oct (D:/RagnarokZero/System, iteminfo).
import '../patch-2026-10-01/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import JsonLd from '@/components/JsonLd';
import ItemSetCard from '@/components/ItemSetCard';
import NaviCopy from '@/components/NaviCopy';
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
const MODIFIED = '2026-10-29T15:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 29 ต.ค. 2569 Ragnarok Zero — เปิด Clock Tower, อีเวนต์ Gatchaman, Black Friday',
  description:
    'สรุปแพทช์ 29 ตุลาคม 2569 ของ Ragnarok Zero Global ภาษาไทย: ปิดเซิร์ฟ 08:00–14:00 น., ดันเจี้ยน Clock Tower มอนทุกชั้น พิกัด NPC เควสรายวันและเควสอีเวนต์ Curse of the Clock Tower อุปกรณ์ใหม่ 12 ชิ้นพร้อมผล วัตถุดิบ Hat Maker จากบอสใต้ดิน การ์ดที่จะหาได้ครั้งแรก, คอลแลบ Gatchaman, Black Friday EXP x2, คอสตูมผี และ WoE เซิร์ฟ EU เลื่อนเป็นตี 3',
};

// The page's chapters in reading order; each tile jumps to one (owner,
// 29 Oct 2026: related parts next to each other, no jumping around).
const TOC = [
  { href: '#tower', title: 'ไปหอนาฬิกา', body: 'ทางเข้า ก่อนเข้า มอนแต่ละชั้น' },
  { href: '#quests', title: 'เควส', body: 'รายวัน Lv 70 · อีเวนต์ Curse of the Clock Tower' },
  { href: '#gear', title: 'อุปกรณ์ใหม่', body: '10 ชิ้นจากหอนาฬิกา พร้อมผล' },
  { href: '#hatmaker', title: 'ช่างหมวก Hat Maker', body: 'หมวก 2 ชิ้น วัตถุดิบ บอสใต้ดิน Gear' },
  { href: '#cards', title: 'การ์ดและของดรอป', body: 'การ์ดใหม่ การ์ดคู่ ของติดดาว คอสตูม' },
  { href: '#events', title: 'อีเวนต์', body: 'Gatchaman · Black Friday · คอสตูมผี' },
  { href: '#times', title: 'เวลา', body: 'ปิดปรับปรุง · WoE EU' },
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
// level 122-126, one per basement floor. Each drops one Hat Maker material.
const BOSSES = [20179, 20178, 20177, 20175, 20176];

// What each boss drops for the Hat Maker (monster_drops, rate not in the
// data), and what one headgear takes of it. Both Hat Maker headgears take the
// same list, plus Mithril x10.
const HAT_MATS: { boss: number; item: number; name: string; need: number }[] = [
  { boss: 20175, item: 25505, name: 'Jokers Wild', need: 1 },
  { boss: 20176, item: 25506, name: 'Cute Broom', need: 100 },
  { boss: 20177, item: 25507, name: 'Showy Coral Reef', need: 100 },
  { boss: 20178, item: 25508, name: 'Orc Warlord Token', need: 100 },
  { boss: 20179, item: 25509, name: 'Shining Round Shell', need: 100 },
];

// From the official patch notes of 29 Oct 2026 (an image, read by hand).
const QUEST_NPCS = [
  { tag: 'เควสรายวัน', name: 'Tower Keeper', what: 'รับได้เฉพาะ Base Lv 70 ขึ้นไป', navi: 'aldebaran 143/132' },
  { tag: 'เควสอีเวนต์', name: 'Clock Tower Clerk Molden', what: 'Curse of the Clock Tower', navi: 'aldebaran 136/132' },
];

type Gear = { name: string; id?: number; kind: string; who: string; fx: string[] };
// id: our item page when the item is already in the database (28 Oct data).
const HAT_MAKER: Gear[] = [
  { name: 'Clock Tower Manager Headphones', id: 19333, kind: 'หัวกลาง · DEF 10 · Lv 60 · หนัก 10', who: 'ทุกอาชีพ', fx: ['MATK +20', 'ใส่คู่ Tower Keeper Card: ลดร่ายแปรผัน 15%'] },
  { name: 'Pocket Watch Ornament', id: 19334, kind: 'หัวกลาง · DEF 10 · Lv 60 · หนัก 10', who: 'ทุกอาชีพ', fx: ['ATK +20', 'ใส่คู่ Clock Card: DEF +20 MSP +100', 'ใส่คู่ Alarm Card: MHP +1000'] },
];
const EXCLUSIVE: Gear[] = [
  { name: 'Encyclopedia [2]', id: 1564, kind: 'หนังสือ · ATK 110 · อาวุธ Lv 3 · Lv 70 · หนัก 200', who: 'สาย Sage, Priest', fx: ['INT +3 DEX +2 ไม่แตก', 'CRIT +20 และ CRIT เพิ่มตาม LUK', 'MATK +100'] },
  { name: 'Rabbit Pattern Shirt [1]', id: 15282, kind: 'เกราะ · DEF 10 · Lv 60 · หนัก 50', who: 'สาย Mage, Acolyte', fx: ['MHP +150 MSP +75', 'MATK +2 ต่อขั้นตีบวก', '+7: MHP +75 MSP +25 · +9: MHP +75 MSP +25'] },
  { name: 'Clock Casket [1]', id: 19357, kind: 'หัวบน · DEF 10 · Lv 60 · หนัก 70', who: 'ทุกอาชีพ', fx: ['ทุก +2 ดาเมจกายภาพใส่มอน Formless +1%', '+7: HIT +15 · +9: MHP +250'] },
  { name: 'Black Witch Hat [1]', id: 19358, kind: 'หัวบน · DEF 10 · Lv 60 · หนัก 70', who: 'ทุกอาชีพ', fx: ['ทุก +2 MATK +1%', '+7: MHP +50 MSP +100 · +9: ลดร่ายแปรผัน 5%'] },
  { name: 'Safety Boots [1]', id: 22188, kind: 'รองเท้า · DEF 60 · Lv 60 · หนัก 35', who: 'สาย Swordman', fx: ['MHP +250 MSP +50', '+7: ลดดาเมจกายภาพและเวทจากศัตรูทุกธาตุ 5%', '(แพตช์โน้ตไม่ได้เขียนผล ค่านี้จากไฟล์เกม)'] },
  { name: "General's Cape [1]", kind: 'ผ้าคลุม · DEF 55 · Lv 60 · หนัก 150', who: 'ทุกอาชีพ', fx: ['MHP +200 MSP +20', 'ทุก +2 MHP +100 MSP +10', '+7 และ +9: ลดร่ายแปรผัน 5% ดีเลย์หลังตี 5% (ขั้นละครั้ง)'] },
  { name: "Hunter's Cape [1]", kind: 'ผ้าคลุม · DEF 7 · Lv 60 · หนัก 50', who: 'ทุกอาชีพ', fx: ['ATK +10 HIT +10', '+6 ขึ้นไป: ATK +1 HIT +1 ทุกขั้นที่เกิน +5', '+7 และ +9: ดีเลย์หลังตี −5% (ขั้นละครั้ง)'] },
  { name: 'Rotating Gear [1]', kind: 'ผ้าคลุม · DEF 2 · Lv 60 · หนัก 10', who: 'ทุกอาชีพ', fx: ['FLEE +10', '+6 ขึ้นไป: FLEE +1 ทุกขั้นที่เกิน +5', '+7 และ +9: ลดร่ายแปรผัน 5% (ขั้นละครั้ง)'] },
  { name: 'Joker Claw [1]', id: 1856, kind: 'สนับมือ · ATK 90 · อาวุธ Lv 3 · Lv 60 · หนัก 40', who: 'สาย Monk, Priest', fx: ['STR +2 Raging Trifecta Blow +10%', 'Trifecta +1% ต่อขั้นตีบวก · ทุก +2 ดีเลย์หลังตี −1%', '+7: Raging Quadruple Blow +15% · +9: Raging Thrust +15%'] },
  { name: 'Memory Book', id: 2109, kind: 'โล่ · DEF 25 · Lv 1 · หนัก 100', who: 'สาย Mage', fx: ['INT +1 MDEF +2'] },
];

// New in the client of 29 Oct 2026, styled on Clock Tower monsters; no
// notice says where they come from.
const CT_COSTUMES = [
  { name: 'Alarm Mask', where: 'หัวกลาง+ล่าง' },
  { name: 'Orc Helm', where: 'หัวบน' },
  { name: 'Owlduke Silk Hat', where: 'หัวบน' },
  { name: 'Golden Brain Hat', where: 'หัวบน' },
  { name: 'Rideword', where: 'หัวบน' },
];

function gearRow(g: Gear) {
  return (
    <li key={g.name} className="ct-gearrow">
      {g.id ? <img src={`/images/items/${g.id}.gif`} alt="" width={24} height={24} loading="lazy" /> : <span className="ct-gearrow__noicon" aria-hidden="true" />}
      <div>
        <p className="ct-gearrow__name">{g.id ? <Link href={`/database/items/${g.id}`}>{g.name}</Link> : g.name}</p>
        <p className="ct-gearrow__kind">{g.kind} · {g.who}</p>
        <ul className="ct-gearrow__fx">{g.fx.map((f) => <li key={f}>{f}</li>)}</ul>
      </div>
    </li>
  );
}

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
          dateModified: MODIFIED,
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
          ดันใหม่ที่ Al De Baran พร้อมเควสรายวัน เควสอีเวนต์ Curse of the Clock Tower อุปกรณ์ใหม่ และช่างหมวก ·
          อีเวนต์ Gatchaman · Black Friday EXP x2 · คอสตูมผี
        </p>
        <p className="phero__pill">ปิดปรับปรุง พฤหัส 29 ต.ค. 08:00–14:00 น. เวลาไทย</p>
      </header>

      <aside className="pnote" role="note" style={{ marginTop: 14 }}>
        <strong>⚠ ข้อมูลอาจมีการเปลี่ยนแปลง</strong> NPC อุปกรณ์ และเควสมาจากแพตช์โน้ต ส่วนมอนรายชั้น การ์ด และบอสมาจากข้อมูลเกม
        แพตช์โน้ตไม่บอกว่าเปิดชั้นไหนบ้าง เข้าเกมแล้วเจออะไรเพิ่มจะมาอัปเดตหน้านี้
      </aside>

      <nav className="ct-toc" aria-label="ในหน้านี้">
        {TOC.map((t, i) => (
          <a key={t.href} href={t.href} className="ct-toc__item">
            <span className="ct-toc__n">{i + 1}</span>
            <span>
              <strong>{t.title}</strong>
              <small>{t.body}</small>
            </span>
          </a>
        ))}
      </nav>

      {error && (
        <p className="filterstate" role="alert" style={{ marginTop: 14 }}>
          โหลดข้อมูลจากฐานข้อมูลไม่ครบ บางส่วนด้านล่างอาจว่าง
        </p>
      )}

      {/* 1. The dungeon: how to get in, what to expect, every floor. */}
      <section id="tower" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">1</span>ไปหอนาฬิกา</h2>
        <div className="ct-where">
          <span><strong>ทางเข้า</strong> กลางเมือง Al De Baran</span>
          <NaviCopy cmd="/navi aldebaran 139/131" />
        </div>

        {levels.length > 0 && (
          <>
            <h3 className="pxh">ก่อนเข้า</h3>
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
          </>
        )}

        <h3 className="pxh">มอนแต่ละชั้น</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          ตามข้อมูลเกม เรียงจากที่เกิดเยอะสุด · กดรูปมอนดูของดรอป · บอส Lv 122–126 ของชั้นใต้ดินอยู่ในหัวข้อ 4
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

      {/* 2. Quests: the two quest NPCs, side by side. */}
      <section id="quests" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">2</span>เควส</h2>
        <div className="ct-npcs">
          {QUEST_NPCS.map((n) => (
            <div key={n.name} className="ct-npc">
              <span className="ct-npc__tag">{n.tag}</span>
              <strong>{n.name}</strong>
              <span className="muted">{n.what}</span>
              <NaviCopy cmd={`/navi ${n.navi}`} />
            </div>
          ))}
        </div>
        <p className="muted pxp" style={{ fontSize: 14 }}>แพตช์โน้ตไม่บอกขั้นตอนเควสและรางวัล</p>
      </section>

      {/* 3. The ten new pieces of equipment. */}
      <section id="gear" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">3</span>อุปกรณ์ใหม่จากหอนาฬิกา</h2>
        <p className="muted pxp" style={{ fontSize: 14 }}>แพตช์โน้ตเรียกว่า Exclusive Equipment ไม่บอกว่าดรอปจากมอนตัวไหน</p>
        <ul className="ct-gear">{EXCLUSIVE.map(gearRow)}</ul>
      </section>

      {/* 4. Hat Maker: the two hats, what they cost, who drops it, then the
          Gear that upgrades them. One chain, top to bottom. */}
      <section id="hatmaker" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">4</span>ช่างหมวก Hat Maker</h2>
        <div className="ct-where">
          <span><strong>Hat Maker</strong> ที่ Al De Baran</span>
          <NaviCopy cmd="/navi aldebaran 130/140" />
        </div>

        <h3 className="pxh">หมวกที่แลกได้</h3>
        <ul className="ct-gear">{HAT_MAKER.map(gearRow)}</ul>

        <div className="ct-recipe">
          <p className="ct-recipe__title">ของที่ต้องใช้ต่อหมวก 1 ชิ้น (สองชิ้นใช้ชุดเดียวกัน)</p>
          <ul className="ct-mats">
            {HAT_MATS.map((m) => (
              <li key={m.item}>
                <Link href={`/database/items/${m.item}`} className="ct-mat">
                  <img src={`/images/items/${m.item}.gif`} alt="" width={24} height={24} loading="lazy" />
                  <span>{m.name}</span>
                  <b>×{m.need}</b>
                </Link>
              </li>
            ))}
            <li>
              <Link href="/database/items/25430" className="ct-mat">
                <img src="/images/items/25430.gif" alt="" width={24} height={24} loading="lazy" />
                <span>Mithril</span>
                <b>×10</b>
              </Link>
            </li>
          </ul>
          <p className="muted" style={{ margin: '8px 0 0', fontSize: 13.5 }}>
            สูตรจากข้อมูลเควสของ Hat Maker แพตช์โน้ตไม่ได้เขียนวัตถุดิบ · ยังไม่ได้เช็กในเกม
          </p>
        </div>

        <h3 className="pxh" id="bosses" style={{ scrollMarginTop: 90 }}>วัตถุดิบดรอปจากบอสชั้นใต้ดิน</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          บอส Lv 122–126 ตัวละอย่าง ชั้นละตัว · ข้อมูลไม่มีจำนวนเกิดและเวลาเกิด แพตช์โน้ตไม่พูดถึงบอสพวกนี้
        </p>
        <ul className="pcards ct-cards">
          {HAT_MATS.filter((m) => monById.has(m.boss)).map((mat) => {
            const m = monById.get(mat.boss)!;
            const card = bossCards.get(mat.boss);
            const floor = STAGES[1].labels[STAGES[1].codes.findIndex((c) => spawns.some((s) => s.map_code === c && s.monsters?.id === mat.boss))];
            return (
              <li key={mat.boss}>
                <Link href={`/database/monsters/${mat.boss}`} className="pcard">
                  <img src={`/images/monsters/${mat.boss}.gif`} alt="" className="pcard__mob" loading="lazy" />
                  <span className="pcard__name">{monsterLabel(mat.boss, m.name_en)}</span>
                  <span className="pcard__from">Lv {m.level}{floor ? ` · ${floor}` : ''} · ธาตุ {th(ELEMENT_TH, m.element)}</span>
                  <span className="ct-drop">ดรอป {mat.name} · หมวกละ {mat.need}</span>
                  {card && <span className="pcard__fx">{card.name_en}: {card.description_th ?? '—'}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        <h3 className="pxh">Clock Tower Gear อัปเกรดหมวก</h3>
        <p className="muted pxp" style={{ fontSize: 14, lineHeight: 1.65 }}>
          ใช้อัปเกรดหมวก 4 ชิ้น: 2 ชิ้นจาก Hat Maker ข้างบน กับ Clock Casket และ Black Witch Hat จากหัวข้อ 3 ให้ได้ความสามารถเพิ่ม ·
          <strong> ค่าตีบวกกับการ์ดที่ใส่อยู่ไม่หาย</strong> · หนัก 1 · แพตช์โน้ตและไฟล์เกมไม่บอกว่าได้อะไรเพิ่มและหา Gear จากไหน
        </p>
      </section>

      {/* 5. Cards and drops: everything the tower's monsters newly give. */}
      <section id="cards" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">5</span>การ์ดและของดรอป</h2>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          มอนในหอนาฬิกาก่อนแพตช์นี้ไม่มีเกิดที่แมพไหนที่เปิดอยู่ ของข้างล่างจึงเพิ่งจะหาได้ ถ้าชั้นนั้นเปิด
        </p>

        <h3 className="pxh">การ์ดที่จะหาได้ครั้งแรก {cards.length} ใบ</h3>
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

        {sets.length > 0 && (
          <>
            <h3 className="pxh">การ์ดคู่ที่ใช้การ์ดจากหอนาฬิกา</h3>
            <div className="isetgrid">
              {sets.map((s) => <ItemSetCard key={s.name} set={s} />)}
            </div>
          </>
        )}

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

        <h3 className="pxh">คอสตูมธีมหอนาฬิกาในไฟล์เกม</h3>
        <p className="muted pxp" style={{ fontSize: 14 }}>
          ไฟล์เกมหลังแพตช์มีคอสตูมใหม่ที่หน้าตามาจากมอนในหอนาฬิกา แพตช์โน้ตไม่ได้พูดถึง ยังไม่รู้ว่าได้จากไหน
        </p>
        <ul className="ct-costumes">
          {CT_COSTUMES.map((c) => <li key={c.name}><strong>{c.name}</strong> <span className="muted">{c.where}</span></li>)}
        </ul>
      </section>

      {/* 6. The other events of this patch, and the ones it closes. */}
      <section id="events" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">6</span>อีเวนต์ที่มากับแพตช์นี้</h2>
        <div className="ct-evs">
          <Link href="/news/events-2026-11#gatchaman" className="ct-ev">
            <strong>คอลแลบ Gatchaman</strong>
            <span>ถึงปิดปรับปรุง 26 พ.ย. · เควสที่ Morocc แลกการ์ดและคอสตูม</span>
          </Link>
          <Link href="/news/events-2026-11#exp" className="ct-ev">
            <strong>Black Friday EXP x2</strong>
            <span>ทุกเสาร์อาทิตย์ 5 รอบ ดรอป +20% · รอบแรกศุกร์ 30 ต.ค. 07:00 น.</span>
          </Link>
          <Link href="/news/events-2026-11#ghostly" className="ct-ev">
            <strong>คอสตูมผี Ghostly</strong>
            <span>Ghostly Scroll ใน Kafra Shop สุ่มคอสตูม 5 แบบ</span>
          </Link>
        </div>
        <Link href="/news/events-2026-10" className="pevents" style={{ marginTop: 12 }}>
          <span className="pevents__tag">จบแล้ว · 29 ต.ค.</span>
          <span className="pevents__body">
            <strong>กิจกรรมตุลาคมจบตอนปิดปรับปรุงนี้</strong>
            <small>Baphomet Cult · The Legend of Amon Ra · Kumamon (RO Lite × ROZ ยังอยู่ถึง 1 พ.ย.)</small>
          </span>
          <span className="pevents__go" aria-hidden="true">▶</span>
        </Link>
      </section>

      {/* 7. Times: the maintenance and the WoE EU move. */}
      <section id="times" className="ct-ch">
        <h2 className="ct-ch__title"><span className="ct-ch__n">7</span>เวลา (เวลาไทย)</h2>
        <div className="ct-two">
          <div className="card card--yellow" id="maint">
            <h3 className="pxh" style={{ marginTop: 0 }}>ปิดปรับปรุง</h3>
            <table className="stat-table ct-times">
              <tbody>
                <tr><td>วันที่</td><td className="num">พฤหัส 29 ต.ค. 2569</td></tr>
                <tr><td>เริ่มปิด</td><td className="num">08:00 น.</td></tr>
                <tr><td>เปิดเซิร์ฟ</td><td className="num">14:00 น. (6 ชั่วโมง)</td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              เวลาอาจเลื่อนได้ · ของใน Kafra Shop ที่ขายอยู่อาจหมดรอบหลังปิดปรับปรุง
            </p>
          </div>
          <div className="card" id="woe">
            <h3 className="pxh" style={{ marginTop: 0 }}>WoE เซิร์ฟ EU ช้าลง 1 ชั่วโมง</h3>
            <table className="stat-table ct-times">
              <tbody>
                <tr><td>เซิร์ฟ</td><td className="num">Skadi (EU)</td></tr>
                <tr><td>เดิม</td><td className="num">02:00–03:00 น.</td></tr>
                <tr><td>ใหม่</td><td className="num">03:00–04:00 น.</td></tr>
                <tr><td>วัน</td><td className="num">พฤหัส และ จันทร์</td></tr>
              </tbody>
            </table>
            <p className="muted" style={{ marginTop: 8, fontSize: 13.5 }}>
              เพราะยุโรปเปลี่ยนเวลาฤดูหนาว · ประกาศเป็น 20:00–21:00 UTC คืนวันพุธกับคืนวันอาทิตย์ ·
              เซิร์ฟ SEA (Odin, Loki) เวลาเดิม 21:00–22:00 น. · <Link href="/guides/woe#time">ไกด์ WoE</Link>
            </p>
          </div>
        </div>
      </section>

      <aside className="pnote">
        <strong>ยังไม่รู้</strong> ชั้นไหนเปิดบ้าง ขั้นตอนเควสทีละขั้น อุปกรณ์ใหม่ดรอปจากมอนตัวไหน และบอสใต้ดินเกิดยังไง จะเติมเมื่อเข้าเกม ·{' '}
        ตีไหวไหมดูที่ <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
      </aside>

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> แพตช์โน้ตทางการ roz.mygnjoy.com &ldquo;The Clock Strikes, A New Adventure Begins – October 29 Update&rdquo; (29 ต.ค. 2569) ·
        ประกาศ Discord ทางการ Ragnarok Zero: Global &ldquo;Global Scheduled Maintenance Reminder – 29th October, 2026&rdquo; (28 ต.ค. 2569)
        และ &ldquo;War of Emperium EU Schedule Adjustment&rdquo; (23 ต.ค. 2569) · ผลของ Safety Boots, น้ำหนัก และคอสตูมจากไฟล์เกมหลังแพตช์ ·
        สูตร Hat Maker จากข้อมูลเควส · มอน การ์ด และจุดเกิดจากฐานข้อมูลของเว็บนี้ · หน้านี้เป็นสรุปแปล ไม่ใช่ประกาศทางการ
      </p>
    </main>
  );
}

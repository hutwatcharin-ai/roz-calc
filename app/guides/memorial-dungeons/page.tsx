// app/guides/memorial-dungeons/page.tsx
//
// The six memorial dungeons: what level lets you in, how to get in, what to
// do inside, the boss, and what the chests give.
//
// Rewritten 30 Sep 2026 at the owner's request ("more detail, easier to
// read"): each dungeon is now one card in the order a player needs it --
// how to get in, what to do, the boss (with the element that hits it
// hardest, from our element table), what drops -- and the full monster list
// folds away under the card. The walk-through lines (DETAILS) are written
// here in Thai from the French guide (docs/rozglobal-export, re-read 30 Sep
// 2026); the numbers come from data/memorial-dungeons.json, which
// scripts/build-memorial-dungeons.mjs parses out of the same pages.
//
// These are where the Rank IV gear on /guides/memorial-gear comes from, so
// the two pages are two halves of one answer.
//
// Nothing on this page links to a monster, and that is the finding rather
// than an omission: the monsters inside these instances are almost all
// instance-only variants -- Cannibal Deniro, Deepsea Merman, Stormy Wraith --
// and our monsters table holds none of them. Even Orc Skeleton, the one name
// that matches, is a different creature in here: level 60 with 4,458 HP
// against the level 53 and 3,376 HP of the one that walks around outside.
import './page.css';
import { itemNamesOf } from '@/lib/item-former-names';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import ItemIcon from '@/components/ItemIcon';
import { itemHref } from '@/lib/item-href';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { ELEMENTS, elementModifier, type Element, type ElementLevel } from '@/lib/element-table';
import file from '@/data/memorial-dungeons.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ดันเจี้ยนความทรงจำ Ragnarok Zero — เข้ายังไง ทำอะไร บอสแพ้ธาตุอะไร ได้อะไร',
  description:
    'ดันเจี้ยนความทรงจำทั้ง 6 แห่งใน Ragnarok Zero Global — เลเวลที่เข้าได้ NPC ทางเข้า สิ่งที่ต้องทำในดัน บอส HP และธาตุที่ตีแรง รางวัลโหมดปกติกับโหมดยาก และมอนทุกตัว',
};

interface DungeonMonster {
  name: string;
  level: number;
  hp: number;
  def: number | null;
  mdef: number | null;
  size: string | null;
  race: string | null;
  element: string | null;
  elementLevel: number | null;
  baseExp: number | null;
  jobExp: number | null;
}

interface Dungeon {
  name: string;
  th: string;
  level: number | null;
  levelMax: number | null;
  map: string | null;
  x: number | null;
  y: number | null;
  party: boolean;
  dailyReset: boolean;
  rewards: { normal: string[]; hard: string[] };
  monsters: DungeonMonster[];
}

const { dungeons } = file as unknown as { dungeons: Dungeon[] };

// Not open on Global yet (owner, 30 Sep 2026: say "not open", no month --
// the only dates come from one fan guide and would read as a promise).
const NOT_OPEN = new Set(['Ant Hell 1F', 'Izlude 2F', 'Sunken Ship']);

// How to get in and what to do, per dungeon. Rewritten from the French
// guide, not quoted.
const DETAILS: Record<string, { entry: string; navi?: string; steps: string[]; warn?: string }> = {
  'Poring Village': {
    entry: 'คุยกับ Emily ที่แมพทางตะวันตกของ Prontera',
    navi: 'prt_fild05 145/235',
    steps: [
      'ตีมอนโพริงเป็นคลื่น ๆ',
      'ระหว่างคลื่นมีเสาสีฟ้า กดแล้วได้บัฟ ATK ชั่วคราว กดก่อนเริ่มคลื่นถัดไป',
      'จบด้วยบอส 3 ตัว Amering, Goldring และ King Poring',
    ],
    warn: 'เก็บยาไว้ใช้กับบอส 3 ตัวสุดท้าย King Poring ตัวเดียว HP เยอะกว่าอีกสองตัวรวมกัน',
  },
  "Orc's Memory": {
    entry: 'ไปหมู่บ้านออร์ค (แมพข้างนอกดันออร์คเดิม) คุยกับ NPC Scientist',
    steps: ['เคลียร์มอนในดัน', 'สู้บอส Fallen Orc Hero'],
    warn: 'ระหว่างสู้บอสจะมี Shaman\'s Flower โผล่ ต้องฆ่าก่อนเสมอ มันบัฟบอสตราบที่ยังอยู่ · HP แค่ 5 แต่ DEF สูง',
  },
  'Prontera Culvert': {
    entry: 'คุยกับหัวหน้าสำนักงานจัดการใต้ดิน (Underground Management Bureau Chief) ที่แมพทางตะวันตกของ Prontera พร้อมปาร์ตี้',
    navi: 'prt_fild05 265/208',
    steps: [
      'ทุบไข่แมลง (Ancient Thief Bug Egg) ให้หมด บอสถึงจะออก',
      'สู้บอส Ancient Golden Thief Bug',
      'ทุบไข่รอบตัวบอสให้หมดก่อนบอสตาย จะได้หีบโบนัสอีกใบ',
    ],
    warn: 'ปาร์ตี้ 7 คนขึ้นไป ชุดที่ดรอปดีขึ้น',
  },
  'Ant Hell 1F': {
    entry: 'แมพทางตะวันออกของ Prontera คุยกับ NPC ก่อนถึงทางเข้า แล้วคุยกับรอยแยกมิติ (Dimensional Rift) ข้าง ๆ',
    steps: ['อุดบ่อพิษให้ครบ (จุดแดงบนแผนที่)', 'สู้บอส Cannibal Maya'],
    warn: 'บอสตัวเดียวแต่ HP กว่า 2 ล้าน เตรียมของให้พอ',
  },
  'Izlude 2F': {
    entry: 'ทางเข้าเดียวกับ Ant Hell 1F คุยกับ NPC แล้วคุยกับรอยแยกมิติ',
    steps: ['เดินเคลียร์มอนทีละกลุ่ม', 'สู้บอส Deepsea Coelacanth'],
    warn: 'ยิ่งฆ่ามอนไปมาก ตัวที่เหลือยิ่งแข็งขึ้น อย่าดึงมอนกระจาย · บอส DEF กับ MDEF สูงเท่ากัน ใช้ทั้งตีกายภาพและเวทจะจบเร็วกว่า',
  },
  'Sunken Ship': {
    entry: 'ทางเข้าเดียวกับ Ant Hell 1F คุยกับ NPC แล้วคุยกับรอยแยกมิติ',
    steps: [
      'เคลียร์มอน คอยดู Stormy Mimic ที่ปนมา ฆ่าให้ครบได้หีบโบนัส',
      'สู้บอส Stormy Drake',
    ],
    warn: 'บอสแข็งขึ้นตามสิ่งที่ทำระหว่างทาง และอึดที่สุดในทุกดัน (HP 7.2 ล้าน) เตรียมยาและบัฟให้พอ',
  },
};

// Poring Village's weekday Jellopy fragment, from the French guide.
const FRAGMENT_BY_DAY = [
  ['จันทร์', 'Poring'],
  ['อังคาร', 'Poporing'],
  ['พุธ', 'Drops'],
  ['พฤหัส', 'Deviling'],
  ['ศุกร์', 'Angeling'],
  ['เสาร์ อาทิตย์', 'กล่องเศษ Jellopy แบบสุ่ม'],
];

const EL_TH: Record<string, Element> = {
  ไร้ธาตุ: 'Neutral', น้ำ: 'Water', ดิน: 'Earth', ไฟ: 'Fire', ลม: 'Wind', พิษ: 'Poison',
  ศักดิ์สิทธิ์: 'Holy', มืด: 'Shadow', วิญญาณ: 'Ghost', อันเดด: 'Undead',
};
const EL_NAME: Record<Element, string> = Object.fromEntries(Object.entries(EL_TH).map(([th, en]) => [en, th])) as Record<Element, string>;

/** The attack elements that hit this element hardest, and by how much. */
function bestAgainst(element: string | null, level: number | null): { names: string[]; pct: number } | null {
  const def = element ? EL_TH[element] : undefined;
  if (!def) return null;
  const lv = (Math.min(4, Math.max(1, level ?? 1)) as ElementLevel);
  const scores = ELEMENTS.map((a) => ({ a, v: elementModifier(a, def, lv) }));
  const top = Math.max(...scores.map((s) => s.v));
  if (top <= 100) return null;
  return { names: scores.filter((s) => s.v === top).map((s) => EL_NAME[s.a]), pct: top };
}

function levelText(d: Dungeon): string {
  if (d.level === null) return 'ไม่ระบุ';
  return d.levelMax ? `${d.level}–${d.levelMax}` : `${d.level}+`;
}

const num = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-US'));
const anchor = (d: Dungeon) => 'md-' + d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '');

export default async function MemorialDungeonsPage() {
  // The reward names are matched to our items table so each one links. Every
  // name in the file resolved on 9 Sep 2026; one that stops resolving renders
  // as plain text rather than vanishing.
  const { data: itemRows } = await fetchAllRows<{ id: number; name_en: string; icon_url: string | null }>(
    (from, to) => supabaseBrowser().from('items').select('id, name_en, icon_url').order('id').range(from, to),
  );
  const items = new Map((itemRows ?? []).flatMap((i) => itemNamesOf(i).map((n) => [n.toLowerCase(), i] as const)));
  const reward = (name: string) => items.get(name.toLowerCase()) ?? null;
  // Open ones first, then the ones not out on Global yet; easiest first inside each.
  const ordered = [...dungeons].sort(
    (a, b) => Number(NOT_OPEN.has(a.name)) - Number(NOT_OPEN.has(b.name)) || (a.level ?? 999) - (b.level ?? 999),
  );
  const bossOf = (d: Dungeon) => d.monsters.reduce((a, b) => (b.hp > a.hp ? b : a));

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ดันเจี้ยนความทรงจำ', path: '/guides/memorial-dungeons' },
        ])}
      />
      <PageHeader title="ดันเจี้ยนความทรงจำ" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        ดันเจี้ยนแบบอินสแตนซ์ {dungeons.length} แห่ง ได้<Link href="/guides/memorial-gear">ชุดแรงค์ IV</Link>ที่เอาไปอัปต่อได้
        และวัตถุดิบทำเครื่องประดับ · กดชื่อดันเพื่อข้ามไปดูวิธีเล่น
      </p>

      <div className="mdrules">
        <p><strong>เข้าเป็นปาร์ตี้</strong>เท่านั้น</p>
        <p><strong>วันละครั้ง</strong> รีเซ็ตทุกวัน</p>
        <p><strong>ปาร์ตี้ 7 คนขึ้นไป</strong> ได้ของเพิ่ม</p>
        <p><strong>โหมดยาก</strong> ได้วัตถุดิบเยอะกว่า</p>
      </div>

      <div className="card card--cyan" style={{ marginTop: 14 }}>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ดันเจี้ยน</th>
                <th className="num">เลเวล</th>
                <th>บอส</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((d) => (
                <tr key={d.name}>
                  <td data-label="ดันเจี้ยน">
                    <a href={`#${anchor(d)}`}><strong>{d.name}</strong></a> <span className="muted">{d.th}</span>
                    {NOT_OPEN.has(d.name) && <> <span className="tag tag--unknown">ยังไม่เปิด</span></>}
                  </td>
                  <td data-label="เลเวล" className="num">{levelText(d)}</td>
                  <td data-label="บอส">{bossOf(d).name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ordered.map((d) => {
        const info = DETAILS[d.name];
        const boss = bossOf(d);
        const best = bestAgainst(boss.element, boss.elementLevel);
        const closed = NOT_OPEN.has(d.name);
        return (
          <section key={d.name} id={anchor(d)} className={'mdcard' + (closed ? ' mdcard--closed' : '')}>
            <header className="mdcard__head">
              <h2 className="mdcard__title">
                {d.name} <span className="muted">{d.th}</span>
              </h2>
              <p className="mdcard__meta">
                <span className="tag">เลเวล {levelText(d)}</span>
                {closed && <span className="tag tag--unknown">ยังไม่เปิด</span>}
              </p>
            </header>

            {info && (
              <div className="mdcard__grid">
                <div>
                  <h3 className="mdcard__h">เข้ายังไง</h3>
                  <p className="mdcard__p">{info.entry}</p>
                  {info.navi && <p className="mdcard__p"><code className="mono navicmd">/navi {info.navi}</code></p>}
                </div>
                <div>
                  <h3 className="mdcard__h">ต้องทำอะไร</h3>
                  <ol className="mdcard__steps">
                    {info.steps.map((s) => <li key={s}>{s}</li>)}
                  </ol>
                </div>
              </div>
            )}
            {info?.warn && <p className="mdcard__warn"><strong>จุดสำคัญ:</strong> {info.warn}</p>}

            <div className="mdboss">
              <p className="mdboss__label">บอส</p>
              <p className="mdboss__name">{boss.name} <span className="muted">Lv {boss.level}</span></p>
              <dl className="mdboss__stats">
                <div><dt>HP</dt><dd>{num(boss.hp)}</dd></div>
                <div><dt>DEF / MDEF</dt><dd>{num(boss.def)} / {num(boss.mdef)}</dd></div>
                <div><dt>ธาตุ</dt><dd>{boss.element ? `${boss.element} ${boss.elementLevel ?? ''}` : '—'}</dd></div>
                <div><dt>เผ่า · ขนาด</dt><dd>{[boss.race, boss.size].filter(Boolean).join(' · ') || '—'}</dd></div>
              </dl>
              {best && (
                <p className="mdboss__best">
                  ตีด้วยธาตุ<strong>{best.names.join(' หรือ ')}</strong> แรงสุด ({best.pct}%) ·{' '}
                  <Link href="/guides/elements">ตารางธาตุ</Link>
                </p>
              )}
            </div>

            {(d.rewards.normal.length > 0 || d.rewards.hard.length > 0) && (
              <div className="mdloot">
                {([['โหมดปกติ', d.rewards.normal], ['โหมดยาก', d.rewards.hard]] as const).map(([label, list]) =>
                  list.length === 0 ? null : (
                    <div key={label}>
                      <h3 className="mdcard__h">หีบ{label}</h3>
                      <span className="recipe__list">
                        {list.map((name) => {
                          const item = reward(name);
                          return item ? (
                            <Link key={name} className="recipe__item" href={itemHref(item.id, null)}>
                              <ItemIcon iconUrl={item.icon_url} category="Other" size={20} />
                              <span>{name}</span>
                            </Link>
                          ) : (
                            <span key={name} className="recipe__item">{name}</span>
                          );
                        })}
                      </span>
                    </div>
                  ),
                )}
              </div>
            )}

            {d.name === 'Poring Village' && (
              <div className="mdextra">
                <h3 className="mdcard__h">ของเฉพาะดันนี้</h3>
                <ul className="mdcard__steps" style={{ listStyle: 'disc' }}>
                  <li><strong>Poring Village Green Onion</strong> หมวก Lv 30 ไม่มีช่องการ์ด · โดนตีกายภาพมีโอกาสแปลงเป็น Smokie 5 วินาที</li>
                  <li><strong>Poring Village Carrot</strong> หมวก Lv 30 ไม่มีช่องการ์ด · ตีกายภาพมีโอกาสแปลงเป็น Lunatic</li>
                  <li>ยาในหีบขายไม่ได้</li>
                </ul>
                <h3 className="mdcard__h" style={{ marginTop: 12 }}>เศษ Jellopy ตามวัน</h3>
                <div className="mddays">
                  {FRAGMENT_BY_DAY.map(([day, what]) => (
                    <p key={day}><span className="muted">{day}</span> <strong>{what}</strong></p>
                  ))}
                </div>
                <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>
                  เศษ 5 ชิ้นทำเป็นหิน Jellopy ใช้อัปชุดดัน · <Link href="/guides/memorial-gear">ดูว่าใช้ตรงไหน</Link>
                </p>
                <h3 className="mdcard__h" style={{ marginTop: 12 }}>เอนแชนต์หมวกผัก</h3>
                <p className="mdcard__p">
                  คุยกับคนอัปผัก <code className="mono navicmd">/navi prt_fild05 174/238</code> ใช้ Jellopy 50 ชิ้น + 20,000z ได้ออปชัน 1 อย่าง
                  สุ่มจาก STR/VIT/INT/DEX/AGI/LUK +1, SP +10/+25/+50 หรือ HP +100/+200 · ล้างเพื่อสุ่มใหม่ 20,000z
                </p>
                <p className="mdcard__warn"><strong>ระวัง:</strong> ทุกครั้งที่ใส่หรือล้าง มีโอกาส 30% ที่หมวก<strong>แตกหาย</strong></p>
              </div>
            )}

            <details className="mdmobs">
              <summary>มอนในดันทั้งหมด {d.monsters.length} ตัว</summary>
              <div className="recipe__scroll">
                <table className="data-table recipe">
                  <thead>
                    <tr>
                      <th>มอน</th>
                      <th className="num">เลเวล</th>
                      <th className="num">HP</th>
                      <th className="num">DEF / MDEF</th>
                      <th>เผ่า · ธาตุ · ขนาด</th>
                      <th className="num">EXP / JEXP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.monsters.map((m) => (
                      <tr key={m.name}>
                        <td data-label="มอน">{m.name}</td>
                        <td data-label="เลเวล" className="num">{m.level}</td>
                        <td data-label="HP" className="num">{num(m.hp)}</td>
                        <td data-label="DEF / MDEF" className="num">{m.def === null ? '—' : `${m.def} / ${m.mdef ?? '—'}`}</td>
                        <td data-label="เผ่า · ธาตุ · ขนาด">
                          {[m.race, m.element && `${m.element}${m.elementLevel ?? ''}`, m.size].filter(Boolean).join(' · ') || '—'}
                        </td>
                        <td data-label="EXP / JEXP" className="num">
                          {m.baseExp === null ? '—' : `${num(m.baseExp)} / ${num(m.jobExp ?? 0)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>
        );
      })}

      <Caveat label="เชื่อได้แค่ไหน">
        ทั้งหน้ามาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. และอ่านซ้ำ 30 ก.ย. 2026) · ธาตุที่ตีแรงคิดจากตารางธาตุของเว็บนี้ ·
        มอนในดันพวกนี้เป็นตัวเฉพาะอินสแตนซ์ ซึ่งไม่มีในตารางมอนของเรา ชื่อเดียวที่ตรงคือ Orc Skeleton แต่ค่าไม่เท่ากัน
        (ในดัน lv60 HP 4,458 ข้างนอก lv53 HP 3,376) ชื่อมอนในหน้านี้จึงไม่มีลิงก์
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/memorial-gear">ชุดที่ได้จากดันเจี้ยนนี้</Link> · <Link href="/guides/elements">ตารางธาตุ</Link>
      </p>
    </main>
  );
}

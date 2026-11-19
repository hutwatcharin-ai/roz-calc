// app/guides/ant-hell/page.tsx
//
// Ant Hell Memorial on one page: how to get in, what to bring, the boss, what
// the chests give, and what those rewards are for (the Subjugation ->
// Expedition upgrade). Everything here already lives somewhere on the site --
// the 12 Nov patch page, the memorial dungeon cards, the memorial gear ladder --
// but a player about to run it had to read three pages to put it together.
// Page views on /guides/memorial-gear went 253 -> 1,140 in the week after the
// patch (GA4, 19 Nov 2026), so the question is being asked.
//
// Sources, kept apart on the page:
//   - entrance and NPC: official notice, 12 Nov 2026
//   - steps, monsters, boss stats, chest contents: data/memorial-dungeons.json
//     (the French player guide roz-global.info, written before Global opened)
//   - Expedition stats: the client's own item text (lib/memorial-gear)
//   - Expedition set bonus and Essence on +9: the owner's in-game screenshots
import '../../news/events-2026-10/page.css';
import '../../news/patch-2026-11-12/page.css';
import '../memorial-gear/page.css';
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import ItemIcon from '@/components/ItemIcon';
import JsonLd from '@/components/JsonLd';
import NaviCopy from '@/components/NaviCopy';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { ELEMENTS, elementModifier, type Element, type ElementLevel } from '@/lib/element-table';
import { loadMemorialGear, lookup, memorialGear, type GearPiece } from '@/lib/memorial-gear';
import { supabaseRead } from '@/lib/supabase';
import file from '@/data/memorial-dungeons.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Ant Hell Memorial RO Zero — ทางเข้า วิธีเล่น บอส Cannibal Maya ของรางวัล',
  description:
    'ไกด์ดันเจี้ยนความทรงจำ Ant Hell ใน Ragnarok Zero Global ทางเข้า /navi prt_fild06 37/197 เลเวล 70 เข้าเป็นปาร์ตี้ อุดบ่อพิษ บอส Cannibal Maya แพ้ธาตุไฟ ของในหีบ และเอา Faintly Glowing Crystal ไปอัปชุด Subjugation เป็น Expedition',
};

interface Monster {
  name: string;
  level: number;
  hp: number;
  def: number;
  mdef: number;
  size: string;
  race: string;
  element: string;
  elementLevel: number;
}
interface Dungeon {
  name: string;
  level: number | null;
  party: boolean;
  rewards: { normal: string[]; hard: string[] };
  monsters: Monster[];
}

const ANT_HELL = (file as unknown as { dungeons: Dungeon[] }).dungeons.find((d) => d.name === 'Ant Hell 1F') as Dungeon;
const IMG = '/images/events/2026-11-12';

const EL_TH: Record<string, Element> = {
  ไร้ธาตุ: 'Neutral', น้ำ: 'Water', ดิน: 'Earth', ไฟ: 'Fire', ลม: 'Wind', พิษ: 'Poison',
  ศักดิ์สิทธิ์: 'Holy', มืด: 'Shadow', วิญญาณ: 'Ghost', อันเดด: 'Undead',
};
const EL_NAME = Object.fromEntries(Object.entries(EL_TH).map(([th, en]) => [en, th])) as Record<Element, string>;

/** The attack elements that hit this element hardest, and by how much. */
function bestAgainst(element: string, level: number): { names: string[]; pct: number } | null {
  const def = EL_TH[element];
  if (!def) return null;
  const lv = Math.min(4, Math.max(1, level)) as ElementLevel;
  const scores = ELEMENTS.map((a) => ({ a, v: elementModifier(a, def, lv) }));
  const top = Math.max(...scores.map((s) => s.v));
  if (top <= 100) return null;
  return { names: scores.filter((s) => s.v === top).map((s) => EL_NAME[s.a]), pct: top };
}

const num = (n: number) => n.toLocaleString('en-US');

// What each chest item is for, so the reward list answers "is this worth it".
// Only items with a use the site already documents get a line.
const REWARD_USE: Record<string, React.ReactNode> = {
  'Faintly Glowing Crystal': <>อัปชุด Subjugation เป็น Expedition ชิ้นละ 50 ก้อน · <a href="#upgrade">ดูข้างล่าง</a></>,
  'Crystal of Blue Light': <>เก็บไว้อัปแรงค์ II (Contingent, Lv 80) ชิ้นละ 50 ก้อน · ยังไม่เปิด</>,
  'Jellopy Fragment Box': <>เศษ Jellopy ไว้รวมเป็น <Link href="/guides/memorial-gear#stones">Zelstone</Link> ที่ใช้ตอนอัปชุด</>,
  'Red Oath Ring': <><Link href="/guides/memorial-gear#accessories">เครื่องประดับดันความทรงจำ</Link></>,
};

export default async function AntHellPage() {
  const d = ANT_HELL;
  const boss = d.monsters.reduce((a, b) => (b.hp > a.hp ? b : a));
  const mobs = d.monsters.filter((m) => m !== boss);
  const best = bestAgainst(boss.element, boss.elementLevel);
  const mobBest = mobs.length ? bestAgainst(mobs[0].element, mobs[0].elementLevel) : null;

  const [{ ranks, items, failed }, monsterRes] = await Promise.all([
    loadMemorialGear(),
    supabaseRead().from('monsters').select('id, name_en').in('name_en', d.monsters.map((m) => m.name)),
  ]);
  const monsterId = new Map((monsterRes.data ?? []).map((m: { id: number; name_en: string }) => [m.name_en, m.id]));
  const rankIII = ranks.find((r) => r.rank === 'III');
  const rankIV = ranks.find((r) => r.rank === 'IV');
  const crystal = lookup(items, 'Faintly Glowing Crystal');
  const expeditionStones = Object.entries(memorialGear.stoneFor).filter(([piece]) => piece.startsWith('Expedition'));

  const MonsterName = ({ name }: { name: string }) => {
    const id = monsterId.get(name);
    return id ? <Link href={`/database/monsters/${id}`}>{name}</Link> : <>{name}</>;
  };

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'Ant Hell Memorial', path: '/guides/ant-hell' },
        ])}
      />
      <PageHeader
        title="Ant Hell Memorial"
        lead={
          <>
            ดันเจี้ยนความทรงจำ Lv {d.level} ที่เปิดกับแพทช์ 12 พ.ย. · <strong>เข้าทาง Prontera Field ไม่ใช่ในดัน Ant Hell เดิม</strong> ·
            ได้คริสตัลไปอัปชุด Subjugation เป็น Expedition
          </>
        }
      />

      <nav className="guildp__toc" aria-label="ในหน้านี้">
        <a href="#entry">ทางเข้า</a>
        <a href="#prepare">เตรียมตัว</a>
        <a href="#steps">วิธีเล่น</a>
        <a href="#boss">บอส</a>
        <a href="#rewards">ของรางวัล</a>
        <a href="#upgrade">อัปเป็น Expedition</a>
      </nav>

      {failed && <p className="filterstate">โหลดข้อมูลไอเทมไม่สำเร็จ ค่าของบางชิ้นอาจไม่ขึ้น</p>}

      <section id="entry" className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
        <h2 className="section-title">ทางเข้า</h2>
        <div className="pnpc">
          <figure className="evnpc">
            <span className="evnpc__art"><img src={`${IMG}/memorial-member.png`} alt="Memorial Association Member" width={42} loading="lazy" /></span>
            <figcaption>
              <strong>Memorial Association Member</strong>
              <NaviCopy cmd="/navi prt_fild06 37/197" />
            </figcaption>
          </figure>
        </div>
        <p className="muted" style={{ fontSize: 13, marginBottom: 0 }}>
          แมพทางตะวันออกของ Prontera (<Link href="/database/maps/prt_fild06">prt_fild06</Link>) · กดที่คำสั่งเพื่อก๊อปไปวางในแชตเกม
        </p>
      </section>

      <section id="prepare" className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
        <h2 className="section-title">เตรียมตัวก่อนเข้า</h2>
        <ul className="evsteps" style={{ listStyle: 'disc' }}>
          <li><b>Base Lv {d.level} ขึ้นไป</b>{d.party && <> และ<b>เข้าเป็นปาร์ตี้</b></>}</li>
          <li>
            ทุกตัวในดันเป็น{boss.race}ธาตุ{boss.element} → <b>อาวุธธาตุ{best?.names.join(' หรือ ') ?? '—'}</b>
            {best && <> ตีบอสได้ {best.pct}%</>}
            {mobBest && <> ตีลูกน้องได้ {mobBest.pct}%</>} ·{' '}
            <Link href="/guides/forging">ตีอาวุธธาตุ</Link> · <Link href="/guides/elemental-converter">หินเปลี่ยนธาตุ</Link>
          </li>
          <li>บอส HP {num(boss.hp)} ตัวเดียว เตรียมยาให้พอทั้งปาร์ตี้</li>
          <li>มีชุด Subjugation อยู่แล้วให้<b>ถอดการ์ดออกก่อนอัป</b> การ์ดและค่าตีบวกของชิ้นเดิมหายหมด</li>
        </ul>
      </section>

      <section id="steps" className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
        <h2 className="section-title">วิธีเล่น</h2>
        <ol className="evsteps">
          <li>คุย Memorial Association Member แล้วเข้าวาร์ปข้าง NPC</li>
          <li>
            อุดบ่อพิษให้ครบ (จุดแดงบนแผนที่) ระหว่างทางเจอ{' '}
            {mobs.map((m, i) => (
              <span key={m.name}>{i > 0 && ', '}<MonsterName name={m.name} /></span>
            ))}
          </li>
          <li>สู้บอส <b><MonsterName name={boss.name} /></b></li>
        </ol>

        <div className="recipe__scroll" style={{ marginTop: 12 }}>
          <table className="data-table recipe">
            <thead>
              <tr><th>มอน</th><th>Lv</th><th>HP</th><th>DEF / MDEF</th><th>ธาตุ</th></tr>
            </thead>
            <tbody>
              {mobs.map((m) => (
                <tr key={m.name}>
                  <td data-label="มอน"><MonsterName name={m.name} /></td>
                  <td data-label="Lv" className="num">{m.level}</td>
                  <td data-label="HP" className="num">{num(m.hp)}</td>
                  <td data-label="DEF / MDEF" className="num">{m.def} / {m.mdef}</td>
                  <td data-label="ธาตุ">{m.element} {m.elementLevel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section id="boss" className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
        <h2 className="section-title">บอส: {boss.name}</h2>
        <table className="stat-table pboss">
          <tbody>
            <tr><td>เลเวล</td><td className="num">{boss.level}</td></tr>
            <tr><td>HP</td><td className="num">{num(boss.hp)}</td></tr>
            <tr><td>DEF / MDEF</td><td className="num">{boss.def} / {boss.mdef}</td></tr>
            <tr><td>ประเภท</td><td>{boss.race} ขนาด{boss.size} ธาตุ{boss.element} {boss.elementLevel}</td></tr>
            {best && <tr><td>ตีแรงสุด</td><td>ธาตุ{best.names.join(' หรือ ')} ({best.pct}%) · <Link href="/guides/elements">ตารางธาตุ</Link></td></tr>}
          </tbody>
        </table>
      </section>

      <section id="rewards" className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
        <h2 className="section-title">ของรางวัล</h2>
        {([['หีบโหมดปกติ', d.rewards.normal], ['หีบโหมดยาก', d.rewards.hard]] as const).map(([label, list]) => (
          <div key={label} style={{ marginTop: 10 }}>
            <h3 className="section-title" style={{ fontSize: 15 }}>{label}</h3>
            <ul className="ahloot">
              {list.map((name) => (
                <li key={name}>
                  <MaterialLink piece={lookup(items, name)} />
                  {REWARD_USE[name] && <small className="muted">{REWARD_USE[name]}</small>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section id="upgrade" className="card" style={{ marginTop: 16, scrollMarginTop: 90 }}>
        <h2 className="section-title">เอาคริสตัลไปอัปเป็น Expedition</h2>
        <div className="oflows">
          <div className="oflow">
            <span className="oflow__in">
              ชุด {rankIV?.name ?? 'Subjugation'} (Lv {rankIV?.level ?? 60}) 1 ชิ้น + <MaterialLink piece={crystal} />{' '}
              <b className="mono" style={{ color: 'var(--yellow)' }}>×{rankIII?.crystalAmount ?? 50}</b> + Zelstone
            </span>
            <span className="oflow__arrow" aria-hidden="true">▶</span>
            <span className="oflow__out">ชิ้น {rankIII?.name ?? 'Expedition'} (Lv {rankIII?.level ?? 70})</span>
          </div>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>
          ครบเซ็ต 4 ชิ้นใช้คริสตัล {(rankIII?.crystalAmount ?? 50) * 4} ก้อน · ใส่ชิ้นเดิมไว้แล้วคุย NPC อัปอุปกรณ์ข้าง Stone Processor
        </p>

        {expeditionStones.length > 0 && (
          <>
            <h3 className="section-title" style={{ fontSize: 15, marginTop: 16 }}>Zelstone ที่ใช้</h3>
            <div className="recipe__scroll">
              <table className="data-table recipe">
                <thead><tr><th>ชิ้นที่ได้</th><th>ใช้หิน</th></tr></thead>
                <tbody>
                  {expeditionStones.map(([piece, stones]) => (
                    <tr key={piece}>
                      <td data-label="ชิ้น"><MaterialLink piece={lookup(items, piece)} /></td>
                      <td data-label="หิน">
                        <span className="recipe__list">
                          {stones.map((s) => (
                            <span key={s.stone}><MaterialLink piece={lookup(items, s.stone)} /> ×{s.amount}</span>
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted" style={{ fontSize: 13 }}>
              แหล่งที่มาลงไว้แค่ {expeditionStones.length} ชิ้น ชิ้นอื่นไม่ได้แปลว่าไม่ต้องใช้หิน ·{' '}
              <Link href="/guides/memorial-gear#stones">Zelstone ทำจากอะไร</Link>
            </p>
          </>
        )}

        <h3 className="section-title" style={{ fontSize: 15, marginTop: 16 }}>โบนัสเซ็ต Expedition</h3>
        <ul className="evsteps" style={{ listStyle: 'disc' }}>
          <li>เซ็ต 4 ชิ้นสายกายภาพ (Armor) ATK +20 · ตีบวกรวม 21 ขึ้นไป ASPD +5% ลดเวลาร่ายแบบคงที่ 5%</li>
          <li>เซ็ต 4 ชิ้นสายเวท (Robe) MATK +20 · ตีบวกรวม 21 ขึ้นไป ลดเวลาร่ายแบบแปรผัน 5% และแบบคงที่ 5%</li>
          <li><b>เสื้อ Expedition ตี +9 เอนแชนต์ได้ Essence อาชีพ 2</b> · <Link href="/tools/enchant#essence">Essence ทุกอาชีพ</Link></li>
        </ul>

        {rankIII?.sets.map((s) => (
          <div key={s.role} style={{ marginTop: 14 }}>
            <p className="muted" style={{ margin: '0 0 6px', fontSize: 13 }}>{s.role}</p>
            <div className="rcards">
              {s.pieces.map((p) => <PieceCard key={p.name} piece={p} />)}
            </div>
          </div>
        ))}
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          <Link href="/guides/memorial-gear">สายอัปเกรดทั้ง 4 แรงค์</Link> · <Link href="/guides/memorial-dungeons">ดันเจี้ยนความทรงจำทั้งหมด</Link>
        </p>
      </section>

      <Caveat label="ข้อมูลมาจากไหน">
        ทางเข้าและ NPC จากประกาศทางการ 12 พ.ย. 2569 · วิธีเล่น สเตตัสมอน และของในหีบจากไกด์ผู้เล่น roz-global.info ที่เขียนก่อนเปิดบน Global
        <strong>ยังไม่ได้เช็กในเกม</strong> · ค่าของชุด Expedition เป็นข้อความบนไอเทมในไคลเอนต์เกม · โบนัสเซ็ตและ Essence จากภาพหน้าจอในเกม ·
        สูตรอัป (คริสตัล ×50 + Zelstone) ยังไม่ได้เช็กในเกม · ธาตุที่ตีแรงคิดจากตารางธาตุของเว็บนี้ · ถ้าในเกมไม่ตรง บอกได้เลย
      </Caveat>
    </main>
  );
}

/** A piece as a card with the client's own text, as on /guides/memorial-gear. */
function PieceCard({ piece }: { piece: GearPiece }) {
  const lines = (piece.effect ?? '').split(/\n/).map((l) => l.trim()).filter(Boolean);
  const head = (
    <>
      <span className="rcard__icon"><ItemIcon iconUrl={piece.icon} category="Armor" size={32} /></span>
      <span className="rcard__name">{piece.name}</span>
    </>
  );
  return (
    <article className="rcard mgpiece">
      <header className="rcard__head">
        {piece.id === null ? <span className="rcard__product">{head}</span> : <Link className="rcard__product" href={itemHref(piece.id, 'Armor')}>{head}</Link>}
        <span className="rcard__badge mono">Lv {piece.level ?? '?'}</span>
      </header>
      {lines.length ? (
        <ul className="mgpiece__fx">
          {lines.map((l, i) => <li key={i} className={/^(เมื่อ|When)/.test(l) ? 'is-cond' : undefined}>{l}</li>)}
        </ul>
      ) : (
        <p className="muted" style={{ margin: 0 }}>ยังไม่มีข้อความผล</p>
      )}
    </article>
  );
}

/** A material or piece as a linked chip, or plain text when we do not stock it. */
function MaterialLink({ piece }: { piece: GearPiece }) {
  if (piece.id === null) return <span className="recipe__item">{piece.name}</span>;
  return (
    <Link className="recipe__item" href={itemHref(piece.id, null)}>
      <ItemIcon iconUrl={piece.icon} category="Other" size={20} />
      <span>{piece.name}</span>
    </Link>
  );
}

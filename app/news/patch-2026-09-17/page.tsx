// app/news/patch-2026-09-17/page.tsx
//
// The 17 Sep 2026 patch, read against our own tables. The publisher's notice
// (16 Sep 2026) names what arrived in one line each; this page answers the
// next question a player has -- what drops, where it spawns, what level --
// from the monsters, drops and spawns we already hold. Only the notice's own
// list decides what is on the page: the raid maps also carry Amon Ra and Orc
// Hero, but the notice names four MVPs, so four are shown.
//
// The owner asked for this page on 17 Sep 2026 after reading the notice; the
// notice text came from their screenshot (roz.mygnjoy.com is off limits to us).
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import MonsterLink from '@/components/MonsterLink';
import ItemIcon from '@/components/ItemIcon';
import { articleJsonLd, breadcrumbJsonLd } from '@/lib/jsonld';
import { itemHref } from '@/lib/item-href';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 3600;

const PATH = '/news/patch-2026-09-17';
const PUBLISHED = '2026-09-17T15:00:00+07:00';

export const metadata: Metadata = {
  title: 'แพทช์ 17 ก.ย. 2569 Ragnarok Zero — MVP ใหม่ 4 ตัว, Pyramid, Geffen Dungeon, WoE',
  description:
    'สรุปแพตช์ 17 ก.ย. 2569 ของ Ragnarok Zero Global เป็นภาษาไทย — MVP Orc Lord, Osiris, Dracula, Doppelganger ดรอปอะไร เลือดเท่าไร · Pyramid และ Geffen Dungeon แต่ละชั้นมีมอนอะไร · WoE, ช่องตัวละครที่ 6',
};

// In the order the notice lists them.
const MVP_IDS = [1190, 1389, 1046, 1038];

const PYRAMID = ['moc_pryd01', 'moc_pryd02', 'moc_pryd03', 'moc_pryd04', 'moc_pryd05', 'moc_pryd06'];
const GEFFEN = ['gef_dun00', 'gef_dun01', 'gef_dun02'];

const ELEMENT_TH: Record<string, string> = {
  Neutral: 'ไม่มีธาตุ',
  Water: 'น้ำ',
  Earth: 'ดิน',
  Fire: 'ไฟ',
  Wind: 'ลม',
  Poison: 'พิษ',
  Holy: 'ศักดิ์สิทธิ์',
  Shadow: 'มืด',
  Ghost: 'Ghost',
  Undead: 'อันเดด',
};

const SIZE_TH: Record<string, string> = { Small: 'เล็ก', Medium: 'กลาง', Large: 'ใหญ่' };

interface Mvp {
  id: number;
  name_en: string;
  level: number;
  hp: number;
  element: string | null;
  element_level: number | null;
  race: string | null;
  size: string | null;
  def: number | null;
  mdef: number | null;
}

interface Drop {
  monster_id: number;
  rate: number | null;
  items: { id: number; name_en: string; category: string | null; icon_url: string | null } | null;
}

interface Spawn {
  map_code: string;
  map_display_name: string | null;
  amount: number | null;
  monsters: { id: number; name_en: string; level: number; is_mvp: boolean; is_aggressive: boolean } | null;
}

const CSS = `
.mvpgrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 10px; }
.mvpcard { margin: 0; }
.mvpcard__head { display: flex; gap: 12px; align-items: center; }
.mvpcard__sprite { width: 72px; height: 72px; object-fit: contain; image-rendering: pixelated; background: rgba(255,255,255,.05); border-radius: 12px; }
.mvpcard__name { font-weight: 700; font-size: 17px; }
.mvpcard__stats { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; margin: 12px 0 0; }
.mvpcard__stats div { display: flex; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--hair); padding-bottom: 4px; font-size: 13px; }
.mvpcard__stats dt { color: var(--dim); }
.mvpcard__stats dd { margin: 0; font-weight: 700; text-align: end; }
.mvpcard__sub { font-size: 13.5px; margin: 12px 0 6px; }
.mvpcard__drops { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 4px; }
.mvpcard__drops li { display: grid; grid-template-columns: 26px minmax(0, 1fr) auto; gap: 8px; align-items: center; font-size: 13.5px; }
@media (max-width: 720px) {
  .mvpgrid { grid-template-columns: 1fr; }
}
`;

const nf = new Intl.NumberFormat('en-US');

/** "52,500,000" reads worse than "52.5 ล้าน" when every MVP is in the tens of millions. */
function hpText(hp: number): string {
  if (hp >= 1_000_000) return `${(hp / 1_000_000).toFixed(1).replace(/\.0$/, '')} ล้าน`;
  return nf.format(hp);
}

/** The Zero client repeats each map as _a/_b/_z copies and C1-C5 variants; the page keeps the plain ones. */
function plainMonsters(rows: Spawn[]) {
  const seen = new Map<number, { id: number; name: string; level: number; amount: number; aggressive: boolean }>();
  for (const row of rows) {
    const m = row.monsters;
    if (!m || /^C\d /.test(m.name_en) || !row.amount) continue;
    const prev = seen.get(m.id);
    seen.set(m.id, {
      id: m.id,
      name: m.name_en,
      level: m.level,
      amount: (prev?.amount ?? 0) + row.amount,
      aggressive: m.is_aggressive,
    });
  }
  return [...seen.values()].filter((m) => m.level > 1).sort((a, b) => a.level - b.level);
}

function DungeonTable({ title, codes, spawns }: { title: string; codes: string[]; spawns: Spawn[] }) {
  return (
    <div className="recipe__scroll">
      <table className="data-table recipe">
        <thead>
          <tr>
            <th>{title}</th>
            <th>มอนในชั้น (เลเวล · จำนวน)</th>
          </tr>
        </thead>
        <tbody>
          {codes.map((code) => {
            const rows = spawns.filter((s) => s.map_code === code);
            const name = rows[0]?.map_display_name ?? code;
            const monsters = plainMonsters(rows);
            return (
              <tr key={code}>
                <td data-label="ชั้น">
                  <Link href={`/database/maps/${code}`}>{name}</Link>
                  <div className="muted mono" style={{ fontSize: 11.5 }}>{code}</div>
                </td>
                <td data-label="มอน">
                  {monsters.length === 0 ? (
                    <span className="muted">ไม่มีข้อมูล</span>
                  ) : (
                    monsters.map((m, i) => (
                      <span key={m.id}>
                        {i > 0 && ' · '}
                        <MonsterLink id={m.id} name={m.name} />{' '}
                        <span className="muted" style={{ fontSize: 12.5 }}>
                          Lv{m.level} ×{m.amount}
                          {m.aggressive ? ' · ตีก่อน' : ''}
                        </span>
                      </span>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function Patch20260917Page() {
  const db = supabaseBrowser();
  const [mvps, drops, raidSpawns, dungeonSpawns, beer] = await Promise.all([
    db.from('monsters').select('id, name_en, level, hp, element, element_level, race, size, def, mdef').in('id', MVP_IDS),
    db.from('monster_drops').select('monster_id, rate, items(id, name_en, category, icon_url)').in('monster_id', MVP_IDS),
    db.from('monster_spawns').select('monster_id, map_display_name').in('monster_id', MVP_IDS),
    db
      .from('monster_spawns')
      .select('map_code, map_display_name, amount, monsters(id, name_en, level, is_mvp, is_aggressive)')
      .in('map_code', [...PYRAMID, ...GEFFEN]),
    db.from('items').select('id, name_en, category, icon_url, description').eq('id', 107452).maybeSingle(),
  ]);

  const mvpRows = MVP_IDS.map((id) => ((mvps.data ?? []) as Mvp[]).find((m) => m.id === id)).filter(
    (m): m is Mvp => Boolean(m),
  );
  const dropRows = (drops.data ?? []) as unknown as Drop[];
  const spawnRows = (dungeonSpawns.data ?? []) as unknown as Spawn[];
  // Raid maps come as a plain code and a _z copy; one name per MVP is enough.
  const raidMap = new Map<number, string>();
  for (const row of (raidSpawns.data ?? []) as { monster_id: number; map_display_name: string | null }[]) {
    if (row.map_display_name && !raidMap.has(row.monster_id)) raidMap.set(row.monster_id, row.map_display_name);
  }
  const loadFailed = Boolean(mvps.error || drops.error || dungeonSpawns.error);

  return (
    <main className="shell" style={{ paddingBlock: 32, maxWidth: 960 }}>
      <style>{CSS}</style>
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
        <span className="crumbs__here">ข่าวแพทช์</span>
      </nav>

      <PageHeader title="แพทช์ 17 ก.ย. 2569 — มีอะไรใหม่" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 14, maxWidth: '72ch' }}>
        ปิดปรับปรุง 08:00–12:30 น. (เวลาไทย) · สรุปจากประกาศทางการ แล้วเติมรายละเอียดจากฐานข้อมูลของเว็บนี้ ·
        ค่าพลังและของดรอปมาจากไฟล์เกม ถ้าแพตช์นี้ปรับอะไร ตัวเลขอาจยังไม่ตรง
      </p>

      <div className="card card--cyan">
        <h2 className="section-title" style={{ marginTop: 0 }}>สรุปสั้น</h2>
        <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <li><a href="#mvp"><strong>MVP Raid ใหม่ 4 ตัว</strong></a> Orc Lord, Dracula, Doppelganger, Osiris</li>
          <li><a href="#dungeons"><strong>เปิด Pyramid และ Geffen Dungeon</strong></a> พร้อมเควสรายวันของทั้งสองที่</li>
          <li><strong>WoE (War of Emperium)</strong> ปรับระบบสงครามกิลด์</li>
          <li><a href="#beer"><strong>Nordfeld Beer</strong></a> ใส่ในระบบล่าอัตโนมัติ (Auto-Hunting) ได้แล้ว</li>
          <li><strong>เซิร์ฟ Odin</strong> สร้างตัวละครใหม่ได้แล้ว · <strong>ช่องตัวละครฟรี 5 → 6</strong></li>
          <li>ร้าน Kafra Shop มีของใหม่: Gacha Scroll, คอสตูม, แพ็กเกจผูกบัญชี และช่องตัวละครเพิ่ม</li>
          <li>Get Poring: ปรับหน้ามินิเกม, ใช้ยา HP/Stamina ง่ายขึ้นตอนเล่นมินิเกม, ปรับ Block Puzzle, ร้านดาวมีของใหม่</li>
        </ul>
      </div>

      {loadFailed && (
        <p className="filterstate" role="alert" style={{ marginTop: 14 }}>
          โหลดข้อมูลจากฐานข้อมูลไม่ครบ บางตารางด้านล่างอาจว่าง
        </p>
      )}

      <section id="mvp" style={{ marginTop: 26 }}>
        <h2 className="section-title">MVP Raid ใหม่ 4 ตัว</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>
          เกิดในแมพ Raid แยกของแต่ละตัว (รหัสแมพขึ้นต้น <code className="mono">b_</code>) · กดชื่อดูหน้ามอนเต็ม
        </p>
        <div className="mvpgrid">
          {mvpRows.map((m) => {
            const own = dropRows
              .filter((d) => d.monster_id === m.id && d.items)
              .sort((a, b) => (b.rate ?? 0) - (a.rate ?? 0));
            return (
              <article className="card mvpcard" key={m.id}>
                <div className="mvpcard__head">
                  <img src={`/images/monsters/${m.id}.gif`} alt={m.name_en} className="mvpcard__sprite" loading="lazy" />
                  <div>
                    <Link href={`/database/monsters/${m.id}`} className="mvpcard__name">{m.name_en}</Link>
                    <div className="muted" style={{ fontSize: 12.5 }}>{raidMap.get(m.id) ?? 'ไม่มีข้อมูลแมพ'}</div>
                  </div>
                </div>
                <dl className="mvpcard__stats">
                  <div><dt>เลเวล</dt><dd>{m.level}</dd></div>
                  <div><dt>HP</dt><dd>{hpText(m.hp)}</dd></div>
                  <div>
                    <dt>ธาตุ</dt>
                    <dd>{m.element ? `${ELEMENT_TH[m.element] ?? m.element} ${m.element_level ?? ''}` : '—'}</dd>
                  </div>
                  <div><dt>เผ่า · ขนาด</dt><dd>{m.race ?? '—'} · {m.size ? SIZE_TH[m.size] ?? m.size : '—'}</dd></div>
                  <div><dt>DEF / MDEF</dt><dd>{m.def ?? '—'} / {m.mdef ?? '—'}</dd></div>
                </dl>
                <h3 className="mvpcard__sub">ของดรอป</h3>
                {own.length === 0 ? (
                  <p className="muted" style={{ margin: 0, fontSize: 13 }}>ไม่มีข้อมูลดรอป</p>
                ) : (
                  <ul className="mvpcard__drops">
                    {own.map((d) => (
                      <li key={d.items!.id}>
                        <ItemIcon iconUrl={d.items!.icon_url} category={d.items!.category} size={24} />
                        <Link href={itemHref(d.items!.id, d.items!.category)}>{d.items!.name_en}</Link>
                        <span className="muted mono">{d.rate === null ? 'ไม่ทราบอัตรา' : `${d.rate}%`}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section id="dungeons" style={{ marginTop: 26 }}>
        <h2 className="section-title">Pyramid 6 ชั้น</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>
          ชั้นล่าง B2F มี Arclouse (Lv107) กับ Ancient Mummy (Lv114) · การ์ด Mummy, Isis, Verit, Arclouse และ Ancient Mummy
          หาได้แล้วตั้งแต่แพตช์นี้ · ดูว่าตีโดนไหมที่<Link href="/tools/leveling-spots">หาที่เก็บเลเวล</Link>
        </p>
        <DungeonTable title="ชั้น" codes={PYRAMID} spawns={spawnRows} />

        <h2 className="section-title" style={{ marginTop: 22 }}>Geffen Dungeon 3 ชั้น</h2>
        <p className="muted" style={{ marginTop: 2, fontSize: 13 }}>
          B3F มี Deviruchi (Lv93) กับ Marionette (Lv90) เป็นตัวหลัก
        </p>
        <DungeonTable title="ชั้น" codes={GEFFEN} spawns={spawnRows} />
        <p className="muted" style={{ marginTop: 8, fontSize: 12.5 }}>
          เควสรายวันของ Pyramid และ Geffen ที่ประกาศบอก ยังไม่มีในฐานข้อมูลของเรา
        </p>
      </section>

      {beer.data && (
        <section id="beer" style={{ marginTop: 26 }}>
          <h2 className="section-title">Nordfeld Beer ใส่ Auto-Hunting ได้แล้ว</h2>
          <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <ItemIcon iconUrl={beer.data.icon_url} category={beer.data.category} size={32} />
            <div>
              <Link href={itemHref(beer.data.id, beer.data.category)}><strong>{beer.data.name_en}</strong></Link>
              <p style={{ margin: '4px 0 0', fontSize: 14 }}>
                ดื่มแล้ว<strong>ดาเมจใส่ Boulder Dwarf +10% นาน 30 นาที</strong> · ตายแล้วเอฟเฟกต์หาย ·
                ตอนนี้ตั้งให้ระบบล่าอัตโนมัติกดใช้เองได้
              </p>
            </div>
          </div>
        </section>
      )}

      <p className="source-note" style={{ marginTop: 20 }}>
        <strong>ที่มา:</strong> ประกาศ &ldquo;Scheduled Maintenance Reminder – September 17, 2026&rdquo; (GNJOY, 16 ก.ย. 2569) ·
        ค่าพลัง ของดรอป และจุดเกิด จากฐานข้อมูลของเว็บนี้
      </p>
    </main>
  );
}

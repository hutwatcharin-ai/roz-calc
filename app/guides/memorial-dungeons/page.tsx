// app/guides/memorial-dungeons/page.tsx
//
// The six memorial dungeons: what level lets you in, and what is waiting.
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
import file from '@/data/memorial-dungeons.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'ดันเจี้ยนความทรงจำ Ragnarok Zero — เข้าได้ตอนเลเวลไหน เจออะไรบ้าง',
  description:
    'ดันเจี้ยนความทรงจำทั้ง 6 แห่งใน Ragnarok Zero Global — เลเวลที่เข้าได้ รีเซ็ตเมื่อไร มอนในนั้นเลเวล เลือด DEF เผ่า ธาตุ EXP ครบทุกตัว และหีบท้ายดันให้อะไรบ้างแยกโหมดปกติกับโหมดยาก',
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

function levelText(d: Dungeon): string {
  if (d.level === null) return 'ไม่ระบุ';
  return d.levelMax ? `${d.level}–${d.levelMax}` : `${d.level}+`;
}

export default async function MemorialDungeonsPage() {
  // The reward names are matched to our items table so each one links. Every
  // name in the file resolved on 9 Sep 2026; one that stops resolving renders
  // as plain text rather than vanishing.
  const { data: itemRows } = await fetchAllRows<{ id: number; name_en: string; icon_url: string | null }>(
    (from, to) => supabaseBrowser().from('items').select('id, name_en, icon_url').order('id').range(from, to),
  );
  const items = new Map((itemRows ?? []).map((i) => [i.name_en.toLowerCase(), i]));
  const reward = (name: string) => items.get(name.toLowerCase()) ?? null;
  // Easiest first: it is the order a player meets them in.
  const ordered = [...dungeons].sort((a, b) => (a.level ?? 999) - (b.level ?? 999));

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ดันเจี้ยนความทรงจำ', path: '/guides/memorial-dungeons' },
        ])}
      />
      <PageHeader title="ดันเจี้ยนความทรงจำ — เข้าตอนไหน เจออะไร" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '72ch' }}>
        ดันเจี้ยนแบบอินสแตนซ์ {dungeons.length} แห่ง · <strong>ทุกแห่งเข้าเป็นกลุ่ม และเข้าได้วันละครั้ง รีเซ็ตตี 4</strong> ·
        ของที่ได้จากหีบในนี้คือ<Link href="/guides/memorial-gear">ชุดแรงค์ IV</Link>ที่เอาไปอัปต่อได้ ·
        โหมดยากให้วัตถุดิบสำหรับทำเครื่องประดับด้วย
      </p>

      <div className="card card--cyan">
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>ดันเจี้ยน</th>
                <th className="num">เลเวลที่เข้าได้</th>
                <th className="num">มอนในนั้น</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((d) => (
                <tr key={d.name}>
                  <td data-label="ดันเจี้ยน">
                    <strong>{d.name}</strong> <span className="muted">{d.th}</span>
                  </td>
                  <td data-label="เลเวล" className="num">{levelText(d)}</td>
                  <td data-label="มอน" className="num">{d.monsters.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {ordered.map((d) => (
        <section key={d.name} style={{ marginTop: 26 }}>
          <h2 className="section-title">
            {d.name} <span className="muted" style={{ fontWeight: 400 }}>· {d.th} · เลเวล {levelText(d)}</span>
          </h2>
          {d.map && d.x !== null && d.y !== null && (
            <p className="muted" style={{ marginTop: 2, marginBottom: 8, fontSize: 13 }}>
              คุยกับ NPC ที่ <code className="mono navicmd">/navi {d.map} {d.x}/{d.y}</code>
            </p>
          )}
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
                    <td data-label="HP" className="num">{m.hp.toLocaleString('en-US')}</td>
                    <td data-label="DEF / MDEF" className="num">
                      {m.def === null ? '—' : `${m.def} / ${m.mdef ?? '—'}`}
                    </td>
                    <td data-label="เผ่า · ธาตุ · ขนาด">
                      {[m.race, m.element && `${m.element}${m.elementLevel ?? ''}`, m.size].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td data-label="EXP / JEXP" className="num">
                      {m.baseExp === null
                        ? '—'
                        : `${m.baseExp.toLocaleString('en-US')} / ${(m.jobExp ?? 0).toLocaleString('en-US')}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(d.rewards.normal.length > 0 || d.rewards.hard.length > 0) && (
            <div style={{ marginTop: 12 }}>
              {([['โหมดปกติ', d.rewards.normal], ['โหมดยาก', d.rewards.hard]] as const).map(([label, list]) =>
                list.length === 0 ? null : (
                  <p key={label} className="muted" style={{ margin: '6px 0', fontSize: 13 }}>
                    <strong>{label}:</strong>{' '}
                    <span className="recipe__list">
                      {list.map((name) => {
                        const item = reward(name);
                        return item ? (
                          <Link key={name} className="recipe__item" href={itemHref(item.id, null)}>
                            <ItemIcon iconUrl={item.icon_url} category="Other" size={18} />
                            <span>{name}</span>
                          </Link>
                        ) : (
                          <span key={name} className="recipe__item">{name}</span>
                        );
                      })}
                    </span>
                  </p>
                ),
              )}
            </div>
          )}
        </section>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        ทั้งหน้ามาจากไกด์ภาษาฝรั่งเศส roz-global.info (อ่าน 8 ก.ย. 2026) และ<strong>ตรวจกับข้อมูลเราไม่ได้เลย</strong> —
        มอนในดันเจี้ยนพวกนี้เป็นตัวเฉพาะอินสแตนซ์ (Cannibal Deniro, Deepsea Merman, Stormy Wraith ฯลฯ) ซึ่งไม่มีในตารางมอนของเราสักตัว ·
        ชื่อเดียวที่ตรงกันคือ Orc Skeleton แต่ในอินสแตนซ์เป็น <strong>lv60 HP 4,458</strong> ส่วนตัวข้างนอกที่เรามีคือ lv53 HP 3,376 —
        คนละตัวกัน · เป็นช่องว่างของฐานข้อมูลเรา ไม่ใช่ข้อผิดของไกด์ ชื่อมอนในหน้านี้จึงไม่มีลิงก์
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/guides/memorial-gear">ชุดที่ได้จากดันเจี้ยนนี้</Link> ·{' '}
        <Link href="/database/maps">ฐานข้อมูลแมพ</Link>
      </p>
    </main>
  );
}

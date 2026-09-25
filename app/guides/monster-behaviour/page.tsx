// app/guides/monster-behaviour/page.tsx
//
// One page for the six behaviour flags the monster pages badge, in the words
// players use for them (the owner's terms, 25 Sep 2026: รุม / ไวต่อเวท /
// มองมุด / ตีทีละ 1), with the monsters that carry each one. The list pages
// can already filter on these, but a filtered list is noindex by design
// (lib/filtered-view), so "มอนไวต่อเวท ro" had no page to land on.
//
// Everything here is read from data/monster-modes.json and data/raw/
// monsters.json; no count is typed. Sources and their limits are on the
// page in the same words the monster pages use.
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { BEHAVIOUR_LABELS, MODE_FILTERS, modesMeta, monsterIdsWithMode, type ModeFilter } from '@/lib/monster-modes';
import { isCVariant, isInstanceVariant } from '@/lib/c-variant';
import raw from '@/data/raw/monsters.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'นิสัยมอนสเตอร์ Ragnarok Zero — มอนรุม ไวต่อเวท มองมุด ตีทีละ 1 มีตัวไหนบ้าง',
  description:
    'มอนสเตอร์แต่ละแบบใน Ragnarok Zero Global ต่างกันยังไง: รุม (ช่วยพวก) ไวต่อเวท (ร่ายเวทใกล้แล้วโดนตี) มองมุด (เห็นตัวซ่อน) ตีทีละ 1 ขยับไม่ได้ และมินิบอส พร้อมรายชื่อมอนทุกตัวที่เป็นแบบนั้น',
};

type RawRow = { id: number; name: string; level: number | null };
const ROWS = ((raw as unknown as { monsters: RawRow[] }).monsters ?? []).filter(
  (r) => !isCVariant(r.name) && !isInstanceVariant(r.name),
);
const BY_ID = new Map(ROWS.map((r) => [r.id, r]));

// The four behaviour flags come with a one-line meaning already (the badge
// tooltips); the two rozerodb flags get theirs here.
const MEANING: Record<ModeFilter, string> = {
  assist: BEHAVIOUR_LABELS.assist.title,
  castSensor: BEHAVIOUR_LABELS.castSensor.title,
  detector: BEHAVIOUR_LABELS.detector.title,
  plant: BEHAVIOUR_LABELS.plant.title,
  rooted: 'ยืนอยู่กับที่ ไม่เดินตาม ตีจากระยะไกลได้โดยไม่โดนไล่',
  mini: 'บอสตัวเล็ก ดรอปดีกว่ามอนธรรมดา แต่ไม่ใช่ MVP',
};

// What a reader does with the flag -- the reason to look a list up.
const WHY: Record<ModeFilter, string> = {
  assist: 'ตีตัวเดียวแล้วโดนทั้งฝูง เลือกจุดที่ตัวอื่นอยู่ห่าง หรือเตรียมรับหลายตัว',
  castSensor: 'สายเวทเจอตัวพวกนี้ต้องยืนให้ไกลกว่าระยะที่มันเห็น หรือฆ่าให้ทันก่อนมันถึงตัว',
  detector: 'Hiding / Cloaking หนีตัวพวกนี้ไม่ได้ อย่าพึ่งสกิลซ่อนตัวใกล้มัน',
  plant: 'ดาเมจไม่มีผล ใช้อาวุธเร็ว ๆ หรือสกิลที่ตีหลายครั้ง แทนสกิลตีแรงครั้งเดียว',
  rooted: 'เหมาะกับสายระยะไกลและสายเวท ยืนตีจากนอกระยะได้เรื่อย ๆ',
  mini: 'ตีได้เหมือนมอนปกติแต่แข็งกว่า ไม่มีกติกาแย่ง MVP',
};

const ORDER: ModeFilter[] = ['assist', 'castSensor', 'detector', 'plant', 'rooted', 'mini'];

const SECTIONS = ORDER.map((key) => {
  const monsters = monsterIdsWithMode(key)
    .map((id) => BY_ID.get(id))
    .filter((r): r is RawRow => Boolean(r))
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name));
  return { key, label: MODE_FILTERS[key], monsters };
});

// The four rAthena-sourced flags vs the two rozerodb ones, for the source line.
const RATHENA_KEYS = new Set<ModeFilter>(['assist', 'castSensor', 'detector', 'plant']);

export default function MonsterBehaviourPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'นิสัยมอนสเตอร์', path: '/guides/monster-behaviour' },
        ])}
      />
      <PageHeader
        title="นิสัยมอนสเตอร์ — รุม ไวต่อเวท มองมุด ตีทีละ 1"
        lead="มอนแต่ละตัวมีนิสัยติดตัวที่ตัดสินว่าจะเข้าไปตีมันยังไง หน้านี้บอกว่าแต่ละคำแปลว่าอะไร และตัวไหนเป็นแบบนั้นบ้าง"
      />

      <nav className="jumpbar" aria-label="หัวข้อในหน้านี้">
        {SECTIONS.map((s) => (
          <a key={s.key} href={`#${s.key}`}>
            {s.label} <span className="muted">{s.monsters.length}</span>
          </a>
        ))}
      </nav>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>แต่ละคำแปลว่าอะไร</h2>
        <div className="recipe__scroll">
          <table className="data-table recipe">
            <thead>
              <tr>
                <th>นิสัย</th>
                <th>หมายความว่า</th>
                <th>ทำยังไงกับมัน</th>
                <th className="num">มีกี่ตัว</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((s) => (
                <tr key={s.key}>
                  <td data-label="นิสัย"><a href={`#${s.key}`}><span className={`tag tag--behaviour tag--${s.key}`}>{s.label}</span></a></td>
                  <td data-label="หมายความว่า">{MEANING[s.key]}</td>
                  <td data-label="ทำยังไง">{WHY[s.key]}</td>
                  <td data-label="มีกี่ตัว" className="num">{s.monsters.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ marginTop: 10, fontSize: 13, maxWidth: '74ch' }}>
          ป้ายเดียวกันนี้อยู่บนหน้ามอนแต่ละตัว และกรองได้ที่ <Link href="/database/monsters">ฐานข้อมูลมอนสเตอร์</Link> ช่อง &quot;นิสัย&quot; ·
          &quot;โจมตีก่อน&quot; กับ &quot;เก็บของตก&quot; ไม่อยู่ในหน้านี้เพราะมีบนหน้ามอนทุกตัวอยู่แล้ว
        </p>
      </section>

      {SECTIONS.map((s) => (
        <section key={s.key} className="card" id={s.key} style={{ marginTop: 14 }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>
            <span className={`tag tag--behaviour tag--${s.key}`}>{s.label}</span>{' '}
            <span className="muted" style={{ fontWeight: 400, fontSize: 14 }}>{s.monsters.length} ตัว เรียงตามเลเวล</span>
          </h2>
          <p className="muted" style={{ marginTop: 2, maxWidth: '74ch' }}>{MEANING[s.key]} · {WHY[s.key]}</p>
          {s.monsters.length === 0 ? (
            <p className="muted">ไม่มีตัวไหนในข้อมูลที่เรามี</p>
          ) : (
            <ul className="behaviour__list">
              {s.monsters.map((m) => (
                <li key={m.id}>
                  <Link href={`/database/monsters/${m.id}`}>{m.name}</Link>
                  <span className="mono muted"> Lv {m.level ?? '—'}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="guildp__src">
            {RATHENA_KEYS.has(s.key)
              ? 'ที่มา: ตาราง AI ของ rAthena (kRO) ยังไม่ได้วัดในเซิร์ฟ Zero'
              : 'ที่มา: ฐานข้อมูล rozerodb'}
            {' · '}กดชื่อเพื่อดูดรอป จุดเกิด และค่าสถานะ · ไม่รวมร่างโคลนและมอนอีเวนต์
          </p>
        </section>
      ))}

      <Caveat label="เชื่อได้แค่ไหน">
        รุม / ไวต่อเวท / มองมุด / ตีทีละ 1 <strong>มาจากตาราง AI ของ rAthena</strong> ซึ่งเป็นข้อมูลเซิร์ฟ kRO ไม่ใช่การวัดในเซิร์ฟ Zero ·
        เหตุผลที่ใช้: บนข้อมูลที่ทั้ง rAthena และ rozerodb มีเหมือนกัน (มอนตัวไหนโจมตีก่อน) ทั้งสองแหล่งตรงกัน {modesMeta.rathena.agree} จาก{' '}
        {modesMeta.rathena.agree + modesMeta.rathena.disagree} ตัว สคริปต์ที่สร้างข้อมูลจะไม่ยอมเขียนถ้าวันไหนไม่ตรง ·
        ขยับไม่ได้ กับ มินิบอส มาจาก rozerodb โดยตรง · มอนอีเวนต์เฉพาะ Zero ไม่มีข้อมูลนิสัยจากแหล่งไหนเลย จึงไม่อยู่ในรายชื่อ ·
        ชื่อเรียกทั้งหมดเป็นคำที่ผู้เล่นใช้กันในเกม ไม่ใช่ชื่อทางการ
      </Caveat>

      <p className="muted" style={{ marginTop: 16 }}>
        ดูต่อ: <Link href="/database/monsters">ฐานข้อมูลมอนสเตอร์</Link> ·{' '}
        <Link href="/guides/elements">ตารางธาตุ</Link> ·{' '}
        <Link href="/tools/hit-flee">คำนวณ HIT/FLEE</Link> ·{' '}
        <Link href="/tools/leveling-spots">ฟาร์มที่ไหนดี</Link>
      </p>
    </main>
  );
}

// app/database/random-options/page.tsx
//
// "What is the best roll of this option?" (owner, 4 Nov 2026). The player has
// seen a piece in a shop, or holds one, and wants the ceiling of each option
// it carries. So the page starts from the kind of gear, and every row puts the
// highest value of each source side by side, the best of them in yellow.
//
// The tabs are anchors and CSS :target, not state: every kind's table is in
// the HTML, and an equipment page can link straight to its own kind
// (/database/random-options#k-melee). Data: data/option-max.json, built by
// scripts/build-option-max.mjs, which says where each number comes from.
import './page.css';
import Link from 'next/link';
import type { Metadata } from 'next';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import file from '@/data/option-max.json';
import HashTab from './HashTab';

export const metadata: Metadata = {
  title: 'ออปชันสุ่ม Ragnarok Zero — ค่าสูงสุดแต่ละออปชัน ดรอปมอน MVP ตีเอง',
  description:
    'ออปชันสุ่มของเกราะ ผ้าคลุม รองเท้า อาวุธ และหมวกหอนาฬิกาใน Ragnarok Zero Global สุ่มได้สูงสุดเท่าไร เทียบดรอปมอน MVP Activation ตีเอง Glast Heim และ Clock Tower Gear ในตารางเดียว',
  alternates: { canonical: '/database/random-options' },
};

interface Cell { min: number; max: number; slots: number[] }
interface Row { en: string; th: string; group: string; members?: string[]; flags?: string[]; flag?: string; cells: Record<string, Cell> }
interface Kind { key: string; label: string; sources: string[]; rows: Row[] }

const { sources, groups, kinds } = file as unknown as {
  sources: { key: string; label: string }[];
  groups: { key: string; label: string }[];
  kinds: Kind[];
};
const SOURCE_LABEL = Object.fromEntries(sources.map((s) => [s.key, s.label]));

// How many option lines a piece can carry, by where it came from. Weapon
// levels from the Taiwan official pools (lib/data/random-option-pools.json),
// MVP and forging from the slot count of their pools.
const SLOTS_NOTE: Record<string, string> = {
  armor: 'ดรอปจากมอน มีออปชันได้ถึง 3 บรรทัด',
  garment: 'ดรอปจากมอนและ Glast Heim มีออปชันได้ถึง 3 บรรทัด',
  shoes: 'ดรอปจากมอน มีออปชันได้ถึง 3 บรรทัด',
  magic: 'ดรอปจากมอน: อาวุธ Lv1 ได้ 1 บรรทัด · Lv2–3 ได้ 2 บรรทัด · Lv4 ได้ 3 บรรทัด · MVP ได้ถึง 4 บรรทัด',
  melee: 'ดรอปจากมอน: อาวุธ Lv1 ได้ 1 บรรทัด · Lv2–3 ได้ 2 บรรทัด · Lv4 ได้ 3 บรรทัด · MVP ได้ถึง 4 บรรทัด · ตีเองอาวุธ Lv3 ได้ 3–4 บรรทัด',
  ranged: 'ดรอปจากมอน: อาวุธ Lv1 ได้ 1 บรรทัด · Lv2–3 ได้ 2 บรรทัด · Lv4 ได้ 3 บรรทัด · MVP ได้ถึง 4 บรรทัด · ตีเองอาวุธ Lv3 ได้ 3–4 บรรทัด',
  clock: 'ใช้ Clock Tower Gear กับ Black Witch Hat, Clock Casket, Pocket Watch Ornament หรือ Clock Tower Manager Headphones ได้ออปชัน 1 บรรทัดจากตารางนี้ ขั้นตีบวกและการ์ดยังอยู่ · จากข้อความในเกม',
};

function range(c: Cell) {
  return c.min === c.max ? `${c.min}` : `${c.min}–${c.max}`;
}

// One option: its name (and the elements or races it covers), then one
// power bar per source, scaled to the best of them so the longest bar is the
// place to farm it. A bar list instead of a grid of columns: it reads top to
// bottom on a phone with nothing to scroll sideways.
function Meter({ row, kind }: { row: Row; kind: Kind }) {
  const have = kind.sources.filter((s) => row.cells[s]);
  const top = Math.max(...have.map((s) => row.cells[s].max));
  const solo = kind.sources.length === 1;
  return (
    <li className="om">
      <div className="om__name">
        <span>{row.th}</span>
        {row.members && (
          <span className="om__members">
            {row.members.map((m) => (
              <span key={m} className={`om__chip om__chip--${m.toLowerCase().replace(/[^a-z]/g, '')}`}>{m}</span>
            ))}
          </span>
        )}
        {(row.flags || row.flag) && <span className="om__flag" title={(row.flags ?? [row.flag]).join(' · ')}>*</span>}
      </div>
      <div className="om__bars">
        {have.map((s) => {
          const c = row.cells[s];
          const best = !solo && c.max === top && have.some((o) => row.cells[o].max < top);
          return (
            <div key={s} className={`om__bar om__bar--${s}${best ? ' is-best' : ''}`}>
              {!solo && <span className="om__src">{SOURCE_LABEL[s]}</span>}
              <span className="om__track" aria-hidden="true">
                <i style={{ width: `${Math.max(6, (c.max / top) * 100)}%` }} />
              </span>
              <b className="om__max">+{c.max}</b>
              <small className="om__range">
                {range(c)} · บ.{c.slots.join(',')}
              </small>
            </div>
          );
        })}
      </div>
    </li>
  );
}

function KindMeters({ kind }: { kind: Kind }) {
  return (
    <>
      {kind.sources.length > 1 && (
        <p className="om-legend">
          {kind.sources.map((s) => (
            <span key={s} className={`om-legend__item om__bar--${s}`}>
              <i /> {SOURCE_LABEL[s]}
            </span>
          ))}
          <span className="om-legend__item om-legend__best">★ ที่ให้ค่าสูงกว่าที่อื่น</span>
        </p>
      )}
      {groups.map((g) => {
        const rows = kind.rows.filter((r) => r.group === g.key);
        if (rows.length === 0) return null;
        return (
          <div key={g.key} className="om-group">
            <h3 className="om-group__title">
              <span>▶</span> {g.label}
            </h3>
            <ul className="om-list">
              {rows.map((r) => <Meter key={r.en} row={r} kind={kind} />)}
            </ul>
          </div>
        );
      })}
    </>
  );
}

export default function RandomOptionsPage() {
  const css =
    kinds
      .map((k) => `.optmax:has(#k-${k.key}:target) a[href="#k-${k.key}"]`)
      .join(',') +
    `,.optmax:not(:has(.optmax__panel:target)) a[href="#k-${kinds[0].key}"]` +
    '{border-color:var(--yellow);color:var(--yellow);background:#221a05;box-shadow:0 0 12px rgba(255,229,61,.4)}';
  const flagged = kinds.flatMap((k) => k.rows.flatMap((r) => (r.flags ?? []).map((f) => ({ kind: k.label, row: r, f }))));

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ฐานข้อมูล', path: '/database/monsters' },
          { name: 'ออปชันสุ่ม', path: '/database/random-options' },
        ])}
      />
      <PageHeader
        title="ออปชันสุ่ม — สุ่มได้สูงสุดเท่าไร"
        lead="เลือกประเภทของ แล้วดูค่าสูงสุดของแต่ละออปชัน แยกตามที่มาของของชิ้นนั้น แถบยาวสุดที่มีดาวคือที่ที่ควรไปหา"
      />

      <div className="optmax">
        <style>{css}</style>
        <HashTab />
        <nav className="optmax__chips" aria-label="ประเภทของ">
          {kinds.map((k) => (
            <a key={k.key} href={`#k-${k.key}`} className="optmax__chip">{k.label}</a>
          ))}
        </nav>
        <div className="optmax__panels">
          {kinds.map((k) => (
            <section key={k.key} id={`k-${k.key}`} className="optmax__panel" aria-label={`ออปชันสุ่ม ${k.label}`}>
              <h2 className="optmax__title">{k.label}</h2>
              <p className="optmax__note">{SLOTS_NOTE[k.key]}</p>
              <KindMeters kind={k} />
            </section>
          ))}
        </div>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>อ่านตารางยังไง</h2>
        <ul className="optmax__how">
          <li>ตัวเลขใหญ่คือค่าสูงสุด ตัวเล็กคือช่วงที่สุ่มได้ และ บ. คือบรรทัดที่ออปชันนั้นออกได้</li>
          <li>ออปชันที่มีชื่อธาตุหรือเผ่าหลายชื่อ คือค่าเท่ากันทุกตัวในรายการ สุ่มออกมาได้ตัวเดียว</li>
          <li>แต่ละบรรทัดสุ่มได้ 1 ออปชันจากรายการของบรรทัดนั้น ออปชันเดียวกันไม่ได้อยู่ทุกบรรทัด</li>
          <li>
            ออปชันที่ของแต่ละชิ้นมีได้ ดูได้ในหน้าอุปกรณ์ชิ้นนั้นที่{' '}
            <Link href="/database/equipment">ฐานข้อมูลอุปกรณ์</Link>
          </li>
        </ul>
        {flagged.length > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            * แหล่งข้อมูลไม่ตรงกัน:{' '}
            {flagged.map(({ kind, row, f }, i) => (
              <span key={kind + row.en + f}>
                {i > 0 && ' · '}
                {kind} {row.th} {f}
              </span>
            ))}
          </p>
        )}
        <p className="source-note">
          ที่มา: ค่าดรอปมอน MVP Activation ตีเอง และ Glast Heim จาก rozerodb (7 ต.ค.) ตรงกับข้อมูลทางการของเซิร์ฟไต้หวันและ
          roztoday ทีละช่อง · Clock Tower Gear จากข้อความในเกม · ชื่อออปชันภาษาไทยตามไคลเอนต์เกมเท่าที่ไคลเอนต์มี
        </p>
      </section>
    </main>
  );
}

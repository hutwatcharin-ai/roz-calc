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
interface Row { en: string; th: string; cells: Record<string, Cell>; flag?: string }
interface Kind { key: string; label: string; sources: string[]; rows: Row[] }

const { sources, kinds } = file as unknown as { sources: { key: string; label: string }[]; kinds: Kind[] };
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

function KindTable({ kind }: { kind: Kind }) {
  const many = kind.sources.length > 1;
  return (
    <div className="optmax__scroll">
      <table className="optmax__table">
        <thead>
          <tr>
            <th scope="col">ออปชัน</th>
            {kind.sources.map((s) => (
              <th key={s} scope="col" className="optmax__src">{SOURCE_LABEL[s]}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {kind.rows.map((r) => {
            const top = Math.max(...Object.values(r.cells).map((c) => c.max));
            return (
              <tr key={r.en}>
                <th scope="row">
                  {r.th}
                  {r.flag && <span className="optmax__flag" title={r.flag}>*</span>}
                </th>
                {kind.sources.map((s) => {
                  const c = r.cells[s];
                  if (!c) return <td key={s} className="optmax__none">–</td>;
                  return (
                    <td key={s} className={many && c.max === top ? 'optmax__best' : undefined}>
                      <b>+{c.max}</b>
                      <small>{range(c)} · บรรทัด {c.slots.join(',')}</small>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function RandomOptionsPage() {
  const css =
    kinds
      .map((k) => `.optmax:has(#k-${k.key}:target) a[href="#k-${k.key}"]`)
      .join(',') +
    `,.optmax:not(:has(.optmax__panel:target)) a[href="#k-${kinds[0].key}"]` +
    '{border-color:var(--yellow);color:var(--yellow);background:#221a05;box-shadow:0 0 12px rgba(255,229,61,.4)}';
  const flagged = kinds.flatMap((k) => k.rows.filter((r) => r.flag).map((r) => ({ kind: k.label, row: r })));

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
        lead="เลือกประเภทของ แล้วดูค่าสูงสุดของแต่ละออปชัน แยกตามที่มาของของชิ้นนั้น ช่องสีเหลืองคือที่มาที่ให้ค่าสูงที่สุด"
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
              <KindTable kind={k} />
            </section>
          ))}
        </div>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title" style={{ marginTop: 0 }}>อ่านตารางยังไง</h2>
        <ul className="optmax__how">
          <li>ตัวใหญ่คือค่าสูงสุด ตัวเล็กใต้ค่าคือช่วงที่สุ่มได้ และบรรทัดที่ออปชันนั้นออกได้</li>
          <li>แต่ละบรรทัดสุ่มได้ 1 ออปชันจากรายการของบรรทัดนั้น ออปชันเดียวกันไม่ได้อยู่ทุกบรรทัด</li>
          <li>
            ออปชันที่ของแต่ละชิ้นมีได้ ดูได้ในหน้าอุปกรณ์ชิ้นนั้นที่{' '}
            <Link href="/database/equipment">ฐานข้อมูลอุปกรณ์</Link>
          </li>
        </ul>
        {flagged.length > 0 && (
          <p className="muted" style={{ fontSize: 13 }}>
            * แหล่งข้อมูลไม่ตรงกัน:{' '}
            {flagged.map(({ kind, row }, i) => (
              <span key={kind + row.en}>
                {i > 0 && ' · '}
                {kind} {row.th} ({row.flag})
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

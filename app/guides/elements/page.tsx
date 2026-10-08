// app/guides/elements/page.tsx
import Link from 'next/link';
import { ELEMENT_TH } from '@/lib/monster-th';

// The element column's own values, paired with the Thai the monster list
// shows. Only the ten a monster can carry -- the table above also has rows
// for attack elements a monster never is.
const MONSTER_ELEMENTS: [string, string][] = [
  ['Neutral', 'ไร้ธาตุ'],
  ['Water', 'น้ำ'],
  ['Earth', 'ดิน'],
  ['Fire', 'ไฟ'],
  ['Wind', 'ลม'],
  ['Poison', 'พิษ'],
  ['Holy', 'ศักดิ์สิทธิ์'],
  ['Shadow', 'มืด'],
  ['Ghost', 'ผี'],
  ['Undead', 'อันเดด'],
];
import ElementTable from '@/components/ElementTable';
import DamagePicker from '@/components/DamagePicker';
import PageHeader from '@/components/PageHeader';
import { ELEMENTS, elementModifier, type Element, type ElementLevel } from '@/lib/element-table';

const EL_COLOR: Record<Element, string> = {
  Neutral: '#c9c3e6', Water: '#3d9bff', Earth: '#d9a640', Fire: '#ff6b3d', Wind: '#4dffb8',
  Poison: '#b26bff', Holy: '#ffe53d', Shadow: '#8a7bb8', Ghost: '#7ad7ff', Undead: '#ff5c8a',
};

/** For each monster element at level 1: the attack elements that hit hardest, and the ones that do nothing. */
function cheat(def: Element) {
  const rows = ELEMENTS.map((a) => ({ a, v: elementModifier(a, def, 1) }));
  const top = Math.max(...rows.map((r) => r.v));
  return {
    best: top > 100 ? rows.filter((r) => r.v === top) : [],
    top,
    none: rows.filter((r) => r.v <= 0),
  };
}

export const metadata = {
  title: 'ตารางธาตุ Ragnarok Zero',
  description:
    'ตารางตัวคูณความเสียหายธาตุโจมตี × ธาตุป้องกันของ Ragnarok Zero Global ครบทั้ง 4 ระดับธาตุ ดูว่าอาวุธธาตุไหนแรงกับมอนธาตุอะไร',
};

const LEVELS: ElementLevel[] = [1, 2, 3, 4];

export default function ElementsPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="ตารางธาตุ Ragnarok Zero"
        lead="แถว = ธาตุอาวุธ · คอลัมน์ = ธาตุเป้าหมาย · ตัวเลข = ดาเมจที่เหลือ (100% เท่าเดิม, เกินคือแรงขึ้น) · ระดับธาตุของมอน (1–4) ดูได้ในหน้ามอนตัวนั้น"
      />

      {/* The answer most readers came for, before the 400-cell tables. */}
      <section className="card card--yellow">
        <h2 className="section-title">เจอมอนธาตุนี้ ใช้ธาตุอะไรตี (ระดับ 1)</h2>
        <div className="elcheat">
          {MONSTER_ELEMENTS.map(([code, th]) => {
            const c = cheat(code as Element);
            return (
              <Link key={code} className="elcheat__row" href={`/database/monsters?element=${code}`} style={{ '--el': EL_COLOR[code as Element] } as React.CSSProperties}>
                <span className="elcheat__def">มอน{th}</span>
                <span className="elcheat__best">
                  {c.best.length ? (
                    <>
                      <b>{c.top}%</b> {c.best.map((r) => ELEMENT_TH[r.a] ?? r.a).join(' · ')}
                    </>
                  ) : (
                    <span className="muted">ไม่มีธาตุไหนแรงกว่าปกติ</span>
                  )}
                </span>
                {c.none.length > 0 && <span className="elcheat__none">0% {c.none.map((r) => ELEMENT_TH[r.a] ?? r.a).join(' · ')}</span>}
              </Link>
            );
          })}
        </div>
        <p className="muted" style={{ marginBottom: 0 }}>กดแถวเพื่อดูมอนธาตุนั้นทั้งหมด · ระดับธาตุสูงขึ้นตัวเลขเปลี่ยน ดูตารางเต็มด้านล่าง</p>
      </section>

      {/* Spec 3.5 asked for a permanent warning because the only source at the
          time was Renewal reference data. The source is now the game's own
          guide, so this says where the numbers come from instead of warning
          that they might not apply. */}
      <p className="source-note">
        <strong>ที่มา:</strong> คู่มือเกมทางการ ตรวจกับตาราง rAthena ตรงกัน 399/400 ช่อง ·
        ช่องเดียวที่ต่าง (Undead ตี Poison ระดับ 2) เว็บนี้ใช้ค่า rAthena เพราะแถวนั้นในคู่มือน่าจะพิมพ์ผิด
      </p>

      <p className="muted" style={{ marginTop: 12, maxWidth: '65ch' }}>
        คู่มือเรียกธาตุ Ghost ว่า <strong>Ninja Aura</strong> เว็บนี้ใช้ชื่อ Ghost ตามตัวเกม
      </p>

      {/* Element and size multiply: pick a weapon element, its size row and a
          target, see the product. Moved here from /tools/damage when that page
          went into the build simulator (owner, 8 Oct 2026). */}
      <h2 className="section-title" style={{ marginTop: 24 }}>เทียบธาตุกับขนาดอาวุธ ตีเข้ากี่ %</h2>
      <p className="muted" style={{ marginTop: 6, maxWidth: '65ch' }}>
        ธาตุกับขนาดเป็นตัวคูณคนละตัวที่<strong>คูณกัน</strong> ธาตุ 200% เจอขนาด 50% ก็เหลือ 100% เท่ามือเปล่า ·
        อยากรู้ดาเมจจริงของบิลด์คุณ ใช้ <Link href="/tools/build">จำลองบิลด์</Link>
      </p>
      <DamagePicker />

      {LEVELS.map((level) => (
        <ElementTable key={level} level={level} />
      ))}

      {/* One link per element rather than one link to the list. The table
          above answers "what beats what"; the next thing a reader wants is
          the monsters of that element, and until the monster list grew chips
          there was no URL to send them to. */}
      <section className="rolepick" style={{ marginTop: 20 }}>
        <h2 className="rolepick__label">ดูมอนสเตอร์ตามธาตุ</h2>
        <div className="chips">
          {MONSTER_ELEMENTS.map(([code, th]) => (
            <Link key={code} className="chip" href={`/database/monsters?element=${code}`}>
              {th}
            </Link>
          ))}
        </div>
      </section>

      <p className="muted" style={{ marginTop: 16 }}>
        อยากรู้ว่ามอนตัวไหนธาตุอะไร ดูได้ที่ <Link href="/database/monsters">หน้ารายการมอนสเตอร์</Link>{' '}
        ซึ่งกรองตามธาตุ เผ่า และขนาดได้
      </p>
    </main>
  );
}

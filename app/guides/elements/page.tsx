// app/guides/elements/page.tsx
import Link from 'next/link';

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
import type { ElementLevel } from '@/lib/element-table';

export const metadata = {
  title: 'ตารางธาตุ Ragnarok Zero',
  description:
    'ตารางตัวคูณความเสียหายธาตุโจมตี × ธาตุป้องกันของ Ragnarok Zero Global ครบทั้ง 4 ระดับธาตุ ดูว่าอาวุธธาตุไหนแรงกับมอนธาตุอะไร',
};

const LEVELS: ElementLevel[] = [1, 2, 3, 4];

export default function ElementsPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ตารางธาตุ Ragnarok Zero</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        แถว = ธาตุอาวุธ · คอลัมน์ = ธาตุเป้าหมาย · ตัวเลข = ดาเมจที่เหลือ (100% เท่าเดิม, เกินคือแรงขึ้น) ·
        ระดับธาตุของมอน (1–4) ดูได้ในหน้ามอนตัวนั้น
      </p>

      {/* Spec 3.5 asked for a permanent warning because the only source at the
          time was Renewal reference data. The source is now the game's own
          guide, so this says where the numbers come from instead of warning
          that they might not apply. */}
      <p className="source-note">
        <strong>ที่มา:</strong> คู่มือเกมทางการ ตรวจกับตาราง rAthena ตรงกัน 399/400 ช่อง ·
        ช่องเดียวที่ต่าง (Undead ตี Poison ระดับ 2) เว็บนี้ใช้ค่า rAthena เพราะแถวนั้นในคู่มือน่าจะพิมพ์ผิด
      </p>

      <p className="muted" style={{ marginTop: 12, maxWidth: '65ch' }}>
        คู่มือเรียกธาตุ Ghost ว่า <strong>Ninja Aura</strong> — เว็บนี้ใช้ชื่อ Ghost ตามตัวเกม
      </p>

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

// app/tools/elements/page.tsx
import Link from 'next/link';
import ElementTable from '@/components/ElementTable';
import type { ElementLevel } from '@/lib/element-table';

export const metadata = {
  title: 'ตารางธาตุ',
  description:
    'ตารางตัวคูณความเสียหายธาตุโจมตี × ธาตุป้องกันของ Ragnarok Zero Global ครบทั้ง 4 ระดับธาตุ ดูว่าอาวุธธาตุไหนแรงกับมอนธาตุอะไร',
};

const LEVELS: ElementLevel[] = [1, 2, 3, 4];

export default function ElementsPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ตารางธาตุ</h1>
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

      <p className="muted" style={{ marginTop: 20 }}>
        อยากรู้ว่ามอนตัวไหนธาตุอะไร ดูได้ที่ <Link href="/database/monsters">หน้ารายการมอนสเตอร์</Link>{' '}
        ซึ่งกรองตามธาตุได้
      </p>
    </main>
  );
}

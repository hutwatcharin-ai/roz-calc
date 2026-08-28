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
        แถวคือธาตุของอาวุธที่คุณใช้ คอลัมน์คือธาตุของเป้าหมาย ตัวเลขคือความเสียหายที่เหลือ —
        100% คือเท่าเดิม 0% คือไม่เข้าเลย เกิน 100% คือแรงขึ้น · มอนสเตอร์แต่ละตัวมีระดับธาตุ 1–4
        ดูได้ที่หน้ามอนตัวนั้น แล้วมาเทียบกับตารางระดับเดียวกัน
      </p>

      {/* Spec 3.5 asked for a permanent warning because the only source at the
          time was Renewal reference data. The source is now the game's own
          guide, so this says where the numbers come from instead of warning
          that they might not apply. */}
      <p className="source-note">
        <strong>ที่มา:</strong> คู่มือเกมทางการ (ระบบพิเศษ &gt; ระบบธาตุ) ครบทั้ง 4 ระดับ ·
        ตรวจทานทีละช่องกับตาราง Renewal ของ rAthena <strong>ตรงกัน 399 จาก 400 ช่อง</strong> ·
        ช่องที่ต่างคือ Undead ตี Poison ระดับ 2 คู่มือเขียน 75 rAthena เขียน 50 —
        <strong>เว็บนี้ใช้ 50</strong> เพราะแถวระดับ 2 ของคู่มือซ้ำกับแถวระดับ 1 ทุกตัวอักษร
        น่าจะเป็นการพิมพ์ผิดของหน้านั้นเอง
      </p>

      <p className="muted" style={{ marginTop: 12, maxWidth: '65ch' }}>
        หมายเหตุชื่อธาตุ: คู่มือทางการเรียกธาตุ Ghost ว่า <strong>Ninja Aura</strong> ·
        เว็บนี้ใช้ชื่อ Ghost ตามที่ข้อมูลมอนสเตอร์และตัวเกมใช้ ค่าทุกช่องเป็นของธาตุเดียวกัน
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

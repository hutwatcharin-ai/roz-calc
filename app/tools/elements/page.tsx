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
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ตารางธาตุ</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        แถวคือธาตุของอาวุธที่คุณใช้ คอลัมน์คือธาตุของเป้าหมาย ตัวเลขคือความเสียหายที่เหลือ —
        100% คือเท่าเดิม 0% คือไม่เข้าเลย เกิน 100% คือแรงขึ้น · มอนสเตอร์แต่ละตัวมีระดับธาตุ 1–4
        ดูได้ที่หน้ามอนตัวนั้น แล้วมาเทียบกับตารางระดับเดียวกัน
      </p>

      {/* Permanent, not dismissible -- spec 3.5 requires it, and the source is
          named so a reader can go and check rather than take our word. */}
      <div className="ceiling-note" style={{ marginTop: 16 }}>
        <strong>ที่มาของตัวเลข:</strong> ตารางนี้มาจากไฟล์ <code>db/re/attr_fix.yml</code> ของ{' '}
        <a href="https://github.com/rathena/rathena" target="_blank" rel="noopener noreferrer">
          rAthena
        </a>{' '}
        ซึ่งเป็นค่าของระบบ Renewal มาตรฐาน — <strong>ยังไม่มีใครยืนยันว่าตรงกับ Zero ทุกช่อง</strong> ·
        เว็บนี้อ้างอิง rAthena ได้เฉพาะฝั่ง "สูตร" ซึ่งรวมตารางธาตุ ส่วนฝั่ง "ข้อมูล" อย่างค่าสถานะมอน
        อัตราตีบวก และผังสกิล Zero แก้ใหม่หมด จึงไม่เอามาใช้
      </div>

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

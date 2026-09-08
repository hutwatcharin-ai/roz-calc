// app/guides/ore-refining/page.tsx
import Link from 'next/link';
import CraftGuide from '@/components/CraftGuide';
import { craftCounts } from '@/lib/crafting';

export const revalidate = 86400;

export const metadata = {
  title: 'หลอมแร่และหินธาตุ Ragnarok Zero — Iron, Steel, หินธาตุ',
  description:
    'สูตรหลอมแร่ของ Blacksmith ใน Ragnarok Zero Global — Iron Ore เป็น Iron, Iron เป็น Steel, และหินธาตุทั้งสี่ทำจากอะไร',
};

export default function OreRefiningPage() {
  const counts = craftCounts();
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">หลอมแร่และหินธาตุ</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        {counts.ore?.total ?? 0} สูตรพื้นฐานที่ทุกอย่างของ Blacksmith ตั้งอยู่บนนี้ —
        แร่ดิบเป็นแร่ใช้งาน และของดรอปจากมอนธาตุเป็นหินธาตุสำหรับตีอาวุธธาตุ
      </p>

      <CraftGuide
        kind="ore"
        extra={
          <p className="muted" style={{ marginTop: 16 }}>
            หินธาตุที่หลอมได้เอาไปใช้ต่อที่ <Link href="/guides/forging">ตีอาวุธและทำอาวุธธาตุ</Link>{' '}
            · เหล็กที่หลอมได้ใช้ที่ <Link href="/guides/forging">ตีอาวุธ</Link>
          </p>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}

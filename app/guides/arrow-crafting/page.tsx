// app/guides/arrow-crafting/page.tsx
import Link from 'next/link';
import CraftGuide from '@/components/CraftGuide';
import { craftCounts } from '@/lib/crafting';

export const revalidate = 86400;

export const metadata = {
  title: 'ทำลูกศร Ragnarok Zero — เอาอะไรมาทำได้บ้าง',
  description:
    'ตารางทำลูกศรของ Archer ใน Ragnarok Zero Global — ของชิ้นไหนแปลงเป็นลูกศรอะไรได้กี่ดอก ครบทุกสูตร',
};

export default function ArrowCraftingPage() {
  const counts = craftCounts();
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ทำลูกศร — ของอะไรทำเป็นลูกศรอะไร</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        สกิล Making Arrow ของ Archer แปลงของทิ้งๆ ให้เป็นลูกศรได้ {counts.arrow?.total ?? 0} สูตร
        · ของบางชิ้นให้ลูกศรทีละหลายร้อยดอก คุ้มกว่าซื้อมาก และเป็นวิธีเคลียร์ของในกระเป๋าไปในตัว
      </p>

      <CraftGuide
        kind="arrow"
        sortBy="material"
        extra={
          <p className="muted" style={{ marginTop: 16 }}>
            อยากรู้ว่ามอนตัวไหนดรอปของที่เอามาทำลูกศรได้ ลองที่{' '}
            <Link href="/drop-finder">ค้นของดรอป</Link>
          </p>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}

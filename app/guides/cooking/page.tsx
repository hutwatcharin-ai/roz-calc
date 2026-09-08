// app/guides/cooking/page.tsx
import Link from 'next/link';
import CraftGuide from '@/components/CraftGuide';
import { craftCounts } from '@/lib/crafting';

export const revalidate = 86400;

export const metadata = {
  title: 'ทำอาหาร Ragnarok Zero — สูตรและวัตถุดิบ',
  description:
    'อาหารเพิ่มสเตตัสใน Ragnarok Zero Global ทำจากอะไรบ้าง ต้องมีตำราเล่มไหนติดตัว ครบทุกสูตรที่ตรวจแล้ว',
};

export default function CookingPage() {
  const counts = craftCounts();
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ทำอาหาร — สูตรทั้งหมด</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        อาหารเพิ่มสเตตัสชั่วคราว ทำได้ {counts.cook?.total ?? 0} อย่าง
        · ต้องมี<strong>ชุดทำอาหาร</strong>กับ<strong>ตำรา</strong>ระดับที่ตรงกับสูตรติดตัวไว้ ตำราไม่หายไปตอนทำ
        ใช้ซ้ำได้เรื่อยๆ
      </p>

      <CraftGuide
        kind="cook"
        extra={
          <p className="muted" style={{ marginTop: 16 }}>
            อาหารเพิ่มสเตตัสตัวไหนคุ้มกับที่จะทำ ขึ้นกับว่าจะเอาไปสู้อะไร — ลองดูที่{' '}
            <Link href="/tools/damage">ตีมอนด้วยอะไรดี</Link> ก่อนก็ได้
          </p>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}

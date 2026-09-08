// app/guides/forging/page.tsx
import Link from 'next/link';
import CraftGuide from '@/components/CraftGuide';
import { craftCounts } from '@/lib/crafting';

export const revalidate = 86400;

export const metadata = {
  title: 'ตีอาวุธ Blacksmith Ragnarok Zero — สูตรและวัตถุดิบ',
  description:
    'อาวุธที่ Blacksmith ตีเองได้ใน Ragnarok Zero Global พร้อมวัตถุดิบครบทุกสูตร ระดับอาวุธ และวิธีเพิ่มโอกาสสำเร็จ',
};

export default function ForgingPage() {
  const counts = craftCounts();
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ตีอาวุธเอง — สูตรทั้งหมด</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        Blacksmith ตีอาวุธเองได้ {counts.forge?.total ?? 0} แบบ ตั้งแต่ดาบเหล็กธรรมดาไปจนถึงอาวุธระดับ 4
        · ของที่ตีได้ขายต่อได้ และเป็นฐานของอาวุธธาตุ
      </p>

      <CraftGuide
        kind="forge"
        extra={
          <div className="card" style={{ marginTop: 16 }}>
            <h2 className="section-title">อยากให้ตีติดบ่อยขึ้น</h2>
            <ul style={{ marginTop: 8, paddingInlineStart: 20, lineHeight: 1.9 }}>
              <li><strong>Job level, DEX, LUK</strong> — สามตัวนี้เป็นฐานของอัตราสำเร็จ</li>
              <li><strong>ระดับอาวุธ</strong> — อาวุธระดับ 1-3 ได้โบนัส ระดับ 4 ไม่ได้</li>
              <li><strong>สกิล</strong> — Smith สายนั้น +5% ต่อเลเวล · Weaponry Research +1% ต่อเลเวล</li>
              <li><strong>ทั่ง</strong> — ทั่งธรรมดา +0% · Oridecon +2.5% · ทอง +5% · Emperium +10%</li>
              <li><strong>ของที่ทำให้ยากขึ้น</strong> — หินธาตุ −25% · Star Crumb ชิ้นละ −15% (แลกกับอาวุธที่แรงขึ้น)</li>
            </ul>
            <p className="muted" style={{ marginTop: 10 }}>
              เซิร์ฟเวอร์สุ่มโบนัสบวกเข้าไปในอัตราสำเร็จทุกครั้งที่ตี อัตราจึงไม่ใช่ตัวเลขเดียวคงที่ —
              ตัวละครเดิม ตีรอบนี้กับรอบหน้าโอกาสไม่เท่ากัน · ดู <Link href="/guides/elemental-weapons">วิธีทำอาวุธธาตุ</Link> ต่อได้
            </p>
          </div>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}

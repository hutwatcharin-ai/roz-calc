// app/tools/farm-planner/page.tsx
import FarmPlannerBoard from '@/components/FarmPlannerBoard';

export const metadata = {
  title: 'แผนฟาร์ม',
  description:
    'บันทึกรายชื่อมอนสเตอร์ที่วางแผนจะไปฟาร์มใน Ragnarok Zero Global แล้วดู EXP/HP, Zeny ต่อตัว, แมพที่เจอ และผลรวมในหน้าเดียว',
};

export default function FarmPlannerPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>แผนฟาร์ม</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '65ch' }}>
        กดปุ่ม "เพิ่มเข้าแผน" จากหน้ามอนสเตอร์หรือจากตารางในหน้าแรก แล้วรายการจะมารวมกันที่นี่
        เก็บไว้ในเบราว์เซอร์ของคุณเครื่องเดียว ไม่ต้องสมัครสมาชิก
      </p>
      <FarmPlannerBoard />
    </main>
  );
}

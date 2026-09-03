// app/tools/skill-planner/page.tsx
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import SkillPlanner from '@/components/SkillPlanner';

export const metadata = {
  title: 'วางแผนสกิล (Skill Simulator)',
  description:
    'จัดสกิลของทุกอาชีพใน Ragnarok Zero Global แบบเดียวกับหน้าต่างสกิลในเกม กดใส่แต้มได้ ล็อกสกิลที่ยังไม่ปลด นับแต้มต่ออาชีพ แชร์บิลด์ด้วยลิงก์',
};

export default function SkillPlannerPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="วางแผนสกิล Ragnarok Zero" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        กด + เพื่อใส่แต้ม สกิลที่ยังไม่ปลดจะบอกว่าต้องมีอะไรก่อน และกด + ที่สกิลปลายทางจะไล่ใส่แต้มสกิลต้นทางให้เอง ·
        ลิงก์บนแถบที่อยู่คือบิลด์ ก๊อปส่งให้เพื่อนได้เลย
      </p>
      {/* useSearchParams needs a Suspense boundary or the whole route opts out
          of static rendering. */}
      <Suspense fallback={<p className="muted">กำลังโหลด…</p>}>
        <SkillPlanner />
      </Suspense>
      <p className="source-note" style={{ marginTop: 20 }}>
        เงื่อนไขสกิล ตำแหน่งช่อง และเพดานแต้มต่ออาชีพ (10 / 49 / 59) มาจากฐานข้อมูลของ prontera.info ·
        เพดานแต้มใช้เป็นคำเตือน ไม่ได้ล็อก
      </p>
    </main>
  );
}

// app/tools/skill-planner/page.tsx
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import SkillPlanner from '@/components/SkillPlanner';
import { supabaseBrowser } from '@/lib/supabase';

export const revalidate = 86400;

// Icons come from our own mirrored sprites (public/images/skills), keyed by
// the same slug the tree uses -- never hotlinked from the site the tree data
// came from.
async function skillIcons(): Promise<Record<string, string>> {
  const icons: Record<string, string> = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseBrowser()
      .from('skills')
      .select('slug, icon_url')
      .order('slug')
      .range(from, from + 999);
    // No icons is a worse page, not a broken one: the planner renders with
    // name-only cells rather than failing.
    if (error) {
      console.error('skill icon query failed', error);
      return icons;
    }
    if (!data || data.length === 0) break;
    for (const row of data) if (row.icon_url) icons[row.slug] = row.icon_url;
    if (data.length < 1000) break;
  }
  return icons;
}

export const metadata = {
  title: 'วางแผนสกิล (Skill Simulator)',
  description:
    'จัดสกิลของทุกอาชีพใน Ragnarok Zero Global แบบเดียวกับหน้าต่างสกิลในเกม กดใส่แต้มได้ ล็อกสกิลที่ยังไม่ปลด นับแต้มต่ออาชีพ แชร์บิลด์ด้วยลิงก์',
};

export default async function SkillPlannerPage() {
  const icons = await skillIcons();

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="วางแผนสกิล Ragnarok Zero" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        กด + ใส่แต้ม — สกิลที่ยังไม่ปลดจะไล่ใส่ให้เอง · ลิงก์บนแถบที่อยู่คือบิลด์
      </p>
      {/* useSearchParams needs a Suspense boundary or the whole route opts out
          of static rendering. */}
      <Suspense fallback={<p className="muted">กำลังโหลด…</p>}>
        <SkillPlanner icons={icons} />
      </Suspense>
      <Caveat label="ที่มาของข้อมูล">
        เงื่อนไขสกิล ตำแหน่งช่อง และเพดานแต้มต่ออาชีพ (10 / 49 / 59) มาจากฐานข้อมูลของ prontera.info ·
        เพดานแต้มใช้เป็นคำเตือน ไม่ได้ล็อก
      </Caveat>
    </main>
  );
}

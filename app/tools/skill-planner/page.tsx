// app/tools/skill-planner/page.tsx
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import SkillPlanner from '@/components/SkillPlanner';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import type { SkillLevelMap } from '@/lib/skill-details';

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

// What each level of a skill does, and the Thai sentence about the skill
// itself. Fetched here rather than in the planner so the client gets plain
// maps instead of a query: 339 of the tree's 341 skills have per-level rows
// and 259 have a Thai description.
async function skillDetails(): Promise<{ levels: SkillLevelMap; descriptions: Record<string, string> }> {
  const db = supabaseBrowser();
  const levels: SkillLevelMap = {};
  const descriptions: Record<string, string> = {};

  const { data: rows, error } = await fetchAllRows<{
    skill_slug: string;
    level: number;
    effect: string | null;
    sp_cost: number | null;
    attack_range: number | null;
    cast_time_ms: number | null;
  }>((from, to) =>
    db
      .from('skill_levels')
      .select('skill_slug, level, effect, sp_cost, attack_range, cast_time_ms')
      .order('skill_slug')
      .order('level')
      .range(from, to),
  );
  // Missing details make a plainer tooltip, not a broken page.
  if (error) console.error('skill level query failed', error);
  for (const r of rows ?? []) {
    const facts: Record<string, string | number> = {};
    if (r.effect) facts.e = r.effect;
    if (r.sp_cost) facts.sp = r.sp_cost;
    if (r.attack_range) facts.r = r.attack_range;
    if (r.cast_time_ms) facts.c = r.cast_time_ms;
    if (Object.keys(facts).length === 0) continue;
    levels[r.skill_slug] = { ...(levels[r.skill_slug] ?? {}), [r.level]: facts };
  }

  const { data: skills, error: skillsError } = await db
    .from('skills')
    .select('slug, description_th')
    .not('description_th', 'is', null)
    .range(0, 1999);
  if (skillsError) console.error('skill description query failed', skillsError);
  for (const s of skills ?? []) if (s.description_th) descriptions[s.slug] = s.description_th;

  return { levels, descriptions };
}

export const metadata = {
  title: 'วางแผนสกิล (Skill Simulator)',
  description:
    'จัดสกิลของทุกอาชีพใน Ragnarok Zero Global แบบเดียวกับหน้าต่างสกิลในเกม กดใส่แต้มได้ ล็อกสกิลที่ยังไม่ปลด นับแต้มต่ออาชีพ แชร์บิลด์ด้วยลิงก์',
};

export default async function SkillPlannerPage() {
  const [icons, details] = await Promise.all([skillIcons(), skillDetails()]);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="วางแผนสกิล Ragnarok Zero" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        กด + ใส่แต้ม — สกิลที่ยังไม่ปลดจะไล่ใส่ให้เอง · ลิงก์บนแถบที่อยู่คือบิลด์
      </p>
      {/* useSearchParams needs a Suspense boundary or the whole route opts out
          of static rendering. */}
      <Suspense fallback={<p className="muted">กำลังโหลด…</p>}>
        <SkillPlanner icons={icons} levels={details.levels} descriptions={details.descriptions} />
      </Suspense>
      <Caveat label="ที่มาของข้อมูล">
        เงื่อนไขสกิล ตำแหน่งช่อง และเพดานแต้มต่ออาชีพ (10 / 49 / 59) มาจากฐานข้อมูลของ prontera.info ·
        เพดานแต้มใช้เป็นคำเตือน ไม่ได้ล็อก
      </Caveat>
    </main>
  );
}

// app/tools/skill-planner/page.tsx
import { Suspense } from 'react';
import PageHeader from '@/components/PageHeader';
import Caveat from '@/components/Caveat';
import SkillPlanner from '@/components/SkillPlanner';
import { supabaseRead } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import type { SkillLevelMap } from '@/lib/skill-details';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import skillExtra from '@/data/skill-level-extra.json';
import Link from 'next/link';
import { CLASS_SLUGS, lineFor } from '@/lib/skill-planner';
import { classGuide } from '@/lib/class-guides';

export const revalidate = 86400;

// Icons come from our own mirrored sprites (public/images/skills), keyed by
// the same slug the tree uses -- never hotlinked from the site the tree data
// came from.
async function skillIcons(): Promise<Record<string, string>> {
  const icons: Record<string, string> = {};
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseRead()
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
  const db = supabaseRead();
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
  // Cast split, after-cast delay, cooldown and hits per level, which
  // skill_levels does not carry (data/skill-level-extra.json, prontera.info).
  for (const [slug, byLevel] of Object.entries((skillExtra as { skills: Record<string, Record<string, object>> }).skills)) {
    for (const [lv, extra] of Object.entries(byLevel)) {
      levels[slug] = { ...(levels[slug] ?? {}), [lv]: { ...(levels[slug]?.[lv] ?? {}), ...extra } };
    }
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

// The words people type are "อัพสกิล ro" (490 impressions in 28 days, average
// position 7.4) and "ทดลอง/จำลองอัพสกิล ro"; the title said neither (8 Oct
// 2026). Check GSC on 21 Oct: position and clicks for those queries.
export const metadata = {
  title: 'จำลองอัพสกิล Ragnarok Zero — วางแผนสกิลทุกอาชีพ (Skill Simulator)',
  description:
    'ทดลองอัพสกิลทุกอาชีพใน Ragnarok Zero Global แบบเดียวกับหน้าต่างสกิลในเกม กดใส่แต้มได้ สกิลที่ยังไม่ปลดไล่ใส่ให้เอง นับแต้มต่ออาชีพ แชร์บิลด์ด้วยลิงก์',
};

export default async function SkillPlannerPage() {
  const [icons, details] = await Promise.all([skillIcons(), skillDetails()]);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'วางแผนสกิล', path: '/tools/skill-planner' },
      ])} />
      <PageHeader title="จำลองอัพสกิล Ragnarok Zero" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        กด + ใส่แต้ม สกิลที่ยังไม่ปลดจะไล่ใส่ให้เอง · ลิงก์บนแถบที่อยู่คือบิลด์
      </p>
      {/* useSearchParams needs a Suspense boundary or the whole route opts out
          of static rendering. */}
      <Suspense fallback={<p className="muted">กำลังโหลด…</p>}>
        <SkillPlanner icons={icons} levels={details.levels} descriptions={details.descriptions} />
      </Suspense>
      {/* The tool above is all buttons; a reader (or a crawler) who lands here
          gets no words about what it does. Everything below is read off the
          same tree the planner uses, so the numbers cannot drift from it. */}
      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="section-title">ใช้ยังไง</h2>
        <ol className="splan__how">
          <li>เลือกอาชีพที่แถบด้านบน ต้นไม้สกิลจะขึ้นครบทั้งสาย ตั้งแต่อาชีพแรกจนถึงอาชีพสอง</li>
          <li>กด + ที่สกิลที่อยากได้ ถ้าสกิลนั้นต้องอัพสกิลอื่นก่อน เครื่องมือจะใส่แต้มสกิลที่ต้องมีให้เอง</li>
          <li>ชี้หรือแตะที่สกิลเพื่อดูผลของแต่ละเลเวล SP ที่ใช้ ระยะ เวลาร่าย และดีเลย์</li>
          <li>ดูแต้มที่ใช้ไปของแต่ละอาชีพ ถ้าเกินแต้มที่มีจะขึ้นเตือน แต่ไม่ล็อก เผื่ออยากลองดูก่อน</li>
          <li>กด “คัดลอกลิงก์บิลด์” แล้วส่งให้เพื่อน เปิดลิงก์แล้วได้บิลด์เดียวกันทันที ไม่ต้องสมัครสมาชิก</li>
        </ol>
        <p className="muted" style={{ fontSize: 13.5 }}>
          สกิลเควสของ Ragnarok Zero ได้มาพร้อมอาชีพ ไม่ต้องทำเควสและไม่เสียแต้ม เครื่องมือจึงไม่นับแต้มสกิลกลุ่มนี้
        </p>
      </section>

      <section className="card" style={{ marginTop: 14 }}>
        <h2 className="section-title">อาชีพที่วางแผนได้</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="stat-table">
            <thead>
              <tr><th scope="col">อาชีพ</th><th scope="col">สายอาชีพ</th><th scope="col" className="num">สกิลทั้งสาย</th><th scope="col" className="num">แต้มสกิลที่มี</th><th scope="col">ไกด์</th></tr>
            </thead>
            <tbody>
              {CLASS_SLUGS.map((slug) => {
                const line = lineFor(slug);
                const last = line[line.length - 1];
                const guide = classGuide(slug);
                return (
                  <tr key={slug}>
                    <th scope="row"><Link href={`/tools/skill-planner?class=${slug}`}>{last?.name ?? slug}</Link></th>
                    <td>{line.map((s) => s.name).join(' → ')}</td>
                    <td className="num mono">{line.reduce((n, s) => n + s.skills.length, 0)}</td>
                    <td className="num mono">{line.map((s) => s.skill_points).join(' + ')}</td>
                    <td>{guide ? <Link href={`/guides/classes/${guide.slug}`}>ไกด์ {guide.job}</Link> : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 8 }}>
          อยากรู้ว่าแต่ละสกิลทำอะไรแบบละเอียด ดูที่ <Link href="/database/skills">ฐานข้อมูลสกิล</Link> ·
          อยากลองว่าบิลด์นี้ตีแรงแค่ไหน ใช้ <Link href="/tools/build">เครื่องจำลองบิลด์</Link>
        </p>
      </section>

      <Caveat label="ที่มาของข้อมูล">
        เงื่อนไขสกิลกับตำแหน่งช่องมาจากฐานข้อมูลของ prontera.info · เพดานแต้มต่ออาชีพ 10 / 49 / 69 ตาม Job ตัน 70 ของอาชีพ 2 ·
        เพดานแต้มใช้เป็นคำเตือน ไม่ได้ล็อก
      </Caveat>
    </main>
  );
}

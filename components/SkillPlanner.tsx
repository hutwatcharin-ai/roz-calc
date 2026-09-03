'use client';

// The interactive half of /tools/skill-planner. All the rules live in
// lib/skill-planner.ts, which has no React in it and is tested directly; this
// file is the surface: a grid per class stage, plus/minus per skill, a point
// counter that warns rather than blocks, and a URL that always holds the build
// so a link is the share format.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  blockedBy,
  CLASS_SLUGS,
  decodeBuild,
  encodeBuild,
  lineFor,
  lower,
  raise,
  spendByStage,
  type Build,
  type PlannerSkill,
} from '@/lib/skill-planner';

// The in-game skill window is a grid, and tree_slot is a position in it. The
// slots run 0..34 with gaps, and Novice's three skills sit at 0, 7 and 14 --
// one column apart, which is what fixes the width at seven. Empty cells are
// rendered as gaps so a skill keeps its place instead of sliding up.
const COLUMNS = 7;

const TIER_LABELS: Record<string, string> = {
  base: 'อาชีพเริ่มต้น',
  first_class: 'อาชีพ 1',
  second_job: 'อาชีพ 2',
};

function SkillCell({
  skill,
  level,
  blocking,
  onRaise,
  onLower,
}: {
  skill: PlannerSkill;
  level: number;
  blocking: { slug: string; name: string; level: number }[];
  onRaise: () => void;
  onLower: () => void;
}) {
  const max = skill.max_level ?? 1;
  const locked = blocking.length > 0 && level === 0;

  return (
    <div className={`skillcell${level > 0 ? ' skillcell--taken' : ''}${locked ? ' skillcell--locked' : ''}`}>
      <div className="skillcell__head">
        <span className="skillcell__name">{skill.name}</span>
        <span className="skillcell__lv mono">
          {level}/{max}
        </span>
      </div>
      <div className="skillcell__tags">
        {skill.free && <span className="tag tag--none">เควส · ไม่กินแต้ม</span>}
        {skill.passive === 'passive' && <span className="tag">Passive</span>}
        {skill.required_job_level !== null && <span className="tag tag--risk">ต้อง Job Lv {skill.required_job_level}</span>}
      </div>
      {/* The reason a skill cannot be taken is on the card, not in a tooltip:
          "why is this greyed out" is the question the whole grid exists to
          answer. */}
      {locked && (
        <p className="skillcell__need">
          ต้องมี {blocking.map((b) => `${b.name} Lv ${b.level}`).join(' + ')} ก่อน
        </p>
      )}
      <div className="skillcell__row">
        <button type="button" onClick={onLower} disabled={level === 0} aria-label={`ลด ${skill.name}`}>
          −
        </button>
        <button type="button" onClick={onRaise} disabled={level >= max} aria-label={`เพิ่ม ${skill.name}`}>
          +
        </button>
      </div>
    </div>
  );
}

export default function SkillPlanner() {
  const router = useRouter();
  const params = useSearchParams();

  const classSlug = CLASS_SLUGS.includes(params.get('class') ?? '') ? (params.get('class') as string) : 'knight';
  const [build, setBuild] = useState<Build>(() => decodeBuild(classSlug, params.get('build') ?? ''));
  const [copied, setCopied] = useState(false);

  const stages = useMemo(() => lineFor(classSlug), [classSlug]);
  const spend = useMemo(() => spendByStage(classSlug, build), [classSlug, build]);

  // The URL is the save format, so it follows every edit. replace, not push:
  // forty clicks planning a build must not become forty presses of Back.
  useEffect(() => {
    const next = new URLSearchParams();
    next.set('class', classSlug);
    const encoded = encodeBuild(build);
    if (encoded) next.set('build', encoded);
    router.replace(`/tools/skill-planner?${next.toString()}`, { scroll: false });
  }, [classSlug, build, router]);

  const changeClass = useCallback((slug: string) => {
    // Skills carry over only where the new line has them -- switching Knight
    // to Crusader keeps the Swordsman half, which is what a player comparing
    // the two branches wants.
    setBuild((current) => decodeBuild(slug, encodeBuild(current)));
    router.replace(`/tools/skill-planner?class=${slug}`, { scroll: false });
  }, [router]);

  const totalSpent = spend.reduce((n, s) => n + s.spent, 0);
  const anyOver = spend.some((s) => s.over);

  return (
    <>
      <div className="planbar">
        <label>
          อาชีพ{' '}
          <select value={classSlug} onChange={(e) => changeClass(e.target.value)}>
            {CLASS_SLUGS.map((slug) => {
              const stage = lineFor(slug).at(-1);
              return (
                <option key={slug} value={slug}>
                  {stage?.name ?? slug}
                </option>
              );
            })}
          </select>
        </label>
        <span className="planbar__total mono">ใช้ไปทั้งหมด {totalSpent} แต้ม</span>
        <button type="button" className="btn" onClick={() => setBuild({})} disabled={totalSpent === 0}>
          ล้างทั้งหมด
        </button>
        <button
          type="button"
          className="btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              // Clipboard permission can be refused; the URL bar already holds
              // the build, so there is nothing to recover from.
              setCopied(false);
            }
          }}
        >
          {copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์บิลด์'}
        </button>
      </div>

      {anyOver && (
        <p className="planwarn">
          ใส่แต้มเกินที่อาชีพนั้นมี — เว็บนี้ไม่ล็อกให้ เพราะเพดานแต้มมาจากข้อมูลของ prontera.info
          (10 / 49 / 59 = 1 แต้มต่อ job level) ยังไม่ได้ยืนยันจากในเกมเอง ถือเป็นคำเตือนไว้ก่อน
        </p>
      )}

      {stages.map((stage) => {
        const stageSpend = spend.find((s) => s.stage.slug === stage.slug)!;
        const slots = new Map(stage.skills.filter((s) => s.tree_slot !== null).map((s) => [s.tree_slot as number, s]));
        const maxSlot = Math.max(...slots.keys());
        const cells = Array.from({ length: Math.ceil((maxSlot + 1) / COLUMNS) * COLUMNS }, (_, i) => slots.get(i) ?? null);

        return (
          <section key={stage.slug} className="planstage">
            <header className="planstage__head">
              <h2 className="section-title">
                {stage.name} <span className="tag">{TIER_LABELS[stage.tier ?? ''] ?? stage.tier}</span>
              </h2>
              <span className={`planstage__pts mono${stageSpend.over ? ' planstage__pts--over' : ''}`}>
                {stageSpend.spent} / {stageSpend.budget} แต้ม
              </span>
            </header>
            <div className="skillgrid">
              {cells.map((skill, i) =>
                skill === null ? (
                  <div key={`empty-${i}`} className="skillcell skillcell--empty" aria-hidden="true" />
                ) : (
                  <SkillCell
                    key={skill.slug}
                    skill={skill}
                    level={build[skill.slug] ?? 0}
                    blocking={blockedBy(classSlug, build, skill.slug)}
                    onRaise={() => setBuild((b) => raise(classSlug, b, skill.slug))}
                    onLower={() => setBuild((b) => lower(classSlug, b, skill.slug))}
                  />
                ),
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

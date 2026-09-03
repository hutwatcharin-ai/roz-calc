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

// tree_slot is a position in the in-game skill window, and the first version
// of this page rendered that grid literally -- seven columns with the gaps
// left empty. On Novice that meant three cards in twenty-one cells, and the
// dashed holes were the first thing a player asked about. The slot now decides
// order only: cards flow, so a stage is as tall as it has skills.

const TIER_LABELS: Record<string, string> = {
  base: 'อาชีพเริ่มต้น',
  first_class: 'อาชีพ 1',
  second_job: 'อาชีพ 2',
};

function SkillCell({
  skill,
  icon,
  level,
  blocking,
  onRaise,
  onLower,
}: {
  skill: PlannerSkill;
  icon: string | null;
  level: number;
  blocking: { slug: string; name: string; level: number }[];
  onRaise: () => void;
  onLower: () => void;
}) {
  const max = skill.max_level ?? 1;
  const locked = blocking.length > 0 && level === 0;
  // Everything that is not the name, the level and the two buttons lives in
  // the tooltip: the grid is 7 cells wide, and a card that spells out its
  // prerequisites inline made each stage a screenful on its own.
  const title = [
    skill.name,
    skill.free ? 'สกิลเควส — ไม่กินแต้ม' : null,
    skill.required_job_level !== null ? `ต้อง Job Lv ${skill.required_job_level}` : null,
    locked ? `ต้องมี ${blocking.map((b) => `${b.name} Lv ${b.level}`).join(' + ')} ก่อน` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className={`skillcell${level > 0 ? ' skillcell--taken' : ''}${locked ? ' skillcell--locked' : ''}`}
      title={title}
    >
      <div className="skillcell__head">
        {icon ? (
          <img className="skillcell__icon" src={icon} alt="" width={24} height={24} loading="lazy" decoding="async" />
        ) : (
          <span className="skillcell__icon skillcell__icon--none" aria-hidden="true" />
        )}
        <span className="skillcell__name">{skill.name}</span>
      </div>
      {/* A bar rather than only a number: at a glance a stage shows which
          skills are maxed, which are started, and which are untouched. */}
      <div className="skillcell__bar" aria-hidden="true">
        <span style={{ width: `${(level / max) * 100}%` }} />
      </div>
      <div className="skillcell__row">
        <button type="button" onClick={onLower} disabled={level === 0} aria-label={`ลด ${skill.name}`}>
          −
        </button>
        <span className="skillcell__lv mono">
          {level}<span className="skillcell__max">/{max}</span>
        </span>
        <button type="button" onClick={onRaise} disabled={level >= max} aria-label={`เพิ่ม ${skill.name}`}>
          +
        </button>
      </div>
      {/* Only the blocking reason survives on the card itself: it is the
          question the grid exists to answer, and it disappears once met. */}
      {locked && <p className="skillcell__need">ต้องมี {blocking.map((b) => b.name).join(' + ')}</p>}
    </div>
  );
}

export default function SkillPlanner({ icons }: { icons: Record<string, string> }) {
  const router = useRouter();
  const params = useSearchParams();

  // State, not a value read back out of the URL each render: the effect below
  // writes the URL, and reading the class from the URL meant a class switch
  // was immediately overwritten by the effect still holding the old one --
  // the dropdown moved and the page did not.
  const initialClass = CLASS_SLUGS.includes(params.get('class') ?? '') ? (params.get('class') as string) : 'knight';
  const [classSlug, setClassSlug] = useState(initialClass);
  const [build, setBuild] = useState<Build>(() => decodeBuild(initialClass, params.get('build') ?? ''));
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
    // the two branches wants. The URL follows from the effect above, so it is
    // not written here as well.
    setBuild((current) => decodeBuild(slug, encodeBuild(current)));
    setClassSlug(slug);
  }, []);

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
          ใส่แต้มเกินที่อาชีพนั้นมี — เตือนไว้เฉย ๆ ไม่ได้ล็อก
        </p>
      )}

      {stages.map((stage) => {
        const stageSpend = spend.find((s) => s.stage.slug === stage.slug)!;
        const skills = [...stage.skills].sort((a, b) => (a.tree_slot ?? 0) - (b.tree_slot ?? 0));

        return (
          <section key={stage.slug} className="planstage">
            <header className="planstage__head">
              <h2 className="section-title">
                {stage.name} <span className="tag">{TIER_LABELS[stage.tier ?? ''] ?? stage.tier}</span>
              </h2>
              <span className={`planstage__pts mono${stageSpend.over ? ' planstage__pts--over' : ''}`}>
                {stageSpend.spent} / {stageSpend.budget} แต้ม
              </span>
              <div className="planstage__bar" aria-hidden="true">
                <span
                  className={stageSpend.over ? 'planstage__bar--over' : undefined}
                  style={{ width: `${Math.min(100, (stageSpend.spent / stageSpend.budget) * 100)}%` }}
                />
              </div>
            </header>
            <div className="skillgrid">
              {skills.map((skill) => (
                <SkillCell
                  key={skill.slug}
                  skill={skill}
                  icon={icons[skill.slug] ?? null}
                  level={build[skill.slug] ?? 0}
                  blocking={blockedBy(classSlug, build, skill.slug)}
                  onRaise={() => setBuild((b) => raise(classSlug, b, skill.slug))}
                  onLower={() => setBuild((b) => lower(classSlug, b, skill.slug))}
                />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}

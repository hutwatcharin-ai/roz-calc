// The rules behind the skill planner, with no React in them so they can be
// tested directly.
//
// Data: lib/data/skill-tree.json, pulled from prontera.info's own planner
// pages (docs/prontera-export/fetch-skill-tree.mjs). It carries, per class
// stage: the point budget, and per skill the max level, its prerequisites
// (skill + level), whether it is a free quest skill, and its slot in the
// in-game skill window.
//
// Two rules are enforced hard, because the data behind them is exact:
//   - a skill cannot go above its max level
//   - a skill cannot be raised while a prerequisite sits below the level it
//     demands (raising pulls its prerequisites up instead)
//
// The point budget is NOT enforced. It is reported: spent, budget, and an
// over-budget flag. The budgets (10 / 49 / 59) come straight from the source,
// and they match "one point per job level" against caps of 11 / 50 / 60 -- but
// a build saved on that same site spends 60 in a 59-point stage, so the site
// does not treat it as a wall either. Blocking on a number we have not seen
// the game itself enforce would make the tool quietly wrong; a warning cannot.

import tree from './data/skill-tree.json';

export interface PlannerPrereq {
  slug: string | null;
  level: number | null;
}

export interface PlannerSkill {
  slug: string;
  name: string;
  max_level: number | null;
  free: boolean;
  is_default: boolean;
  required_job_level: number | null;
  tree_slot: number | null;
  passive: string | null;
  prerequisites: PlannerPrereq[];
}

export interface PlannerStage {
  slug: string;
  name: string;
  tier: string | null;
  skill_points: number;
  skills: PlannerSkill[];
}

const TREE = tree as { lines: Record<string, string[]>; stages: PlannerStage[] };
const STAGE_BY_SLUG = new Map(TREE.stages.map((s) => [s.slug, s]));

/** Class slugs a player can plan, in the order the planner lists them. */
export const CLASS_SLUGS = Object.keys(TREE.lines);

/** Every stage of a class line, base class first. Empty for an unknown slug. */
export function lineFor(classSlug: string): PlannerStage[] {
  return (TREE.lines[classSlug] ?? []).map((s) => STAGE_BY_SLUG.get(s)).filter((s): s is PlannerStage => Boolean(s));
}

export type Build = Record<string, number>;

function skillsOf(classSlug: string): Map<string, PlannerSkill> {
  const map = new Map<string, PlannerSkill>();
  for (const stage of lineFor(classSlug)) {
    for (const skill of stage.skills) map.set(skill.slug, skill);
  }
  return map;
}

/**
 * Raises one skill by one level, pulling every prerequisite up to the level it
 * demands first. Returns the new build, or the same object when the raise is
 * impossible (unknown skill, already at max, or a prerequisite that cannot
 * itself be raised).
 */
export function raise(classSlug: string, build: Build, slug: string): Build {
  const skills = skillsOf(classSlug);
  const next: Build = { ...build };

  function raiseTo(target: string, wanted: number, seen: Set<string>): boolean {
    // A cycle in the prerequisite data would otherwise recurse forever. The
    // 417 edges have none today; this is not a claim that they never will.
    if (seen.has(target)) return false;
    seen.add(target);

    const skill = skills.get(target);
    if (!skill) return false;
    const max = skill.max_level ?? 1;
    if (wanted > max) return false;
    if ((next[target] ?? 0) >= wanted) return true;

    for (const prereq of skill.prerequisites) {
      if (!prereq.slug) continue;
      if (!raiseTo(prereq.slug, prereq.level ?? 1, new Set(seen))) return false;
    }
    next[target] = wanted;
    return true;
  }

  const current = build[slug] ?? 0;
  return raiseTo(slug, current + 1, new Set()) ? next : build;
}

/**
 * Lowers one skill by one level. Refused while another skill in the build
 * still depends on the level being removed -- the alternative, silently
 * dropping the dependents, loses work the player did on purpose.
 */
export function lower(classSlug: string, build: Build, slug: string): Build {
  const current = build[slug] ?? 0;
  if (current <= 0) return build;

  const after = current - 1;
  const skills = skillsOf(classSlug);
  for (const [otherSlug, level] of Object.entries(build)) {
    if (level <= 0 || otherSlug === slug) continue;
    const other = skills.get(otherSlug);
    if (!other) continue;
    for (const prereq of other.prerequisites) {
      if (prereq.slug === slug && (prereq.level ?? 1) > after) return build;
    }
  }

  const next = { ...build };
  if (after === 0) delete next[slug];
  else next[slug] = after;
  return next;
}

export interface Blocker {
  slug: string;
  /** Display name, because "ต้องมี bash Lv 5" names a slug, not a skill. */
  name: string;
  level: number;
}

/** Which skills block this one right now, and at what level. Empty when free to raise. */
export function blockedBy(classSlug: string, build: Build, slug: string): Blocker[] {
  const skills = skillsOf(classSlug);
  const skill = skills.get(slug);
  if (!skill) return [];
  return skill.prerequisites
    .filter((p) => p.slug !== null && (build[p.slug] ?? 0) < (p.level ?? 1))
    .map((p) => ({
      slug: p.slug as string,
      name: skills.get(p.slug as string)?.name ?? (p.slug as string),
      level: p.level ?? 1,
    }));
}

export interface StageSpend {
  stage: PlannerStage;
  spent: number;
  budget: number;
  over: boolean;
}

/**
 * Points spent per stage. Free (quest) skills are excluded: the source flags
 * 16 of the 375 skills that way, and the site's own planner labels them
 * "learn as quest skill -- no skill points".
 */
export function spendByStage(classSlug: string, build: Build): StageSpend[] {
  return lineFor(classSlug).map((stage) => {
    const spent = stage.skills.reduce((sum, skill) => (skill.free ? sum : sum + (build[skill.slug] ?? 0)), 0);
    return { stage, spent, budget: stage.skill_points, over: spent > stage.skill_points };
  });
}

/**
 * The build as a string, in the same `slug:level~slug:level` shape
 * prontera.info's planner puts in its own URL -- a link pasted from there
 * opens here, and vice versa. Ordered by slug so the same build always
 * encodes to the same string.
 */
export function encodeBuild(build: Build): string {
  return Object.entries(build)
    .filter(([, level]) => level > 0)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([slug, level]) => `${slug}:${level}`)
    .join('~');
}

/**
 * Reads that string back. A pair naming a skill this class line does not have,
 * or carrying a level above its max, is dropped rather than kept: a build has
 * to be one this planner could have produced, or every rule below it is a lie.
 */
export function decodeBuild(classSlug: string, encoded: string): Build {
  const skills = skillsOf(classSlug);
  const build: Build = {};
  for (const pair of encoded.split('~')) {
    if (!pair) continue;
    const [slug, rawLevel] = pair.split(':');
    const skill = skills.get(slug);
    if (!skill) continue;
    const level = Number(rawLevel);
    if (!Number.isInteger(level) || level <= 0) continue;
    build[slug] = Math.min(level, skill.max_level ?? 1);
  }
  return build;
}

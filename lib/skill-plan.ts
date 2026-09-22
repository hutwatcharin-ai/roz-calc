// Turns "the skills a build wants" into a full point plan per job: every
// prerequisite added at the level it needs, placed in the job whose tree holds
// it, and the points counted against that job's budget.
//
// The trees come from data/skill-trees.json (roz.prontera.info). Its
// prerequisite lists merge several jobs' versions of a skill -- Heal lists the
// Crusader's Faith 10, Safety Wall lists the Mage's Soul Strike -- and repeat a
// skill at two levels. So a prerequisite counts only when its skill is in one
// of the trees on this job path, and a repeated one takes its highest level.
// Both rules reproduce the classic trees on every Acolyte and Priest skill
// checked by hand on 22 Sep 2026.
import trees from '@/data/skill-trees.json';

export interface TreeSkill {
  slug: string;
  name: string;
  max: number;
  passive: boolean;
  free: boolean;
  prereqs: { slug: string; name: string; level: number }[];
  levels: string[];
}

export interface SkillTrees {
  jobs: Record<string, { name: string; from: string[]; skills: TreeSkill[] }>;
}

const FIRST_JOBS = new Set(['swordsman', 'mage', 'archer', 'acolyte', 'thief', 'merchant']);

/** 1st jobs cap at Job 50 (49 points), 2nd jobs at Job 70 (69 points). */
export function pointBudget(job: string): number {
  return FIRST_JOBS.has(job) ? 49 : 69;
}

export interface PlanRow {
  name: string;
  level: number;
  max: number;
  /** 'pick' came from the build; 'prereq' was added so a pick can be learned. */
  reason: 'pick' | 'prereq';
  /** For a prerequisite, the picks that need it. */
  neededBy: string[];
  free: boolean;
}

export interface JobPlan {
  job: string;
  budget: number;
  used: number;
  rows: PlanRow[];
}

export interface PlanProblem {
  kind: 'unknown-skill' | 'over-max' | 'over-budget';
  message: string;
}

export function buildPlan(
  path: string[],
  picks: Record<string, Record<string, number>>,
  tree: SkillTrees = trees as SkillTrees,
): { jobs: JobPlan[]; problems: PlanProblem[] } {
  const problems: PlanProblem[] = [];
  // Which job on the path owns each skill name; the earliest one wins, the
  // way the game lets a 2nd job use points already spent as a 1st job.
  const owner = new Map<string, { job: string; skill: TreeSkill }>();
  for (const job of path) {
    for (const skill of tree.jobs[job]?.skills ?? []) {
      if (!owner.has(skill.name)) owner.set(skill.name, { job, skill });
    }
  }

  const levels = new Map<string, number>();
  const reason = new Map<string, 'pick' | 'prereq'>();
  const neededBy = new Map<string, Set<string>>();

  function need(name: string, level: number, by: string | null) {
    const hit = owner.get(name);
    if (!hit) {
      problems.push({ kind: 'unknown-skill', message: `${name} is not in the ${path.join(' / ')} trees` });
      return;
    }
    if (level > hit.skill.max) {
      problems.push({ kind: 'over-max', message: `${name} Lv ${level} is above its max ${hit.skill.max}` });
      level = hit.skill.max;
    }
    if (by === null) reason.set(name, 'pick');
    else {
      if (!reason.has(name)) reason.set(name, 'prereq');
      if (!neededBy.has(name)) neededBy.set(name, new Set());
      neededBy.get(name)!.add(by);
    }
    if ((levels.get(name) ?? 0) >= level) return;
    levels.set(name, level);
    const required = new Map<string, number>();
    for (const pre of hit.skill.prereqs) {
      if (!owner.has(pre.name)) continue;
      required.set(pre.name, Math.max(required.get(pre.name) ?? 0, pre.level));
    }
    for (const [pre, lv] of required) need(pre, lv, name);
  }

  for (const job of path) {
    for (const [name, level] of Object.entries(picks[job] ?? {})) need(name, level, null);
  }

  const jobs: JobPlan[] = path.map((job) => {
    const rows: PlanRow[] = [];
    // Tree order, so the plan reads like the in-game skill window.
    for (const skill of tree.jobs[job]?.skills ?? []) {
      const level = levels.get(skill.name);
      if (!level || owner.get(skill.name)?.job !== job) continue;
      rows.push({
        name: skill.name,
        level,
        max: skill.max,
        reason: reason.get(skill.name) ?? 'pick',
        neededBy: [...(neededBy.get(skill.name) ?? [])],
        free: skill.free,
      });
    }
    const used = rows.reduce((sum, row) => sum + (row.free ? 0 : row.level), 0);
    const budget = pointBudget(job);
    if (used > budget) problems.push({ kind: 'over-budget', message: `${job} uses ${used} of ${budget} points` });
    return { job, budget, used, rows };
  });

  return { jobs, problems };
}

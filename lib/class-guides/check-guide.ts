// Checks shared by the guide tests. The guides are typed by hand from video
// transcripts; these catch what a typo would break silently on the page: a
// citation to a source that does not exist, a skill name the tree does not
// know, a plan over its point budget.
import { expect } from 'vitest';
import { buildPlan } from '../skill-plan';
import trees from '@/data/skill-trees.json';
import type { ClassGuide } from './types';

const TREES = trees as { jobs: Record<string, { skills: { name: string }[] }> };

export function checkGuide(guide: ClassGuide) {
  const lines = [
    ...guide.facts, ...guide.strengths, ...guide.weaknesses, ...(guide.routeNotes ?? []),
    ...(guide.route ?? []), ...(guide.gearByLevel ?? []),
    ...guide.builds.flatMap((b) => [
      b.idea, ...(b.stats ?? []), ...(b.statNotes ?? []), ...(b.skills ?? []), ...(b.skillNotes ?? []),
      ...(b.gear ?? []), ...(b.play ?? []), ...(b.maps ?? []), ...(b.cautions ?? []),
      ...(b.plan ? [b.plan.basis, ...(b.plan.leftover ? [b.plan.leftover] : [])] : []),
    ]),
  ];
  const cites = lines.flatMap((line) => line.cites);

  expect(cites.map(([key]) => key).filter((key) => !guide.sources[key]), 'cites a source key that is not in sources').toEqual([]);
  expect(cites.map(([, at]) => at).filter((at) => at !== undefined && !/^\d{2}:\d{2}$/.test(at)), 'timestamps must be mm:ss').toEqual([]);
  expect(lines.filter((line) => line.cites.length === 0).map((line) => ('text' in line ? line.text : '')), 'every line needs a source').toEqual([]);

  for (const job of guide.path) expect(TREES.jobs[job], `unknown job slug ${job}`).toBeTruthy();
  const known = new Set(guide.path.flatMap((job) => TREES.jobs[job]?.skills.map((s) => s.name) ?? []));
  const unknown = guide.builds.flatMap((b) => (b.skills ?? []).map((s) => s.skill)).filter((name) => !known.has(name));
  expect(unknown, 'skill steps not in the job path trees').toEqual([]);

  for (const build of guide.builds) {
    if (!build.plan) continue;
    expect(buildPlan(guide.path, build.plan.picks).problems, `plan ${build.id}`).toEqual([]);
  }
  expect(new Set(guide.builds.map((b) => b.id)).size, 'build ids must be unique').toBe(guide.builds.length);
}

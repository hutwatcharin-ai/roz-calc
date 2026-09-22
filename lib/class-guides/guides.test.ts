import { describe, expect, it } from 'vitest';
import { CLASS_GUIDES } from './index';
import { buildPlan } from '../skill-plan';
import trees from '@/data/skill-trees.json';

// The guides are typed by hand from video transcripts. These checks catch what
// a typo would break silently on the page: a citation to a source that does
// not exist, a skill name the tree does not know, a plan over its budget.
describe.each(CLASS_GUIDES.map((g) => [g.slug, g] as const))('%s guide', (_, guide) => {
  const allCites = [
    ...guide.facts, ...guide.strengths, ...guide.weaknesses, ...(guide.routeNotes ?? []),
    ...(guide.route ?? []), ...(guide.gearByLevel ?? []),
    ...guide.builds.flatMap((b) => [
      b.idea, ...(b.stats ?? []), ...(b.statNotes ?? []), ...(b.skills ?? []), ...(b.skillNotes ?? []),
      ...(b.gear ?? []), ...(b.play ?? []), ...(b.maps ?? []), ...(b.cautions ?? []),
      ...(b.plan ? [b.plan.basis, ...(b.plan.leftover ? [b.plan.leftover] : [])] : []),
    ]),
  ].flatMap((line) => line.cites);

  it('cites only sources it lists', () => {
    const missing = allCites.map(([key]) => key).filter((key) => !guide.sources[key]);
    expect(missing).toEqual([]);
  });

  it('uses mm:ss timestamps', () => {
    const bad = allCites.map(([, at]) => at).filter((at) => at !== undefined && !/^\d{2}:\d{2}$/.test(at));
    expect(bad).toEqual([]);
  });

  it('walks a job path the skill trees know', () => {
    for (const job of guide.path) expect((trees as any).jobs[job]).toBeTruthy();
  });

  it.each(guide.builds.filter((b) => b.plan).map((b) => [b.id, b] as const))('plan %s fits its budget', (_, build) => {
    const { problems } = buildPlan(guide.path, build.plan!.picks);
    expect(problems).toEqual([]);
  });

  it('names skill steps that exist on its path', () => {
    const known = new Set(guide.path.flatMap((job) => (trees as any).jobs[job].skills.map((s: { name: string }) => s.name)));
    const unknown = guide.builds.flatMap((b) => (b.skills ?? []).map((s) => s.skill)).filter((name) => !known.has(name));
    expect(unknown).toEqual([]);
  });
});

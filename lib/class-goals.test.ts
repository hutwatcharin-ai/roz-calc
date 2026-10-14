import { describe, expect, it } from 'vitest';
import { classGoals } from './class-goals';
import { CLASS_GUIDES } from './class-guides';
import type { ClassBuild, ClassGuide } from './class-guides/types';

const build = (id: string, name: string, pickIf: string, extra: Partial<ClassBuild> = {}): ClassBuild => ({
  id, name, pickIf, idea: { text: '', cites: [] }, ...extra,
});
const guide = (slug: string, path: string[], builds: ClassBuild[]): ClassGuide => ({
  slug, job: slug, jobTh: slug, from: path[0], gathered: '', summary: '', facts: [], path, equipJob: slug,
  strengths: [], weaknesses: [], builds, gaps: [], sources: {},
});

describe('classGoals', () => {
  it('files a 2nd-job build under every goal its own words name, main build first', () => {
    const goals = classGoals([
      guide('first', ['first'], [build('a', 'สายบอท', 'อยากเปิดบอท')]),
      guide('knight', ['first', 'knight'], [
        build('pt', 'สาย Bowling Bash', 'เล่นกับปาร์ตี้'),
        build('main', 'สายหลัก', 'อยากเปิดบอทคนเดียว ลงดันได้', { tag: 'สายหลัก' }),
      ]),
    ]);
    const bot = goals.find((g) => g.id === 'bot')!;
    expect(bot.builds.map((b) => b.buildId)).toEqual(['main']);
    expect(goals.find((g) => g.id === 'dungeon')!.builds.map((b) => b.buildId)).toEqual(['main']);
    expect(goals.find((g) => g.id === 'party')!.builds.map((b) => b.buildId)).toEqual(['pt']);
  });

  it('leaves out builds the guide marks as missing, and goals nobody fits', () => {
    const goals = classGoals([
      guide('rogue', ['thief', 'rogue'], [build('pk', 'สาย Divest / PK', 'อยากกวน', { missing: 'ยังไม่มี' }), build('main', 'สายบอท', 'เปิดบอท')]),
    ]);
    expect(goals.map((g) => g.id)).toEqual(['bot']);
  });

  it('gives every real goal at least one build and every 2nd job a place', () => {
    const goals = classGoals(CLASS_GUIDES);
    expect(goals.length).toBeGreaterThanOrEqual(5);
    const jobs = new Set(goals.flatMap((g) => g.builds.map((b) => b.slug)));
    const seconds = CLASS_GUIDES.filter((g) => g.path.length > 1).map((g) => g.slug);
    expect(seconds.filter((s) => !jobs.has(s))).toEqual([]);
  });
});

import { describe, expect, it } from 'vitest';
import { buildPlan } from './skill-plan';

const PATH = ['acolyte', 'priest'];

describe('buildPlan', () => {
  it('adds the Acolyte prerequisites a Priest skill needs, in the Acolyte tree', () => {
    const { jobs, problems } = buildPlan(PATH, { priest: { 'Duple Light': 10 } });
    expect(problems).toEqual([]);
    const [acolyte, priest] = jobs;
    expect(priest.rows.find((r) => r.name === 'Aspersio')).toMatchObject({ level: 1, reason: 'prereq', neededBy: ['Duple Light'] });
    expect(priest.rows.find((r) => r.name === 'Impositio Manus')).toMatchObject({ level: 3, reason: 'prereq' });
    expect(acolyte.rows.find((r) => r.name === 'Aqua Benedicta')).toMatchObject({ level: 1, reason: 'prereq' });
    expect(priest.used).toBe(10 + 1 + 3);
  });

  it('ignores prerequisites from jobs off the path (Heal lists the Crusader Faith)', () => {
    const { jobs, problems } = buildPlan(PATH, { acolyte: { Heal: 10 } });
    expect(problems).toEqual([]);
    expect(jobs[0].rows.map((r) => r.name)).toEqual(['Heal']);
  });

  it('takes the highest level when a prerequisite repeats (Blessing needs Divine Protection 5)', () => {
    const { jobs } = buildPlan(PATH, { acolyte: { Blessing: 10 } });
    expect(jobs[0].rows.find((r) => r.name === 'Divine Protection')?.level).toBe(5);
  });

  it('never lowers a level a pick already set', () => {
    const { jobs } = buildPlan(PATH, { acolyte: { 'Divine Protection': 10, Blessing: 10 } });
    expect(jobs[0].rows.find((r) => r.name === 'Divine Protection')).toMatchObject({ level: 10, reason: 'pick' });
  });

  it('reports a job going over its budget', () => {
    const { problems } = buildPlan(PATH, { acolyte: { Heal: 10, Blessing: 10, 'Increase Agility': 10, 'Mace Mastery': 10, 'Demon Bane': 10 } });
    expect(problems.some((p) => p.kind === 'over-budget')).toBe(true);
  });

  it('reports a skill that is not on the path', () => {
    const { problems } = buildPlan(PATH, { priest: { 'Bowling Bash': 10 } });
    expect(problems[0].kind).toBe('unknown-skill');
  });
});

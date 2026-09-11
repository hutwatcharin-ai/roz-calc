import { describe, expect, it } from 'vitest';
import { FIRST_JOBS, ZERO_JOBS, jobLine, secondJobsOf } from './zero-jobs';

describe('job lines for the two-row job chips on /database/skills', () => {
  it('lists each first job its second jobs', () => {
    expect(secondJobsOf('Thief')).toEqual(['Assassin', 'Rogue']);
    expect(secondJobsOf('Archer')).toEqual(['Hunter', 'Bard', 'Dancer']);
    expect(secondJobsOf('Novice')).toEqual([]);
  });

  it('covers all 20 jobs exactly once between the two rows', () => {
    const all = [...FIRST_JOBS, ...FIRST_JOBS.flatMap((j) => secondJobsOf(j))];
    expect([...all].sort()).toEqual([...ZERO_JOBS].sort());
  });

  it('finds the head of a line, and nothing for a job the game does not have', () => {
    expect(jobLine('Assassin')).toBe('Thief');
    expect(jobLine('thief')).toBe('Thief');
    expect(jobLine('Ninja')).toBe('');
    expect(jobLine('')).toBe('');
  });
});

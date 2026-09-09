import { describe, it, expect } from 'vitest';
import { CLANS, MARRIAGE_SKILLS, resetCost, FREE_RESET_MAX_LEVEL } from '@/lib/social-bonuses';

describe('CLANS', () => {
  it('has the four starting clans, each with its own stat pair', () => {
    expect(CLANS).toHaveLength(4);
    // Every clan gives the same HP/SP and a different pair of stats: two
    // clans with the same bonus would mean one was transcribed twice.
    const pairs = CLANS.map((clan) => clan.bonus.split(' · ').slice(0, 2).sort().join());
    expect(new Set(pairs).size).toBe(4);
    for (const clan of CLANS) expect(clan.bonus).toContain('Max HP +30 · Max SP +10');
  });
});

describe('resetCost', () => {
  it('is free through level 40 and one Zelstar per level after', () => {
    expect(resetCost(FREE_RESET_MAX_LEVEL)).toBe(0);
    expect(resetCost(41)).toBe(1);
    // The two levels the guide spells out in words rather than in its table.
    expect(resetCost(80)).toBe(40);
    expect(resetCost(99)).toBe(59);
  });

  it('never asks for a negative number of Zelstars', () => {
    expect(resetCost(1)).toBe(0);
  });
});

describe('MARRIAGE_SKILLS', () => {
  it('carries the three skills rAthena also has', () => {
    expect(MARRIAGE_SKILLS.map((skill) => skill.nameEn)).toEqual([
      'I Will Protect You',
      'I Look up to You',
      'I miss You',
    ]);
  });
});

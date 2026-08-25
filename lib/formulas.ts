//
// Approximation of Renewal-era Ragnarok Online stat formulas, written from
// public game knowledge. Ragnarok Zero Global discloses no official numeric
// formulas (see docs/superpowers/specs/2026-08-25-roz-calc-design.md §2) —
// deep research only confirmed the game leans Renewal (not Pre-Renewal) via
// its split Fixed/Variable cast time system. Treat all outputs here as
// estimates; the UI must always show the "ค่าประมาณการ" disclaimer.

export type JobKey = 'swordsman' | 'knight' | 'wizard' | 'archer';

export interface JobProfile {
  label: string;
  hpFactor: number;
}

export const JOB_PROFILES: Record<JobKey, JobProfile> = {
  swordsman: { label: 'Swordsman', hpFactor: 1.0 },
  knight: { label: 'Knight', hpFactor: 1.25 },
  wizard: { label: 'Wizard', hpFactor: 0.65 },
  archer: { label: 'Archer', hpFactor: 0.85 },
};

export function statusAtk(str: number, dex: number, luk: number): number {
  return str + Math.floor(dex / 5) + Math.floor(luk / 3);
}

export function totalAtk(weaponAtk: number, str: number, dex: number, luk: number): number {
  return weaponAtk + statusAtk(str, dex, luk);
}

export function maxHp(baseLevel: number, vit: number, job: JobKey): number {
  const { hpFactor } = JOB_PROFILES[job];
  const baseHp = 35 + baseLevel * 20 * hpFactor;
  return Math.round(baseHp * (1 + vit / 100));
}

export function statusMatk(int_: number, dex: number, luk: number): { min: number; max: number } {
  const min = int_ + Math.floor(int_ / 7) ** 2;
  const max = int_ + Math.floor(int_ / 5) ** 2 + Math.floor(dex / 5) + Math.floor(luk / 3);
  return { min, max };
}

export function aspd(agi: number, dex: number, weaponAtkDelay = 166): number {
  const preAspd = 200 - weaponAtkDelay * (1 - (agi + dex / 3) / 250);
  return Math.round(Math.min(193, preAspd));
}

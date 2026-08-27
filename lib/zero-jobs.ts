// These are the 20 jobs that exist in Ragnarok Zero Global. Ninja and Soul Linker
// appear in the equipment data but are not playable in Zero.
// Source: Ragnarok Zero Global job list.
export const ZERO_JOBS = [
  'Novice', 'Swordsman', 'Mage', 'Archer', 'Thief', 'Acolyte', 'Merchant',
  'Knight', 'Crusader', 'Wizard', 'Sage', 'Hunter', 'Bard', 'Dancer',
  'Assassin', 'Rogue', 'Priest', 'Monk', 'Blacksmith', 'Alchemist',
] as const;

export function isZeroJob(job: string): boolean {
  const normalized = job.trim().toLowerCase();
  return ZERO_JOBS.some((j) => j.toLowerCase() === normalized);
}

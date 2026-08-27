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

// These are job names that appear in this game's item data but are not playable
// in Ragnarok Zero Global. The list is deliberately short and evidence-based,
// holding only values actually observed in equippable_classes, not every job
// in the wider franchise.
export const NON_ZERO_JOBS = ['Ninja', 'Soul Linker'] as const;

export function isKnownNonZeroJob(job: string): boolean {
  const normalized = job.trim().toLowerCase();
  return NON_ZERO_JOBS.some((j) => j.toLowerCase() === normalized);
}

// items.equippable_classes mixes real job names with group values. The commonest
// entries are "All Jobs" (166 items), "All Jobs except Novice" (56), and various job
// names. Some entries are neither recognizable jobs nor group values (e.g. "Thief Classes",
// "Newbie cannot smoke", "Swordman"). These are over-included as matching every job
// rather than hidden, so data issues are visible and checkable.

import { isZeroJob, isKnownNonZeroJob } from './zero-jobs';

export const EQUIPMENT_CATEGORIES = ['Armor', 'Weapon', 'Costume Equipment'] as const;

const ALL_JOBS_PREFIX = 'all jobs';

export function isUnclassifiedClass(entry: string): boolean {
  const normalized = entry.trim().toLowerCase();
  // Unclassified if it's not an "All Jobs" form, not a Zero job, and not a
  // known non-Zero job (e.g. Ninja, Soul Linker).
  if (normalized.startsWith(ALL_JOBS_PREFIX)) return false;
  if (isZeroJob(entry)) return false;
  if (isKnownNonZeroJob(entry)) return false;
  return true;
}

export function canJobEquip(equippableClasses: string[] | null, job: string): boolean {
  if (!equippableClasses || equippableClasses.length === 0) return false;

  const wanted = job.trim().toLowerCase();

  return equippableClasses.some((entry) => {
    const value = entry.trim().toLowerCase();

    // "All Jobs" matches every job.
    if (value === ALL_JOBS_PREFIX) return true;

    // "All Jobs except <job>" matches every job except the named one.
    if (value.startsWith(ALL_JOBS_PREFIX + ' except ')) {
      const excluded = value.slice((ALL_JOBS_PREFIX + ' except ').length).trim();
      return wanted !== excluded;
    }

    // Known non-Zero jobs (Ninja, Soul Linker) match no job in this game.
    if (isKnownNonZeroJob(entry)) return false;

    // Unclassified entries (not a real job, not an "All Jobs" form, not a
    // known non-Zero job) match every job.
    if (isUnclassifiedClass(entry)) return true;

    // Otherwise, match by exact job name.
    return value === wanted;
  });
}

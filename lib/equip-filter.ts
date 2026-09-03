// items.equippable_classes mixes real job names with group values. The commonest
// entries are "All Jobs" (166 items), "All Jobs except Novice" (56), and various job
// names. Some entries are neither recognizable jobs nor group values (e.g. "Thief Classes",
// "Newbie cannot smoke", "Swordman"). These are over-included as matching every job
// rather than hidden, so data issues are visible and checkable.

import { isZeroJob, isKnownNonZeroJob, jobAncestry } from './zero-jobs';

// The category lists moved to lib/item-href.ts on 3 Sep 2026, when gear and
// costumes stopped sharing a route: the same constants now decide which detail
// page a row gets, so they live next to that rule rather than beside the job
// matcher.

const ALL_JOBS_PREFIX = 'all jobs';

export function isUnclassifiedClass(entry: string): boolean {
  const normalized = entry.trim().toLowerCase();
  // Empty or whitespace-only entries are nothing, not unclassified.
  if (normalized.length === 0) return false;
  // Unclassified if it's not an "All Jobs" form, not a Zero job, and not a
  // known non-Zero job (e.g. Ninja, Soul Linker).
  if (normalized.startsWith(ALL_JOBS_PREFIX)) return false;
  if (isZeroJob(entry)) return false;
  if (isKnownNonZeroJob(entry)) return false;
  return true;
}

export function canJobEquip(equippableClasses: string[] | null, job: string): boolean {
  if (!equippableClasses || equippableClasses.length === 0) return false;

  const wantedAncestry = jobAncestry(job);
  const wantedNormalized = job.trim().toLowerCase();

  return equippableClasses.some((entry) => {
    const value = entry.trim().toLowerCase();

    // "All Jobs" matches every job.
    if (value === ALL_JOBS_PREFIX) return true;

    // "All Jobs except <job>" matches every job except the named one and its ancestors.
    if (value.startsWith(ALL_JOBS_PREFIX + ' except ')) {
      const excluded = value.slice((ALL_JOBS_PREFIX + ' except ').length).trim().toLowerCase();
      // Exclude if the job itself or any ancestor matches the excluded job
      return !wantedAncestry.some((j) => j.toLowerCase() === excluded) && wantedNormalized !== excluded;
    }

    // Known non-Zero jobs (Ninja, Soul Linker) match no job in this game.
    if (isKnownNonZeroJob(entry)) return false;

    // Unclassified entries (not a real job, not an "All Jobs" form, not a
    // known non-Zero job) match every job.
    if (isUnclassifiedClass(entry)) return true;

    // Otherwise, match if the entry matches any job in the wanted job's ancestry.
    // This makes class-2 jobs inherit class-1 gear: Knight wears Swordsman items.
    return wantedAncestry.some((j) => j.toLowerCase() === value);
  });
}

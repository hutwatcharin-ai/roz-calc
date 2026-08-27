// items.equippable_classes mixes real job names with group values. The two
// commonest entries in the whole table are "All Jobs" (166 items) and
// "All Jobs except Novice" (56), so a filter that compares against job names
// alone hides the majority of what a player can actually wear.

export const EQUIPMENT_CATEGORIES = ['Armor', 'Weapon', 'Costume Equipment'] as const;

const ALL_JOBS = 'all jobs';
const ALL_JOBS_EXCEPT_NOVICE = 'all jobs except novice';
const NOVICE = 'novice';

export function canJobEquip(equippableClasses: string[] | null, job: string): boolean {
  if (!equippableClasses || equippableClasses.length === 0) return false;

  const wanted = job.trim().toLowerCase();

  return equippableClasses.some((entry) => {
    const value = entry.trim().toLowerCase();
    if (value === ALL_JOBS) return true;
    if (value === ALL_JOBS_EXCEPT_NOVICE) return wanted !== NOVICE;
    return value === wanted;
  });
}

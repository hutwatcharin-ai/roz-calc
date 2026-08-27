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

// Job class evolution (class 1 → class 2). Class-2 jobs inherit gear from their
// class-1 parents: a Knight wears Swordsman gear. Source: docs/skill-tree-research.md
// lines 164-169.
export const JOB_PARENT: Readonly<Record<string, string>> = {
  knight: 'Swordsman',
  crusader: 'Swordsman',
  wizard: 'Mage',
  sage: 'Mage',
  hunter: 'Archer',
  bard: 'Archer',
  dancer: 'Archer',
  assassin: 'Thief',
  rogue: 'Thief',
  priest: 'Acolyte',
  monk: 'Acolyte',
  blacksmith: 'Merchant',
  alchemist: 'Merchant',
};

export function jobAncestry(job: string): string[] {
  const normalized = job.trim().toLowerCase();
  const result: string[] = [];
  let current: string | undefined = normalized;

  while (current !== undefined) {
    // Find the canonical job name (preserving case)
    const canonical = ZERO_JOBS.find((j) => j.toLowerCase() === current);
    if (canonical) {
      result.push(canonical);
    }
    // Move to parent (using normalized current to look up in JOB_PARENT)
    const parentName: string | undefined = JOB_PARENT[current as keyof typeof JOB_PARENT];
    current = parentName ? parentName.toLowerCase() : undefined;
  }

  return result;
}

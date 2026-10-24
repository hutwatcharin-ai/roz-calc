// Sample builds on /tools/build (owner, 24 Oct 2026): 44% of the people who
// landed on the simulator left without doing anything, facing 420 unspent
// points. One tap on a sample opens a finished stat spread to change.
//
// Each sample is a stat row a player gave in a class guide (lib/class-guides),
// not one made up here: the first row with at least three stats given as
// numbers that a character at the level cap can pay for. It opens the way the
// guide's own "open in the simulator" link does, at the lowest level that
// pays for it.

import { CLASS_GUIDES } from '@/lib/class-guides';
import { EMPTY_BUILD, encodeBuild, maxJobLevel, sanitizeBuild } from '@/lib/build-calc';
import { STATS, classStats, rowMinLevel, statFromText } from '@/lib/class-stats';
import { BASE_LEVEL_CAP } from '@/lib/level-cap';

export interface BuildPreset {
  slug: string;
  job: string;
  /** The guide's name for the build, e.g. its short tag. */
  label: string;
  href: string;
}

/** One per class, in this order: a melee, a caster, a ranged, a support, a crit. */
export const PRESET_CLASSES = ['knight', 'wizard', 'hunter', 'priest', 'assassin'];

export function buildPresets(classes: string[] = PRESET_CLASSES): BuildPreset[] {
  const out: BuildPreset[] = [];
  for (const slug of classes) {
    const guide = CLASS_GUIDES.find((g) => g.slug === slug);
    if (!guide || !classStats(slug)) continue;
    pick: for (const b of guide.builds) {
      for (const row of b.stats ?? []) {
        const given = STATS.filter((s) => statFromText(row[s]) !== null && (statFromText(row[s]) ?? 0) > 1).length;
        const need = rowMinLevel(row);
        if (given < 3 || !need || need.level === null || need.level > BASE_LEVEL_CAP) continue;
        const st = Object.fromEntries(STATS.map((s) => [s, Math.max(1, statFromText(row[s]) ?? 1)])) as Record<(typeof STATS)[number], number>;
        const build = sanitizeBuild({ ...EMPTY_BUILD, cls: slug, lv: need.level, job: maxJobLevel(slug), st, g: {}, f: [] });
        if (!build) continue;
        out.push({ slug, job: guide.job, label: (b.tag ?? b.name).replace(/\s*\(.*\)\s*$/, ''), href: `/tools/build?b=${encodeBuild(build)}` });
        break pick;
      }
    }
  }
  return out;
}

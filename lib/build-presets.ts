// Sample builds for the simulator's "load a build" list (owner, 7 Oct 2026):
// every class guide stat row that gives at least two stats as numbers, at
// the lowest level that can pay for them (capped at the level cap). The same
// rule as the "open in the simulator" link on the guides. Server side: the
// guides are large, the list it sends to the page is small.

import { CLASS_GUIDES } from '@/lib/class-guides';
import { STATS, classStats, rowMinLevel, statFromText } from '@/lib/class-stats';
import { BASE_LEVEL_CAP } from '@/lib/level-cap';
import { EMPTY_BUILD, encodeBuild, maxJobLevel, sanitizeBuild } from '@/lib/build-calc';

export interface BuildPreset {
  cls: string;
  label: string;
  /** encodeBuild() of the build */
  b: string;
}

export function buildPresets(): BuildPreset[] {
  const out: BuildPreset[] = [];
  for (const guide of CLASS_GUIDES) {
    if (!classStats(guide.slug)) continue;
    for (const b of guide.builds) {
      for (const row of b.stats ?? []) {
        const need = rowMinLevel(row);
        if (!need) continue;
        const st = Object.fromEntries(STATS.map((s) => [s, Math.max(1, statFromText(row[s]) ?? 1)]));
        const build = sanitizeBuild({ ...EMPTY_BUILD, cls: guide.slug, lv: Math.min(BASE_LEVEL_CAP, need.level ?? BASE_LEVEL_CAP), job: maxJobLevel(guide.slug), st, g: {}, f: [] });
        if (build) out.push({ cls: guide.slug, label: `${guide.job} · ${b.name} · ${row.who}`, b: encodeBuild(build) });
      }
    }
  }
  return out;
}

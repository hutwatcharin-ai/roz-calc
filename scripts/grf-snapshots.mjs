// Where the newest extracted client files are, without naming a date -- the
// Node twin of scripts/grf_snapshots.py (see there for why).
import fs from 'node:fs';

export const WEEKLY = 'D:/Data grf roz/weekly';

/** '<snapshot>/<added|changed>/data' folders, newest snapshot first. */
export function weeklyRoots() {
  if (!fs.existsSync(WEEKLY)) return [];
  const dates = fs
    .readdirSync(WEEKLY)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .sort()
    .reverse();
  return dates.flatMap((d) => ['added', 'changed'].map((p) => `${WEEKLY}/${d}/${p}/data`)).filter((p) => fs.existsSync(p));
}

/** Newest extracted copy of a client file, by its path under data/, or null. */
export function newest(rel) {
  for (const root of weeklyRoots()) {
    const p = `${root}/${rel}`;
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Where the newest extracted client files are, without naming a date -- the
// Node twin of scripts/grf_snapshots.py (see there for why).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const WEEKLY = 'D:/Data grf roz/weekly';
/** The installed game's archive -- what GrfDiffTool itself reads. */
export const CLIENT_GRF = 'D:/RagnarokZero/data.grf';

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

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The current client's copy of a file, by its path under data/. Never null:
 * throws when it cannot be found.
 *
 * newest() alone is not enough. GrfDiffTool deletes the added/ and changed/
 * payload of every snapshot but the newest (GRF_WEEKLY_DIFF_GUIDE.md step
 * 10), so a file the latest patch left alone exists in no weekly folder --
 * navi_map.lub vanished this way after the 9 Nov 2026 run, and the map build
 * silently fell back to the 15 Oct client and closed Clock Tower again.
 * When no snapshot has the file, it is read straight from the installed
 * client's data.grf (tools/grf-extract.mjs) into the OS temp folder.
 */
export function currentClientFile(rel) {
  const snap = newest(rel);
  if (snap) return snap;
  if (!fs.existsSync(CLIENT_GRF)) {
    throw new Error(`${rel}: in no weekly snapshot under ${WEEKLY}, and no client archive at ${CLIENT_GRF}`);
  }
  const out = path.join(os.tmpdir(), 'roz-client-files');
  const tool = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools', 'grf-extract.mjs');
  fs.rmSync(path.join(out, 'files'), { recursive: true, force: true });
  execFileSync(process.execPath, [tool, CLIENT_GRF, out, '--match', `^data/${escapeRegex(rel)}$`], { stdio: ['ignore', 'ignore', 'inherit'] });
  const p = path.join(out, 'files', 'data', ...rel.split('/'));
  if (!fs.existsSync(p)) throw new Error(`${rel}: in no weekly snapshot, and not found in ${CLIENT_GRF}`);
  console.log(`${rel}: no weekly snapshot has it, read from ${CLIENT_GRF}`);
  return p;
}

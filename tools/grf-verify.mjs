// Compares a tools/grf-extract.mjs run against the 22 Sep 2026 extraction's
// manifest, by SHA-256 of each decoded file the two share.
//   node tools/grf-verify.mjs <outDir> [oldManifest]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const [dir, oldPath = 'D:/Data grf roz/data_grf_extracted/manifest.jsonl'] = process.argv.slice(2);
const key = (n) => n.split('\\').join('/').toLowerCase();
const old = new Map();
for (const l of readFileSync(oldPath, 'utf8').split('\n')) {
  if (!l) continue;
  const o = JSON.parse(l);
  old.set(key(o.name), o);
}
const tally = {};
let n = 0;
for (const l of readFileSync(join(dir, 'index.jsonl'), 'utf8').split('\n')) {
  if (!l) continue;
  const o = JSON.parse(l);
  if (!o.sha256 && !o.error) continue;
  n++;
  const a = old.get(key(o.name));
  const state = !a ? 'new' : o.error ? 'error' : a.sha256 === o.sha256 ? 'match' : a.compressed === o.compressed ? 'MISMATCH-same-size' : 'changed';
  const k = `${state} flag${o.flags}`;
  tally[k] = (tally[k] ?? 0) + 1;
  if ((state === 'error' || state.startsWith('MISMATCH')) && (tally[k] ?? 0) <= 3) console.log(state, o.flags, o.compressed, o.name, o.error ?? '');
}
console.log('checked', n, tally);

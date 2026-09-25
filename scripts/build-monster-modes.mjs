// Monster behaviour flags that our monsters table has no column for, read
// off the same rozerodb export the table was imported from
// (data/raw/monsters.json, ragnarokZero.specialStatus).
//
// The export carries six labels. Two already have columns (Aggressive ->
// is_aggressive, Loots items -> loots_items, MVP -> is_mvp). Two more are
// worth showing and are kept here: "mini" (mini-boss) and the ABSENCE of
// "Can move" (a rooted monster: Mandragora, Hydra, Flora, Megalith,
// Parasite...). "Physically attackable" is absent on only three rows
// (Antonio, Empelium, Gld Treasure) and is not shown.
//
// 58 of 524 rows carry no specialStatus at all (Poring, the eggs and plants,
// every "Mj"/"Mq"/"Ztw" event copy, Whisper...). For those nothing is known,
// and the file says so with known:false instead of defaulting every flag to
// "no" -- the import had been doing exactly that for is_aggressive, which
// made Whisper read as "does not attack first".
//
// Run:  node scripts/build-monster-modes.mjs

import fs from 'node:fs';
import path from 'node:path';

const SRC = path.join(process.cwd(), 'data', 'raw', 'monsters.json');
const DEST = path.join(process.cwd(), 'data', 'monster-modes.json');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
const rows = raw.monsters ?? raw.rows ?? raw;

const modes = {};
let known = 0;
let rooted = 0;
let mini = 0;
const unknownIds = [];
for (const row of rows) {
  const labels = new Set((row.ragnarokZero?.specialStatus ?? []).map((s) => s?.raw).filter(Boolean));
  if (labels.size === 0) {
    modes[row.id] = { known: false };
    unknownIds.push(row.id);
    continue;
  }
  const entry = { known: true, canMove: labels.has('Can move'), mini: labels.has('mini') };
  modes[row.id] = entry;
  known += 1;
  if (!entry.canMove) rooted += 1;
  if (entry.mini) mini += 1;
}

const out = {
  _meta: {
    what: 'Behaviour flags per monster id from the rozerodb export: canMove (false = rooted in place), mini (mini-boss). known:false = the export carries no specialStatus for that row at all, so nothing can be said either way.',
    source: 'data/raw/monsters.json (ragnarokZero.specialStatus)',
    regenerate: 'node scripts/build-monster-modes.mjs',
    built: new Date().toISOString().slice(0, 10),
    rows: rows.length,
    known,
    rooted,
    mini,
    unknownIds,
  },
  modes,
};

fs.writeFileSync(DEST, JSON.stringify(out, null, 2) + '\n', 'utf-8');
console.log(`Wrote ${DEST}: ${rows.length} rows, ${known} with flags, ${rooted} rooted, ${mini} mini-boss, ${unknownIds.length} unknown.`);

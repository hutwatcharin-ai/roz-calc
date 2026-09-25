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
// The four flags rozerodb lacks (assist / castSensor / detector / plant),
// from scripts/build-rathena-modes.py. Merged here so the page reads one file.
const RATHENA = path.join(process.cwd(), 'data', 'raw', 'rathena-modes.json');
const DEST = path.join(process.cwd(), 'data', 'monster-modes.json');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf-8'));
const rows = raw.monsters ?? raw.rows ?? raw;
const rathena = JSON.parse(fs.readFileSync(RATHENA, 'utf-8'));

const modes = {};
let known = 0;
let rooted = 0;
let mini = 0;
const unknownIds = [];
for (const row of rows) {
  const labels = new Set((row.ragnarokZero?.specialStatus ?? []).map((s) => s?.raw).filter(Boolean));
  const ra = rathena.modes[String(row.id)];
  // null = no rAthena row for this id (Zero-only event copies), not "no".
  // aggressive rides along so a row rozerodb says nothing about (58 of them,
  // Poring and the plants among them) can still show it, marked as rAthena's.
  const behaviour = ra ? { aggressive: ra.aggressive, assist: ra.assist, castSensor: ra.castSensor, detector: ra.detector, plant: ra.plant } : null;
  if (labels.size === 0) {
    modes[row.id] = { known: false, behaviour };
    unknownIds.push(row.id);
    continue;
  }
  const entry = { known: true, canMove: labels.has('Can move'), mini: labels.has('mini'), behaviour };
  modes[row.id] = entry;
  known += 1;
  if (!entry.canMove) rooted += 1;
  if (entry.mini) mini += 1;
}

const out = {
  _meta: {
    what: 'Behaviour flags per monster id. From the rozerodb export: canMove (false = rooted in place), mini (mini-boss); known:false = the export carries no specialStatus for that row at all. behaviour {assist, castSensor, detector, plant} is from rAthena (data/raw/rathena-modes.json); behaviour:null = no rAthena row for that id.',
    source: 'data/raw/monsters.json (ragnarokZero.specialStatus) + data/raw/rathena-modes.json',
    rathena: rathena._meta.aggressiveCheck,
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

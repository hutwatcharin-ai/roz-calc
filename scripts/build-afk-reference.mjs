// Builds data/afk-reference.json: the two numbers the overnight-bot survival
// model needs that our monster and map tables do not carry.
//
//   walk[code]     walkable cells on the map, counted from the map's .gat file
//                  in the RO Zero client archive (data.grf). Used for how far
//                  apart the monsters stand, so how long the bot walks per kill.
//   mob[id]        [attackDelayMs, viewRange, walkSpeedMs, attackRange] from
//                  rAthena's renewal mob_db. attackDelayMs is 0 for a monster
//                  that never attacks (Ai 06: plants and mushrooms, whose
//                  AttackDelay of 1 would otherwise read as 1,000 hits a
//                  second). Zero's own values are not public; these are
//                  classic RO's, and the page labels them as such.
//
//   node scripts/build-afk-reference.mjs <data.grf> <rathena re/mob_db.yml> <farm-data.json> [gatDir]
//
// farm-data.json is a saved copy of /tools/leveling-spots/farm-data (the map
// codes and monster ids to cover). gatDir defaults to a temp folder; the .gat
// files are extracted there with tools/grf-extract.mjs.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

const [grf, mobDb, farmPath, gatDirArg] = process.argv.slice(2);
if (!grf || !mobDb || !farmPath) throw new Error('usage: build-afk-reference.mjs <data.grf> <mob_db.yml> <farm-data.json> [gatDir]');

const farm = JSON.parse(readFileSync(farmPath, 'utf8'));
const codes = farm.maps.map((m) => m.code);

// --- walkable cells -------------------------------------------------------
const gatDir = gatDirArg ?? mkdtempSync(join(tmpdir(), 'gat-'));
const pattern = '(^|[\\\\/])(' + codes.join('|') + ')\\.gat$';
execFileSync('node', ['tools/grf-extract.mjs', grf, gatDir, '--match', pattern], { stdio: 'inherit' });

const gatFiles = [];
(function walk(dir) {
  for (const f of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.toLowerCase().endsWith('.gat')) gatFiles.push(p);
  }
})(gatDir);

// GAT: "GRAT", u8 major, u8 minor, u32 width, u32 height, then 20 bytes per
// cell (four corner heights, u32 type). Types 0 and 3 (water) can be walked on.
const walk = {};
for (const p of gatFiles) {
  const b = readFileSync(p);
  if (b.toString('latin1', 0, 4) !== 'GRAT') continue;
  const w = b.readUInt32LE(6);
  const h = b.readUInt32LE(10);
  let cells = 0;
  for (let i = 0; i < w * h; i++) {
    const type = b.readUInt32LE(14 + i * 20 + 16);
    if (type === 0 || type === 3) cells++;
  }
  walk[basename(p).slice(0, -4).toLowerCase()] = cells;
}

// --- rAthena attack delay and view range -----------------------------------
const byId = new Map();
const byName = new Map();
let cur = null;
for (const line of readFileSync(mobDb, 'utf8').split(/\r?\n/)) {
  let m;
  if ((m = line.match(/^  - Id: (\d+)/))) {
    cur = { id: Number(m[1]) };
    byId.set(cur.id, cur);
  } else if (cur && (m = line.match(/^    (Name|AttackDelay|SkillRange|WalkSpeed|AttackRange|Ai): (.+)$/))) {
    cur[m[1]] = m[1] === 'Name' || m[1] === 'Ai' ? m[2].trim() : Number(m[2]);
    if (m[1] === 'Name') byName.set(m[2].trim().toLowerCase(), cur);
  }
}

const mob = {};
let byIdHits = 0;
let byNameHits = 0;
for (const m of Object.values(farm.monsters)) {
  // Ids are Gravity's and shared: 1025 is "Snake" in Zero and "Boa" in
  // rAthena, 1317 "Fur Seal" and "Seal" -- the same monster under the old name.
  let r = byId.get(m.id);
  if (r) byIdHits++;
  else {
    r = byName.get(m.name.toLowerCase());
    if (r) byNameHits++;
  }
  if (r && r.AttackDelay) {
    mob[m.id] = [r.Ai === '06' ? 0 : r.AttackDelay, r.SkillRange ?? null, r.WalkSpeed ?? null, r.AttackRange ?? null];
  }
}

const out = {
  _meta: {
    how: 'node scripts/build-afk-reference.mjs <data.grf> <mob_db.yml> <farm-data.json>',
    walk: 'walkable .gat cells (types 0 and 3) per map, RO Zero Global client data.grf',
    mob: '[AttackDelay ms (0 = never attacks, Ai 06), SkillRange (view range) cells, WalkSpeed ms a cell, AttackRange cells] from rAthena db/re/mob_db.yml, matched by id (Gravity ids are shared; some names differ, e.g. 1025 Snake = Boa), else by name. Classic RO values, not measured in Zero.',
    built: new Date().toISOString().slice(0, 10),
  },
  walk,
  mob,
};
writeFileSync('data/afk-reference.json', JSON.stringify(out));
console.log(`maps ${Object.keys(walk).length}/${codes.length}, monsters ${Object.keys(mob).length}/${Object.keys(farm.monsters).length} (id ${byIdHits}, name ${byNameHits})`);
console.log('maps without a .gat:', codes.filter((c) => walk[c.toLowerCase()] === undefined).join(' '));

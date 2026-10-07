// Gives the 159 champion monsters the names the game shows.
//
// Our import filed them as "C1 Poring" ... "C5 Poring": the C1-C5 is the tier
// in the monster's internal name (C1_PORING), not what a player sees. The
// owner checked in game on 7 Oct 2026: the field shows "Swift Poring", and
// these monsters do spawn in ordinary fields and dungeons (one or two per
// map beside the normal ones, rozerodb's spawn atlas). The tier names are
// the game's champion series, the same ones rozeroplanner prints:
//
//   C1 Swift X   C2 Solid X   C3 X Ringleader   C4 Furious X   C5 Elusive X
//
// The old name is kept in data/monster-former-names.json so a search for
// "C1 Poring" still finds the monster.
//
// Run:  node --env-file=.env.local scripts/rename-champions.mjs [--dry-run]

import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const TODAY = '2026-10-07';
const FORMER = 'data/monster-former-names.json';

// The base name is the normal monster's current name, found through the
// game's internal names (C3_WORM_TAIL -> WORM_TAIL -> 1024 "Wormtail"), so a
// champion carries the spelling fixes its normal form already got.
export function championName(name, base) {
  const m = /^C([1-5]) (.+)$/.exec(name);
  if (!m) return null;
  base ??= m[2];
  return { 1: `Swift ${base}`, 2: `Solid ${base}`, 3: `${base} Ringleader`, 4: `Furious ${base}`, 5: `Elusive ${base}` }[m[1]];
}

// The file's own layout: one monster per line.
export function formatFormer(former) {
  const meta = JSON.stringify(former._meta, null, 2).replace(/\n/g, '\n  ');
  const rows = Object.entries(former.monsters).map(
    ([id, list]) => `    "${id}": [${list.map((x) => `{ "name": ${JSON.stringify(x.name)}, "until": "${x.until}" }`).join(', ')}]`,
  );
  return `{\n  "_meta": ${meta},\n  "monsters": {\n${rows.join(',\n')}\n  }\n}\n`;
}

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await db.from('monsters').select('id, name_en').range(0, 4999);
if (error) throw error;
const aegis = JSON.parse(fs.readFileSync('data/monster-aegis-names.json', 'utf8'));
const idByAegis = new Map(Object.entries(aegis).map(([id, a]) => [a, Number(id)]));
const nameById = new Map(data.map((m) => [m.id, m.name_en]));
const renames = data
  .filter((m) => /^C[1-5] /.test(m.name_en))
  .map((m) => {
    const normal = idByAegis.get(String(aegis[m.id] ?? '').replace(/^C\d_/, ''));
    return { id: m.id, from: m.name_en, to: championName(m.name_en, normal ? nameById.get(normal) : undefined) };
  })
  .filter((r) => r.to);
console.log(`${renames.length} champions to rename${dryRun ? ' (dry run)' : ''}`);
for (const r of renames.slice(0, 6)) console.log(`  ${r.id}: ${r.from} -> ${r.to}`);
if (dryRun) process.exit(0);

for (const r of renames) {
  const { error: e } = await db.from('monsters').update({ name_en: r.to }).eq('id', r.id).eq('name_en', r.from);
  if (e) throw e;
}
const former = JSON.parse(fs.readFileSync(FORMER, 'utf8'));
for (const r of renames) {
  const list = (former.monsters[r.id] ??= []);
  if (!list.some((x) => x.name === r.from)) list.push({ name: r.from, until: TODAY });
}
fs.writeFileSync(FORMER, formatFormer(former));
console.log('renamed, former names kept');

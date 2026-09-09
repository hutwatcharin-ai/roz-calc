// Brings the Thai translation files in line with the monster renames.
//
// Thirty monsters were renamed on 7-8 Sep 2026 to match the name on their own
// card. The monsters table changed; the hand-written Thai in data/quest-th
// did not, so a quest still says "กำจัด Thief Bug" while the monster page it
// sends you to is headed ThiefBug. The search finds either, so nothing is
// broken -- it just reads as two different creatures.
//
// The list of renames is read out of scripts/fix-monster-names.mjs rather
// than repeated here, so this can never drift from what was actually applied.
// A rename whose old name is a substring of the new one ("Peco Peco" contains
// "Peco") is skipped: replacing it would corrupt text that is already right.
//
// Scope is data/quest-th only, and the first dry run is why. Turned loose on
// data/ it also wanted to rewrite:
//
//   data/monster-former-names.json  which exists to hold the old names. That
//                                   is the file's whole job.
//   data/raw/*.json                 upstream snapshots. Editing an archive to
//                                   match a later decision falsifies it.
//   data/card-effects-th.json       "ดาเมจกายภาพต่อ Shellfish" -- but the
//                                   client's own card text says Shellfish
//                                   while naming the monster Shell Fish, so
//                                   the translation is already faithful.
//   data/skill-descriptions-th.json "Pecopeco Trainer" is an NPC in the
//                                   client's text, not the monster.
//
// Each of those would have been a quiet regression, and none of them would
// have failed a test.
//
// Run:  node scripts/fix-quest-monster-names.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';

const dryRun = process.argv.includes('--dry-run');
const ROOT = process.cwd();

const source = fs.readFileSync(path.join(ROOT, 'scripts', 'fix-monster-names.mjs'), 'utf-8');
const renames = [...source.matchAll(/^\s*\[(\d+), '([^']+)', '([^']+)'\],/gm)]
  .map((m) => ({ id: Number(m[1]), from: m[2], to: m[3] }))
  // "Sword Fish" -> "Swordfish" would turn an already-correct "Swordfish"
  // back into a broken one on a second run. Only rewrite when the old name
  // cannot appear inside the new one.
  .filter((r) => !r.to.includes(r.from));

/** Hand-written Thai prose about quests. Nothing else. */
const SCOPE = path.join(ROOT, 'data', 'quest-th');

function jsonFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...jsonFiles(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

let changedFiles = 0;
let changedNames = 0;
for (const file of jsonFiles(SCOPE)) {
  const before = fs.readFileSync(file, 'utf-8');
  let after = before;
  const applied = [];
  for (const { from, to } of renames) {
    // Word-bounded on both sides so "Thief Bug" inside "Thief Bug Egg" is
    // rewritten too, but a longer name that merely starts the same is not
    // clipped. JSON escapes nothing in these names, so a plain split works.
    const parts = after.split(from);
    if (parts.length === 1) continue;
    after = parts.join(to);
    applied.push(`${from} ×${parts.length - 1} -> ${to}`);
    changedNames += parts.length - 1;
  }
  if (applied.length === 0) continue;
  changedFiles += 1;
  console.log(`${path.relative(ROOT, file)}`);
  for (const line of applied) console.log(`   ${line}`);
  // Re-parsed before writing: a rename must never be the thing that turns a
  // translation file into invalid JSON.
  JSON.parse(after);
  if (!dryRun) fs.writeFileSync(file, after);
}

console.log(`\n${changedNames} names in ${changedFiles} files${dryRun ? ' (dry run: nothing written)' : ''}`);

// ⚠️ Editing these files is only half the job. The site serves quest text from
// the quests table's *_th columns, not from this directory -- the files are
// the source that gets imported. After running this, push the changed batches
// into the database or the site keeps showing the old names:
//
//   set -a; . ./.env.local; set +a
//   npx tsx scripts/apply-quest-translations.ts data/quest-th/batch-5.json   (and each other changed batch)
//
// The page is ISR with a 24h window, so it can still serve the old copy for a
// while after that; a redeploy is what makes it immediate.

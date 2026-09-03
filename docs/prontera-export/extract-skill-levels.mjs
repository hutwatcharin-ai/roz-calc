// Per-level skill numbers (SP, range, cast, cooldown, effect text) out of the
// crawled skill pages.
//
// extract-skills.mjs deliberately stopped at the header fields, because the
// level table only exists in the page text as a flat run of tokens -- "Lv
// Effect SP Range Cast Cooldown 1 ATK 130% 8 1 - - 2 ..." -- where the effect
// column is free text of variable length. Parsing a numeric grid out of
// flattened text is how the element-table comparison produced 14 false
// mismatches on 2 Sep; the fix then was to read the real structure, and that
// is what this does: the Nuxt payload carries levels[] as objects.
import fs from 'node:fs';
import path from 'node:path';
import { resolvePayload } from './resolve-lib.mjs';

const FILE = path.resolve('prontera-export', 'data', 'skills.jsonl');
const OUT = path.resolve('prontera-export', 'skill-levels.json');

function findSkill(node, depth = 0, seen = new Set()) {
  if (depth > 8 || node === null || typeof node !== 'object') return null;
  if (seen.has(node)) return null;
  seen.add(node);

  if (!Array.isArray(node) && Array.isArray(node.levels) && typeof node.max_level !== 'undefined') {
    return node;
  }
  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    const found = findSkill(value, depth + 1, seen);
    if (found) return found;
  }
  return null;
}

const lines = fs.readFileSync(FILE, 'utf8').trim().split('\n');
const skills = [];
let noPayload = 0;
let noLevels = 0;

for (const line of lines) {
  const rec = JSON.parse(line);
  if (rec.status !== 200 || !rec.nuxt_data) {
    noPayload += 1;
    continue;
  }

  let payload;
  try {
    payload = resolvePayload(rec.nuxt_data);
  } catch {
    noPayload += 1;
    continue;
  }

  const skill = findSkill(payload);
  if (!skill || !Array.isArray(skill.levels) || skill.levels.length === 0) {
    noLevels += 1;
    continue;
  }

  skills.push({
    slug: rec.slug,
    // rec.heading, not a regex over the title tag: the first version of
    // extract-skills.mjs concatenated the two and produced "Bash Bash".
    name: rec.heading ?? skill.name ?? null,
    max_level: skill.max_level ?? null,
    // The site labels each block's confidence separately -- a skill can have
    // an unconfirmed description and a verified level table. Carried through
    // rather than flattened, so a caller can require "verified" if it wants.
    levels_confidence: skill.levels_confidence ?? skill.confidence ?? null,
    levels: skill.levels.map((l) => ({
      level: l.level ?? null,
      effect: l.description_text ?? null,
      sp_cost: l.sp_cost ?? null,
      attack_range: l.attack_range ?? null,
      cast_time_ms: l.cast_time_ms ?? null,
      cooldown_ms: l.cooldown_ms ?? null,
    })),
  });
}

fs.writeFileSync(OUT, JSON.stringify({ skills }, null, 2), 'utf8');

const rows = skills.reduce((n, s) => n + s.levels.length, 0);
const withNumbers = skills.filter((s) => s.levels.some((l) => l.sp_cost !== null)).length;
console.log(`skills with a level table: ${skills.length} (${rows} level rows)`);
console.log(`  of those, at least one SP value: ${withNumbers}`);
console.log(`skipped: ${noPayload} without a usable payload, ${noLevels} with no levels[]`);
console.log(`wrote ${OUT}`);

// Pulls the whole skill tree -- every class line, its stages, each stage's
// skill-point budget, and each skill's prerequisites and grid slot -- out of
// prontera.info's skill planner pages.
//
// Why the planner and not the skill pages we already crawled: a skill's own
// page carries its prerequisites but not the three things a planner needs --
// which class stage the skill belongs to, how many points that stage grants,
// and where the skill sits in the in-game skill window (tree_slot). The
// planner page is server-rendered, so all of it is in the Nuxt payload.
//
// One request per class (20), each returning the full line (Novice + 1st +
// 2nd), so stages repeat across responses and are deduplicated by slug.
//
// Run:  node prontera-export/fetch-skill-tree.mjs
import fs from 'node:fs';
import path from 'node:path';
import { resolvePayload } from './resolve-lib.mjs';

const OUT = path.resolve('prontera-export', 'skill-tree.json');
const CLASSES = [
  'novice',
  'acolyte', 'archer', 'mage', 'merchant', 'swordsman', 'thief',
  'alchemist', 'assassin', 'bard', 'blacksmith', 'crusader', 'dancer', 'hunter',
  'knight', 'monk', 'priest', 'rogue', 'sage', 'wizard',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Every node that carries a skill_points budget is one stage of a class line.
function findStages(node, depth = 0, seen = new Set(), out = []) {
  if (depth > 9 || node === null || typeof node !== 'object' || seen.has(node)) return out;
  seen.add(node);
  if (!Array.isArray(node) && typeof node.skill_points === 'number' && Array.isArray(node.skills)) {
    out.push(node);
  }
  for (const value of Array.isArray(node) ? node : Object.values(node)) {
    findStages(value, depth + 1, seen, out);
  }
  return out;
}

const stages = new Map();
const lines = new Map();

for (const [i, slug] of CLASSES.entries()) {
  const url = `https://roz.prontera.info/skills/planner?class=${slug}`;
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; roz-calc research)' } });
  if (res.status !== 200) {
    console.log(`  ${slug}: HTTP ${res.status}, skipped`);
    await sleep(600);
    continue;
  }
  const html = await res.text();
  const match = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!match) {
    console.log(`  ${slug}: no payload, skipped`);
    await sleep(600);
    continue;
  }

  const found = findStages(resolvePayload(match[1]));
  // The order stages appear in is the order the planner renders them, which is
  // the order a character actually goes through them.
  lines.set(slug, found.map((s) => s.job_class?.slug).filter(Boolean));

  for (const stage of found) {
    const jobSlug = stage.job_class?.slug;
    if (!jobSlug || stages.has(jobSlug)) continue;
    stages.set(jobSlug, {
      slug: jobSlug,
      name: stage.job_class.name ?? jobSlug,
      tier: stage.job_class.tier ?? null,
      skill_points: stage.skill_points,
      skills: stage.skills.map((sk) => ({
        slug: sk.slug,
        name: sk.name,
        max_level: sk.max_level ?? null,
        // free: a quest/platinum skill, learned without spending a point.
        free: Boolean(sk.free),
        is_default: Boolean(sk.is_default),
        required_job_level: sk.required_job_level_min ?? null,
        // Position in the in-game skill window, 1-based.
        tree_slot: sk.tree_slot ?? null,
        passive: sk.passive ?? null,
        // Prerequisites name their skill by uuid here, not by slug (the slug
        // form only appears on a skill's own page). Resolved below, once every
        // class has been fetched, because a 2nd-class skill's prerequisite is
        // usually a 1st-class skill from another stage.
        id: sk.id,
        prerequisites: (sk.prerequisites ?? []).map((p) => ({ skill_id: p.skill_id ?? null, level: p.level ?? null })),
      })),
    });
  }

  process.stdout.write(`\r${i + 1}/${CLASSES.length} classes (${stages.size} stages so far)   `);
  await sleep(600);
}

// uuid -> slug across every stage, then rewrite each prerequisite in terms of
// slugs. An id with no skill behind it is reported, never dropped silently:
// a prerequisite we cannot name is a hole in the tree, not a skill with none.
const slugById = new Map();
for (const stage of stages.values()) {
  for (const skill of stage.skills) slugById.set(skill.id, skill.slug);
}
let unresolved = 0;
for (const stage of stages.values()) {
  for (const skill of stage.skills) {
    skill.prerequisites = skill.prerequisites.map((p) => {
      const slug = p.skill_id ? slugById.get(p.skill_id) ?? null : null;
      if (!slug) unresolved += 1;
      return { slug, level: p.level };
    });
    delete skill.id;
  }
}
if (unresolved > 0) console.log(`WARNING: ${unresolved} prerequisites reference a skill outside the fetched classes`);

const payload = {
  fetched_at: new Date().toISOString(),
  source: 'https://roz.prontera.info/skills/planner',
  lines: Object.fromEntries(lines),
  stages: [...stages.values()],
};
fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), 'utf8');

const skills = payload.stages.reduce((n, s) => n + s.skills.length, 0);
const withSlot = payload.stages.reduce((n, s) => n + s.skills.filter((k) => k.tree_slot !== null).length, 0);
const free = payload.stages.reduce((n, s) => n + s.skills.filter((k) => k.free).length, 0);
console.log(`\n${payload.stages.length} stages, ${skills} skills (${withSlot} with a grid slot, ${free} free/quest)`);
console.log(`points per stage: ${payload.stages.map((s) => `${s.slug} ${s.skill_points}`).join(', ')}`);
console.log(`wrote ${OUT}`);

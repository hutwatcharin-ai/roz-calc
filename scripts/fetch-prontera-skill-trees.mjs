// Skill trees and prerequisites for the 19 live jobs, from roz.prontera.info.
//
// Our own skills table cannot plan a build: its `requires` column is scraped
// prose, empty on Duple Light and Aspersio, and on Divine Protection it holds
// the Crusader's prerequisite, not the Acolyte's. prontera.info's job pages
// list each job's tree, and each skill page gives structured prerequisites and
// per-level text. Both are Nuxt payloads read with the shared resolver.
// robots.txt allows everything but /api/, which this never touches.
//
// Run: node scripts/fetch-prontera-skill-trees.mjs
// Writes data/skill-trees.json: { jobs: { [slug]: { name, from, skills: [...] } } }

import fs from 'node:fs';
import path from 'node:path';
import { resolveNuxtData } from './prontera-nuxt.mjs';

const OUT = path.join(process.cwd(), 'data', 'skill-trees.json');
const DELAY_MS = 300;
const JOBS = [
  'swordsman', 'mage', 'archer', 'acolyte', 'thief', 'merchant',
  'knight', 'crusader', 'wizard', 'sage', 'hunter', 'bard', 'dancer',
  'priest', 'monk', 'assassin', 'rogue', 'blacksmith', 'alchemist',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nuxt(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const html = await res.text();
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  if (!m) throw new Error(`no payload: ${url}`);
  return resolveNuxtData(JSON.parse(m[1]));
}

async function main() {
  const skillCache = new Map();
  const jobs = {};
  for (const slug of JOBS) {
    const root = await nuxt(`https://roz.prontera.info/jobs/${slug}`);
    const job = root.data[`job-${slug}`]?.job;
    if (!job) throw new Error(`job payload missing: ${slug}`);
    await sleep(DELAY_MS);
    const skills = [];
    for (const entry of job.skills ?? []) {
      if (!skillCache.has(entry.slug)) {
        const page = await nuxt(`https://roz.prontera.info/skills/${entry.slug}`);
        const skill = page.data[`skill-detail-${entry.slug}-en`]?.skill;
        skillCache.set(entry.slug, skill ?? null);
        await sleep(DELAY_MS);
      }
      const skill = skillCache.get(entry.slug);
      skills.push({
        slug: entry.slug,
        name: entry.name,
        max: entry.max_level_override ?? entry.max_level,
        passive: entry.passive === 'passive',
        free: Boolean(entry.free || entry.is_default),
        jobLevel: entry.required_job_level_min ?? null,
        prereqs: (skill?.prerequisites ?? []).map((p) => ({ slug: p.slug, name: p.name, level: p.level })),
        levels: (skill?.levels ?? []).map((l) => l.description_text ?? ''),
      });
    }
    jobs[slug] = {
      name: job.name,
      from: (job.progressions_from ?? []).map((p) => p.slug),
      skills,
    };
    console.log(`${slug}: ${skills.length} skills`);
  }
  fs.writeFileSync(OUT, JSON.stringify({ fetched: new Date().toISOString().slice(0, 10), source: 'roz.prontera.info', jobs }, null, 1));
  console.log(`wrote ${OUT} (${skillCache.size} distinct skills)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Imports the per-level skill numbers (SP, range, cast, cooldown, effect) from
// the prontera.info export into skill_levels.
//
// Source: docs/prontera-export/skill-levels.json, produced by
// prontera-export/extract-skill-levels.mjs out of each page's Nuxt payload --
// not out of the rendered text, where the level table is a flat run of tokens
// with a variable-length effect column.
//
// Only slugs that already exist in our skills table are written (846 of the
// 851 we have matched; the export carries 1,048 skills, the extra ones being
// content this game does not have). max_level agreed on every matched slug,
// which is the cross-check that the two slug namespaces really are the same.
//
// Upsert, not insert-only: these rows carry no hand-written Thai, so a re-run
// after a fresh crawl should update them.
//
// Run:  npx tsx scripts/import-skill-levels.ts [--dry]

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const FILE = 'docs/prontera-export/skill-levels.json';
const CHUNK = 500;

interface ExportedLevel {
  level: number | null;
  effect: string | null;
  sp_cost: number | null;
  attack_range: number | null;
  cast_time_ms: number | null;
  cooldown_ms: number | null;
}

interface ExportedSkill {
  slug: string;
  name: string | null;
  max_level: number | null;
  levels: ExportedLevel[];
}

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  const db = createClient(url, key);

  const { skills } = JSON.parse(fs.readFileSync(FILE, 'utf8')) as { skills: ExportedSkill[] };

  // Paginated: PostgREST caps a select at 1,000 rows and does not say so when
  // it truncates, which here would look like "these skills do not exist" and
  // silently drop their levels.
  const known = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('skills').select('slug').order('slug').range(from, from + 999);
    if (error) throw new Error(`skills read failed: ${error.message}`);
    if (!data || data.length === 0) break;
    for (const row of data) known.add(row.slug);
    if (data.length < 1000) break;
  }

  const rows: Record<string, unknown>[] = [];
  let unknownSkills = 0;
  let droppedLevels = 0;

  for (const skill of skills) {
    if (!known.has(skill.slug)) {
      unknownSkills += 1;
      continue;
    }
    for (const level of skill.levels) {
      // A row with no level number has no key. Guessing its position from the
      // array index would invent a game value.
      if (level.level === null || !Number.isFinite(level.level)) {
        droppedLevels += 1;
        continue;
      }
      rows.push({
        skill_slug: skill.slug,
        level: level.level,
        effect: level.effect,
        sp_cost: level.sp_cost,
        attack_range: level.attack_range,
        cast_time_ms: level.cast_time_ms,
        cooldown_ms: level.cooldown_ms,
        source: 'prontera.info',
      });
    }
  }

  console.log(`export: ${skills.length} skills`);
  console.log(`matched to our skills table: ${skills.length - unknownSkills} (skipped ${unknownSkills} we do not have)`);
  console.log(`level rows to write: ${rows.length}${droppedLevels ? ` (dropped ${droppedLevels} with no level number)` : ''}`);

  if (dry) {
    console.log('dry run, nothing written');
    return;
  }

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await db.from('skill_levels').upsert(chunk, { onConflict: 'skill_slug,level' });
    if (error) throw new Error(`upsert failed at row ${i}: ${error.message}`);
    process.stdout.write(`\r  wrote ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }
  console.log('\ndone');
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

// Pulls the unambiguous header fields out of every prontera.info skill page's
// already-clean visible text (no devalue parsing needed here -- unlike
// /random-options, these detail pages render their real content as plain
// server-rendered text).
//
// Deliberately NOT extracted: the per-level Lv/Effect/SP/Range/Cast/Cooldown
// table. The "Effect" cell is free text that varies per skill (numbers,
// commas, percents), so splitting the flattened row into columns by regex
// risks silently misreading a digit -- exactly the failure mode
// lib/refine-table.ts's comments warn about. That needs a parser written and
// verified per skill archetype, not attempted in this pass.
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve('prontera-export', 'data', 'skills.jsonl');
const OUT = path.resolve('prontera-export', 'skills-summary.json');

function field(text, label, stopLabels) {
  const stop = stopLabels.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const re = new RegExp(`${label}\\s+([\\s\\S]*?)\\s+(?:${stop})`, 'i');
  const m = re.exec(text);
  return m ? m[1].trim() : null;
}

function listAfter(text, label, stopLabels) {
  const raw = field(text, label, stopLabels);
  if (!raw) return [];
  // Entries are "Name" optionally followed by "Job Lv N+" or "Max Lv N" --
  // split on those markers, which is unambiguous (they never appear inside a
  // skill/job name).
  return raw
    .split(/(?=[A-Z])/) // placeholder, refined below per caller
    .join('');
}

const lines = fs.readFileSync(SRC, 'utf8').trim().split('\n');
const skills = [];
const skipped = [];

for (const line of lines) {
  const rec = JSON.parse(line);
  if (rec.slug === 'skills' || rec.slug === 'planner') continue; // category/tool shells, not a skill
  const t = rec.text;
  const idx = t.indexOf('Database › Skills ›');
  if (idx === -1) {
    skipped.push({ url: rec.url, reason: 'no Database > Skills breadcrumb found' });
    continue;
  }
  const body = t.slice(idx);

  const name = rec.heading ?? field(body, 'Skills ›', ['Active', 'Passive']) ?? rec.title;
  const skillType = /\bActive\b/.test(body.slice(0, 400)) ? 'Active' : /\bPassive\b/.test(body.slice(0, 400)) ? 'Passive' : null;
  const maxLvMatch = /Max Lv (\d+)/.exec(body);
  const descMatch = /How we label our data →\s*([\s\S]*?)\s*☆ Save/.exec(body);
  const levelsConfidence = /Levels[\s\S]{0,30}?(Verified|Unconfirmed)/.exec(body)?.[1] ?? null;
  const headerConfidence = /Skills ›[\s\S]{0,250}?(Verified|Unconfirmed)/.exec(body)?.[1] ?? null;

  const requiresMatch = /Requires\s+([\s\S]*?)\s+(?:Leads to|Learned by|Plan skills|▸)/.exec(body);
  const leadsToMatch = /Leads to\s+([\s\S]*?)\s+(?:Learned by|Plan skills|▸)/.exec(body);
  const learnedByMatch = /Learned by\s+([\s\S]*?)\s+(?:Plan skills|▸)/.exec(body);

  skills.push({
    url: rec.url,
    slug: rec.slug,
    name,
    type: skillType,
    max_lv: maxLvMatch ? Number(maxLvMatch[1]) : null,
    description: descMatch ? descMatch[1].trim() : null,
    header_confidence: headerConfidence,
    levels_table_confidence: levelsConfidence,
    // Raw strings, not parsed into arrays: names in these lists can contain
    // "Lv N+" suffixes in varying formats (Job Lv / Max Lv / Default Quest) --
    // keeping the raw text avoids guessing a split rule that breaks on some
    // skill's prerequisite name.
    requires_raw: requiresMatch ? requiresMatch[1].trim() : null,
    leads_to_raw: leadsToMatch ? leadsToMatch[1].trim() : null,
    learned_by_raw: learnedByMatch ? learnedByMatch[1].trim() : null,
  });
}

fs.writeFileSync(OUT, JSON.stringify({ source: 'https://roz.prontera.info', extracted_at: new Date().toISOString(), count: skills.length, skipped_count: skipped.length, skills, skipped }, null, 2), 'utf8');
console.log(`${skills.length} skills extracted, ${skipped.length} skipped -> ${OUT}`);

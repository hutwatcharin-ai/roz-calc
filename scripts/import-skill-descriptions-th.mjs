// Thai skill descriptions, from a Thai client's own skill text.
//
// 512 of our 851 skills have no Thai at all, and 512 English paragraphs on a
// Thai site is the gap a player hits exactly when they are choosing a build.
//
// Source: skillinfoz\skilldescript.lub inside a client GRF -- plain Lua, Thai
// in TIS-620, 1,290 skills of which 953 carry Thai. It is Gravity's own Thai
// text, written per level ("[เลเวล 1] : ...").
//
// The client is not this game's, and Zero rebalances skills, so a description
// is taken only when the two agree on what the skill is:
//
//   the English name matches exactly (normalised), and
//   the max level matches, and
//   no "[เลเวล N]" line names a level above that max -- a text that describes
//   more levels than this game has is describing another edition.
//
// The lines that repeat what our own columns already hold are dropped: the
// MAX Lv line (we have max_level) and the ประเภท line (we have type).
//
// Run:  set -a; . ./.env.local; set +a; node scripts/import-skill-descriptions-th.mjs [--apply]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { Grf } from './lib/grf.mjs';

const argv = process.argv.slice(2);
const APPLY = argv.includes('--apply');
const REFRESH = argv.includes('--refresh');
const clientAt = argv.indexOf('--client');
const CLIENT = clientAt === -1 ? 'D:/EternalROClient140869' : argv[clientAt + 1];
const DEST = path.join(process.cwd(), 'data', 'skill-descriptions-th-client.json');

const THAI = /[฀-๿]/;
const COLOUR = /\^[0-9a-fA-F]{6}/g;
const DROP_LINE = /^(MAX Lv|ประเภท)\s*:/;
// The client labels its own first line. The page already has a heading, so the
// label would read twice.
const LEAD_LABEL = /^รายละเอียด\s*:\s*/;
const LEVEL_LINE = /\[เลเวล\s*(\d+)\]/g;

function fromArchives(clientDir, needle) {
  const ini = fs.readFileSync(path.join(clientDir, 'DATA.INI'), 'latin1');
  const files = ini
    .split('\n')
    .map((line) => /^\s*\d+\s*=\s*(.+?)\s*$/.exec(line)?.[1])
    .filter(Boolean)
    .map((name) => path.join(clientDir, name))
    .filter((file) => fs.existsSync(file));
  for (const file of files) {
    const grf = new Grf(file);
    const hit = grf.names().find((name) => name.toLowerCase().endsWith(needle));
    if (!hit) continue;
    let data = null;
    try {
      data = grf.read(hit);
    } catch {
      data = null;
    }
    if (!data) continue;
    // The base archive ships these compiled; a server's patch archive usually
    // ships the source, which is the one worth reading.
    if (data.subarray(0, 4).toString('latin1') === '\u001bLua') continue;
    return new TextDecoder('windows-874').decode(data);
  }
  throw new Error(`no readable ${needle} in any archive`);
}

async function fetchAll(db, table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

const normalise = (name) => (name ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const listText = fromArchives(CLIENT, 'skillinfoz\\skillinfolist.lub');
  const byConstant = new Map();
  for (const match of listText.matchAll(/\[SKID\.(\w+)\]\s*=\s*\{([\s\S]*?)\n\t\},/g)) {
    const name = /SkillName\s*=\s*"([^"]*)"/.exec(match[2])?.[1] ?? null;
    const max = Number(/MaxLv\s*=\s*(\d+)/.exec(match[2])?.[1] ?? 0);
    if (name) byConstant.set(match[1], { name, max });
  }

  const descText = fromArchives(CLIENT, 'skillinfoz\\skilldescript.lub');
  const descriptions = new Map();
  for (const match of descText.matchAll(/\[SKID\.(\w+)\]\s*=\s*\r?\n?\s*\{([\s\S]*?)\n\t\},/g)) {
    const lines = [...match[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)]
      .map((line) => line[1].replace(COLOUR, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (lines.length > 0) descriptions.set(match[1], lines);
  }
  console.log(`client: ${byConstant.size} skills named, ${descriptions.size} with description text`);

  const byName = new Map();
  for (const [constant, entry] of byConstant) {
    const key = normalise(entry.name);
    if (key && !byName.has(key)) byName.set(key, { constant, ...entry });
  }

  const skills = await fetchAll(db, 'skills', 'slug, name, max_level, description_th');
  const out = {};
  const reasons = { alreadyThai: 0, noMatch: 0, maxLevelDiffers: 0, levelsBeyondMax: 0, noThaiText: 0 };
  // --refresh re-publishes the rows this script wrote before, which is how a
  // change to the cleaning rules reaches text already in the table.
  const previous = REFRESH && fs.existsSync(DEST) ? new Set(Object.keys(JSON.parse(fs.readFileSync(DEST, 'utf8')).skills ?? {})) : new Set();
  for (const skill of skills) {
    if (skill.description_th && !previous.has(skill.slug)) {
      reasons.alreadyThai += 1;
      continue;
    }
    const hit = byName.get(normalise(skill.name));
    if (!hit) {
      reasons.noMatch += 1;
      continue;
    }
    if (skill.max_level && hit.max && skill.max_level !== hit.max) {
      reasons.maxLevelDiffers += 1;
      continue;
    }
    const lines = (descriptions.get(hit.constant) ?? [])
      .filter((line) => THAI.test(line) && !DROP_LINE.test(line))
      .map((line) => line.replace(LEAD_LABEL, ''));
    if (lines.length === 0) {
      reasons.noThaiText += 1;
      continue;
    }
    const levels = [...lines.join(' ').matchAll(LEVEL_LINE)].map((m) => Number(m[1]));
    if (skill.max_level && levels.some((level) => level > skill.max_level)) {
      reasons.levelsBeyondMax += 1;
      continue;
    }
    out[skill.slug] = lines;
  }

  const ordered = Object.fromEntries(Object.keys(out).sort().map((slug) => [slug, out[slug]]));
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          built: new Date().toISOString().slice(0, 10),
          source: 'skillinfoz\\skilldescript.lub from a Thai RO client (Eternal RO)',
          how: 'node scripts/import-skill-descriptions-th.mjs --apply',
          gate: 'exact English name, same max level, and no level line above that max',
          published: Object.keys(ordered).length,
          skipped: reasons,
        },
        skills: ordered,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`${Object.keys(ordered).length} skills would gain Thai text`);
  console.log(`skipped: ${JSON.stringify(reasons)}`);

  if (!APPLY) {
    console.log('dry run -- pass --apply to write skills.description_th');
    return;
  }
  let written = 0;
  for (const [slug, lines] of Object.entries(ordered)) {
    const { error } = await db.from('skills').update({ description_th: lines.join('\n') }).eq('slug', slug);
    if (error) {
      console.error(`update failed for ${slug}: ${error.message}`);
      continue;
    }
    written += 1;
  }
  console.log(`wrote ${written} rows`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

// Cross-checks our monster table against ragnarokzero.net, field by field.
//
// Everything on this site stands on these numbers: the farming ranking, the
// kill-rate panel, the AFK finder's safety call, and the element-and-size
// advice all read them, and none of them has ever been checked against a second
// source. An import that silently dropped or shifted a column would look
// exactly like a working site.
//
// ragnarokzero.net publishes the same fields per monster, including the
// Aggressive flag the AFK finder decides safety on, and its robots.txt allows
// everything but /m/. It states it derives from public TWRoZ data, which
// is likely our own upstream too -- so agreement mostly proves our import is
// faithful rather than proving the numbers are right about the live game. A
// disagreement is still worth knowing about, and that is what this reports.
//
// Run it with:
//   npx tsx scripts/compare-monster-stats.ts [sample size, default 60]
// Needs SUPABASE env vars exported and network access. Exits non-zero if any
// monster differs, or if too few pages could be read to call the run meaningful.

import { createClient } from '@supabase/supabase-js';

const DELAY_MS = 250;
const MIN_CHECKED_FRACTION = 0.8;

type Row = Record<string, unknown> & { id: number; name_en: string };

/** Fields we can read off their page, mapped to ours. */
const NUMERIC_FIELDS = [
  ['level', 'Level'],
  ['hp', 'HP'],
  ['base_exp', 'Base EXP'],
  ['job_exp', 'Job EXP'],
  ['def', 'DEF'],
  ['mdef', 'MDEF'],
  ['str', 'STR'],
  ['agi', 'AGI'],
  ['vit', 'VIT'],
  ['int_', 'INT'],
  ['dex', 'DEX'],
  ['luk', 'LUK'],
] as const;

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, ' ');
}

/** Their stat block runs from "Level" to "Drops", one label followed by its value. */
function parsePage(text: string): Record<string, string | number> | null {
  const start = text.indexOf(' Level ');
  if (start === -1) return null;
  const block = text.slice(start, start + 900);

  const out: Record<string, string | number> = {};

  for (const [, label] of NUMERIC_FIELDS) {
    // Thousands separators: their page prints "HP 22,508". A pattern that
    // stops at the comma reads 22 and reports a difference on every large
    // monster -- which is what the first version of this script did.
    const match = new RegExp(`\\b${label} (-?\\d[\\d,]*)`).exec(block);
    if (match) out[label] = Number(match[1].replace(/,/g, ''));
  }

  const size = /\bSize (Small|Medium|Large)\b/.exec(block);
  if (size) out.Size = size[1];

  // "Element Water 1" -- name then attribute level.
  const element = /\bElement ([A-Za-z]+) (\d)\b/.exec(block);
  if (element) {
    out.Element = element[1];
    out.ElementLevel = Number(element[2]);
  }

  // "Race Undead Aggressive Physically attackable Can move Stats" -- the race
  // word, then whichever flags apply, then the stat block.
  // MVP prints between the race and the other flags ("Race Undead MVP
  // Physically attackable"), so it has to terminate the race capture or it
  // gets swallowed into it -- which reported all 18 MVPs as race mismatches.
  const race = /\bRace ([A-Za-z ]+?) (?:MVP|Physically|Can move|Loots|Aggressive|Stats)\b/.exec(block);
  if (race) out.Race = race[1].trim();

  const flagStart = block.indexOf('Race ');
  const flagEnd = block.indexOf(' Stats ');
  if (flagStart !== -1 && flagEnd > flagStart) {
    const flags = block.slice(flagStart, flagEnd);
    // is_aggressive is the field the AFK finder decides safety on, and this
    // is the only published source that carries it.
    out.Aggressive = flags.includes('Aggressive') ? 1 : 0;
    out.Loots = flags.includes('Loots items') ? 1 : 0;
    out.Mvp = flags.includes('MVP') ? 1 : 0;
  }

  // ATK prints as a range with an en dash.
  const atk = /\bATK (\d[\d,]*)[–-](\d[\d,]*)/.exec(block);
  if (atk) {
    out.AtkMin = Number(atk[1].replace(/,/g, ''));
    out.AtkMax = Number(atk[2].replace(/,/g, ''));
  }

  return Object.keys(out).length === 0 ? null : out;
}

function compare(ours: Row, theirs: Record<string, string | number>): string[] {
  const differences: string[] = [];

  for (const [ourKey, label] of NUMERIC_FIELDS) {
    const them = theirs[label];
    if (them === undefined) continue;
    const us = ours[ourKey];
    if (us === null || us === undefined) continue;
    if (Number(us) !== Number(them)) differences.push(`${ourKey}: ours ${us}, theirs ${them}`);
  }

  const pairs: [string, string][] = [
    ['size', 'Size'],
    ['element', 'Element'],
    ['race', 'Race'],
  ];
  for (const [ourKey, label] of pairs) {
    const them = theirs[label];
    if (them === undefined || ours[ourKey] === null) continue;
    if (String(ours[ourKey]) !== String(them)) {
      differences.push(`${ourKey}: ours ${ours[ourKey]}, theirs ${them}`);
    }
  }

  if (theirs.ElementLevel !== undefined && ours.element_level !== null) {
    if (Number(ours.element_level) !== Number(theirs.ElementLevel)) {
      differences.push(`element_level: ours ${ours.element_level}, theirs ${theirs.ElementLevel}`);
    }
  }
  for (const [ourKey, label] of [['atk_min', 'AtkMin'], ['atk_max', 'AtkMax']] as const) {
    if (theirs[label] === undefined || ours[ourKey] === null) continue;
    if (Number(ours[ourKey]) !== Number(theirs[label])) {
      differences.push(`${ourKey}: ours ${ours[ourKey]}, theirs ${theirs[label]}`);
    }
  }

  for (const [ourKey, label] of [['is_aggressive', 'Aggressive'], ['loots_items', 'Loots'], ['is_mvp', 'Mvp']] as const) {
    const them = theirs[label];
    if (them === undefined || ours[ourKey] === null || ours[ourKey] === undefined) continue;
    if ((ours[ourKey] ? 1 : 0) !== Number(them)) {
      differences.push(`${ourKey}: ours ${ours[ourKey]}, theirs ${Number(them) === 1}`);
    }
  }

  return differences;
}

/** An even spread across the id range rather than the first N, which are all Porings. */
function sample<T>(rows: T[], count: number): T[] {
  if (rows.length <= count) return rows;
  const step = rows.length / count;
  return Array.from({ length: count }, (_, i) => rows[Math.floor(i * step)]);
}

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first');

  const wanted = Number(process.argv[2] ?? 60);
  const supabase = createClient(url, key);
  const { data, error } = await supabase.from('monsters').select('*').order('id');
  if (error) throw error;

  const all = (data ?? []) as Row[];
  const chosen = sample(all, wanted);
  console.log(`${all.length} monsters in the table, checking ${chosen.length} spread across the id range\n`);

  let checked = 0;
  let clean = 0;
  const unreadable: number[] = [];
  const problems: string[] = [];
  let fieldsCompared = 0;

  for (const monster of chosen) {
    const response = await fetch(`https://ragnarokzero.net/database/monsters/${monster.id}`);
    if (!response.ok) {
      unreadable.push(monster.id);
    } else {
      const theirs = parsePage(textOf(await response.text()));
      if (theirs === null) {
        unreadable.push(monster.id);
      } else {
        checked += 1;
        fieldsCompared += Object.keys(theirs).length;
        const differences = compare(monster, theirs);
        if (differences.length === 0) clean += 1;
        else problems.push(`${monster.id} ${monster.name_en}: ${differences.join(' · ')}`);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  console.log(`${checked} pages read, roughly ${fieldsCompared} field values compared`);
  console.log(`${clean} agree on every field`);
  if (unreadable.length > 0) console.log(`${unreadable.length} could not be read: ${unreadable.join(', ')}`);

  if (problems.length > 0) {
    console.log(`\n${problems.length} disagree:`);
    for (const line of problems) console.log(`  ${line}`);
  }

  // Saying "no differences" after reading three pages would be worthless, so a
  // run that mostly failed to fetch is a failure rather than a pass.
  if (checked < chosen.length * MIN_CHECKED_FRACTION) {
    console.log(`\nonly ${checked} of ${chosen.length} pages could be read -- too few to conclude anything`);
    process.exitCode = 1;
    return;
  }
  if (problems.length > 0) {
    process.exitCode = 1;
    return;
  }
  console.log('\nevery field checked agrees');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

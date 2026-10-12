// Fetches the stat block for monsters whose row in our table is missing it.
//
// Found on 12 Oct 2026 while working out an Axe Tornado build for Nordfeld
// Cave 2F: the three Boulder Dwarves there had no HP, DEF or EXP in our table,
// so the build simulator could not say how many casts one takes. rozerodb's
// monster pages print those numbers (and a dash for what it does not know).
// 44 rows had at least one such column empty, most of them the Nordfeld
// monsters (imported 8 Sep with nulls because neither source had them then)
// and the memorial-dungeon copies ("Mj", "Mq").
//
// This reads the rendered page at rozerodb.com/monsters/<id>, never its /api/
// (robots.txt disallows only that), one request at a time with a delay.
// Fetching and importing stay separate, as with the item pair: this writes
// data/raw/rozerodb-monster-stats.json to look at, and
// scripts/import-rozerodb-monster-stats.mjs fills only the columns that are
// still null. A dash on the page stays null: unknown is not zero.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/fetch-rozerodb-monster-stats.mjs
// (the env is only read to list which ids have gaps; nothing is written there)

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const OUT = path.join(process.cwd(), 'data', 'raw', 'rozerodb-monster-stats.json');
const DELAY_MS = 300;
export const STAT_COLUMNS = ['hp', 'def', 'mdef', 'flee_95', 'hit_100', 'str', 'agi', 'vit', 'int_', 'dex', 'luk', 'base_exp', 'job_exp', 'atk_min', 'atk_max', 'matk_min', 'matk_max'];

function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' | ')
    .replace(/&amp;/g, '&')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .replace(/( \| )+/g, ' | ');
}

const num = (s) => {
  if (s == null) return null;
  const t = s.trim();
  if (!/^-?[\d,]+$/.test(t)) return null; // a dash or anything else: not known
  return Number(t.replace(/,/g, ''));
};

/** The "Core Statistics" and "Progression" blocks of a rozerodb monster page. */
export function parseMonsterPage(html) {
  const text = textOf(html);
  const start = text.indexOf('Core Statistics');
  const end = text.indexOf('Element Weakness', start);
  if (start < 0 || end < 0) return null;
  const block = text.slice(start, end);
  const one = (label) => {
    const m = new RegExp(`\\| ${label.replace(/[()%]/g, '\\$&')} (?:\\| )+([^|]+) \\|`).exec(block);
    return m ? num(m[1]) : null;
  };
  const range = (label) => {
    const m = new RegExp(`\\| ${label} (?:\\| )+([^|]+) \\| – \\| ([^|]+) \\|`).exec(block);
    return m ? [num(m[1]), num(m[2])] : [null, null];
  };
  const [atk_min, atk_max] = range('ATK');
  const [matk_min, matk_max] = range('MATK');
  return {
    level: one('Level'),
    hp: one('HP'),
    def: one('DEF'),
    mdef: one('MDEF'),
    flee_95: one('Flee (95%)'),
    hit_100: one('Hit (100%)'),
    base_exp: one('Base EXP'),
    job_exp: one('Job EXP'),
    atk_min, atk_max, matk_min, matk_max,
    str: one('STR'), agi: one('AGI'), vit: one('VIT'), int_: one('INT'), dex: one('DEX'), luk: one('LUK'),
  };
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  const { data: rows, error } = await db.from('monsters').select('id, name_en').or(STAT_COLUMNS.map((c) => `${c}.is.null`).join(',')).order('id');
  if (error) throw error;
  console.log(`${rows.length} monsters with a gap`);

  const out = { _meta: { source: 'rozerodb.com/monsters/<id> rendered pages', fetched: new Date().toISOString().slice(0, 10) }, monsters: {} };
  for (const r of rows) {
    const res = await fetch(`https://rozerodb.com/monsters/${r.id}`, { headers: { 'User-Agent': 'rozerothai.com data check (one page per monster)' } });
    if (!res.ok) {
      console.log(`  ${r.id} ${r.name_en}: HTTP ${res.status}`);
      out.monsters[r.id] = { name: r.name_en, status: res.status, stats: null };
    } else {
      const stats = parseMonsterPage(await res.text());
      const known = stats ? Object.entries(stats).filter(([, v]) => v != null).map(([k]) => k) : [];
      console.log(`  ${r.id} ${r.name_en}: ${stats ? known.join(' ') || 'all dashes' : 'no stat block'}`);
      out.monsters[r.id] = { name: r.name_en, status: 200, stats };
    }
    await new Promise((ok) => setTimeout(ok, DELAY_MS));
  }
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`wrote ${OUT}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'))) {
  main().catch((e) => { console.error(e); process.exit(1); });
}

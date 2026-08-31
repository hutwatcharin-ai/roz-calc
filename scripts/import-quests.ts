// Imports the 766 quest pages from the rozerodb export into the quests table.
//
// Spec: docs/superpowers/specs/2026-08-31-quests-design.md. Hub assignment
// (town_key) happens HERE, at import time, so a quest cannot drift between hub
// pages when unrelated quests change -- the fold rule in lib/quest-towns.ts is
// deterministic over the full set it is given.
//
// Insert-only into an empty-or-partial table: an id already present is
// skipped and counted, because a re-run must not clobber Thai translations
// added to name_th later.
//
// Run:  npx tsx scripts/import-quests.ts [--dry]

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import { parseQuest, type ParsedQuest } from './rozerodb-export-parse';
import { assignTownKeys } from '../lib/quest-towns';

const FILE = 'docs/rozerodb-export/data/quests.jsonl';
const CHUNK = 400;

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const parsed: ParsedQuest[] = [];
  let pages = 0;
  let fails = 0;
  for (const line of fs.readFileSync(FILE, 'utf8').trim().split('\n')) {
    const row = JSON.parse(line) as { text?: string };
    const text = row.text ?? '';
    if (!text.includes('← Quest ')) continue; // index/hub pages
    pages += 1;
    const quest = parseQuest(text);
    if (quest) parsed.push(quest);
    else fails += 1;
  }

  // Duplicate ids in the export would violate the primary key mid-insert;
  // last one wins and the count is reported.
  const byId = new Map(parsed.map((q) => [q.id, q]));
  const dupes = parsed.length - byId.size;
  const quests = [...byId.values()];

  const townKeys = assignTownKeys(quests);
  const hubCounts = new Map<string, number>();
  for (const quest of quests) {
    const k = townKeys.get(quest)!;
    hubCounts.set(k, (hubCounts.get(k) ?? 0) + 1);
  }

  // Which of their map codes exist in our maps table -- a missing code still
  // imports (the map name just does not link), but it is counted.
  const ourMaps = new Set<string>();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('map_stats').select('map_code').order('map_code').range(from, from + 999);
    if (error) throw new Error(`map_stats: ${error.message}`);
    for (const row of data ?? []) ourMaps.add(row.map_code);
    if ((data ?? []).length < 1000) break;
  }
  const unknownMaps = new Set(
    quests.map((q) => q.mapCode).filter((code): code is string => code !== null && !ourMaps.has(code)),
  );

  const { data: existingRows, error: exErr } = await db.from('quests').select('id');
  if (exErr) throw new Error(exErr.message);
  const existing = new Set((existingRows ?? []).map((r) => r.id));

  const rows = quests
    .filter((q) => !existing.has(q.id))
    .map((q) => ({
      id: q.id,
      name: q.name,
      name_th: null,
      map_code: q.mapCode,
      coord_x: q.coordX,
      coord_y: q.coordY,
      zone: q.zone,
      type: q.type,
      objective: q.objective,
      description: q.description,
      chain_name: q.chainName,
      chain_next_id: q.chainNextId,
      town_key: townKeys.get(q)!,
    }));

  console.log(`${pages} quest pages · parsed ${parsed.length} · failed ${fails} · duplicate ids ${dupes}`);
  console.log(`already in table: ${existing.size} · to insert: ${rows.length}`);
  console.log(`hubs: ${hubCounts.size} —`, [...hubCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}:${n}`).join(' '));
  console.log(`map codes not in our maps table: ${unknownMaps.size}`, [...unknownMaps].slice(0, 8).join(', '));

  if (dry) {
    console.log('\n--dry: nothing written. sample row:', JSON.stringify(rows[0], null, 1));
    return;
  }

  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await db.from('quests').insert(rows.slice(i, i + CHUNK));
    if (error) throw new Error(`insert at ${i}: ${error.message}`);
  }
  const { count } = await db.from('quests').select('id', { count: 'exact', head: true });
  console.log(`\ndone. quests table: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

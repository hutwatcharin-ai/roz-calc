// The local end of the Discord inbox (scripts/discord-news.mjs). The inbox
// lives on the discord-inbox branch, checked out at ../roz-inbox:
//
//   npx tsx --env-file=.env.local scripts/discord-inbox.mts list
//       posts not yet turned into site changes, oldest first, with their files
//   npx tsx --env-file=.env.local scripts/discord-inbox.mts done <id> [<id> ...]
//       mark posts handled once the news page or data fix is live
//   npx tsx --env-file=.env.local scripts/discord-inbox.mts names
//       rewrite names.json, the monsters, maps and items the hourly job looks
//       for in each post (run after a patch adds monsters or maps)
//
// Every command pulls first and pushes after, because the hourly job writes
// to the same branch.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { supabaseRead } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetch-all-rows';
import { getMapCanonical } from '../lib/map-canonical';
import { itemHref } from '../lib/item-href';

const REPO = process.cwd();
const DIR = path.resolve(REPO, '..', 'roz-inbox');
const git = (...args: string[]) => execFileSync('git', args, { cwd: DIR, encoding: 'utf8' }).trim();

function checkout() {
  if (!fs.existsSync(DIR)) {
    execFileSync('git', ['fetch', 'origin', 'discord-inbox'], { cwd: REPO });
    execFileSync('git', ['worktree', 'add', DIR, 'discord-inbox'], { cwd: REPO });
  }
  git('pull', '--rebase', '--quiet');
}

function save(message: string) {
  git('add', '-A');
  if (!git('status', '--porcelain')) return;
  git('commit', '--quiet', '-m', message);
  git('push', '--quiet');
}

interface Post {
  id: string;
  file: string;
  title: string;
  kind: 'official' | 'player';
  urgent: boolean;
  at: string;
  done: boolean;
}
const statePath = () => path.join(DIR, 'state.json');
const readState = () => JSON.parse(fs.readFileSync(statePath(), 'utf8')) as { posts?: Post[] };

const [cmd, ...args] = process.argv.slice(2);
checkout();

if (cmd === 'list') {
  const left = (readState().posts ?? []).filter((p) => !p.done);
  if (!left.length) console.log('nothing left');
  for (const p of left) {
    console.log(`${p.urgent ? 'URGENT ' : ''}${p.kind === 'player' ? '[player] ' : ''}${p.id}  ${p.title}`);
    console.log(`    ${path.join(DIR, p.file)}`);
  }
} else if (cmd === 'done') {
  const state = readState();
  const marked = (state.posts ?? []).filter((p) => args.includes(p.id));
  const missing = args.filter((id) => !marked.some((p) => p.id === id));
  if (missing.length) throw new Error(`no such post: ${missing.join(', ')}`);
  for (const p of marked) p.done = true;
  fs.writeFileSync(statePath(), JSON.stringify(state, null, 2) + '\n');
  save(`Done: ${marked.map((p) => p.title).join('; ')}`.slice(0, 200));
  console.log(`marked ${marked.length}, ${(state.posts ?? []).filter((p) => !p.done).length} left`);
} else if (cmd === 'names') {
  const db = supabaseRead();
  const monsters = await fetchAllRows<{ id: number; name_en: string | null; hp: number | null }>((from, to) =>
    db.from('monsters').select('id, name_en, hp').order('id').range(from, to),
  );
  const maps = await fetchAllRows<{ map_code: string; map_display_name: string | null }>((from, to) =>
    db.from('map_stats').select('map_code, map_display_name').order('map_code').range(from, to),
  );
  const items = await fetchAllRows<{ id: number; name_en: string | null; category: string | null }>((from, to) =>
    db.from('items').select('id, name_en, category').order('id').range(from, to),
  );
  if (monsters.error || maps.error || items.error) throw monsters.error ?? maps.error ?? items.error;
  const canonical = await getMapCanonical();

  // One entry per name: the first id wins for monsters and items (the
  // classic id, which is the page the site links), the canonical code for maps.
  const names = new Map<string, { name: string; href: string; kind: string }>();
  const add = (name: string | null, href: string, kind: string) => {
    if (name && !names.has(name.toLowerCase())) names.set(name.toLowerCase(), { name, href, kind });
  };
  // Monsters with 0 HP are event placeholders (Ztw Ricecake), not monsters.
  for (const m of monsters.data ?? []) if (m.hp) add(m.name_en, `/database/monsters/${m.id}`, 'monster');
  for (const m of maps.data ?? []) add(m.map_display_name, `/database/maps/${canonical.byCode[m.map_code] ?? m.map_code}`, 'map');
  for (const i of items.data ?? []) add(i.name_en, itemHref(i.id, i.category), 'item');

  const out = { built: new Date().toISOString().slice(0, 10), names: [...names.values()] };
  fs.writeFileSync(path.join(DIR, 'names.json'), JSON.stringify(out) + '\n');
  save(`Names for matching (${out.names.length})`);
  console.log(`${out.names.length} names written`);
} else {
  console.log('usage: discord-inbox.mts list | done <id...> | names');
}

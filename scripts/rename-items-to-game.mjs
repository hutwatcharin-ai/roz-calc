// Renames items to the name the live game shows (owner's pick, 22 Sep 2026).
//
// data/game-items.json is the client's own item table. 1,753 of our names
// differed from it: some only in spacing or case ("ThiefBug Card" / "Thief
// Bug Card"), many in wording ("Orc Trophy" / "Horro of Tribe", even where
// the game's spelling is odd). A player types what the game shows, so that
// becomes the name; the old one is kept in data/item-former-names.json so it
// still finds the item (lib/item-former-names.ts) and every name-keyed lookup
// can fall back on it.
//
// Dry run by default; --apply writes former names first, then the rows.
// Run: node scripts/rename-items-to-game.mjs [--former-only | --apply]
import fs from 'node:fs';

const APPLY = process.argv.includes('--apply');
// Writes only the former-names file, so code that falls back on it can ship
// before any row changes: a live page must never meet a renamed card it
// cannot match.
const FORMER_ONLY = process.argv.includes('--former-only');
const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const read = { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` };
const game = JSON.parse(fs.readFileSync('data/game-items.json', 'utf8')).items;
const TODAY = new Date().toISOString().slice(0, 10);

const rows = [];
for (let offset = 0; ; offset += 1000) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/items?select=id,name_en&order=id&offset=${offset}&limit=1000`, { headers: read });
  if (!res.ok) throw new Error(`items read failed: ${res.status}`);
  const page = await res.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const changes = rows
  .map((row) => ({ id: row.id, from: row.name_en, to: (game[String(row.id)]?.name ?? '').trim() }))
  .filter((c) => c.to && c.to !== c.from);
console.log(`${changes.length} of ${rows.length} names differ from the game`);
for (const c of changes.slice(0, 12)) console.log(`  #${c.id} ${c.from}  ->  ${c.to}`);

if (!APPLY && !FORMER_ONLY) {
  console.log('\ndry run: nothing written (pass --apply)');
  process.exit(0);
}

// Former names first: if the writes stop half way, every renamed row still
// has its old name on record.
const path = 'data/item-former-names.json';
const former = fs.existsSync(path) ? JSON.parse(fs.readFileSync(path, 'utf8')) : {
  _meta: {
    what: 'Names an item used to carry on this site, kept searchable after it was renamed.',
    why: 'Renamed to the live game client\'s own name (scripts/rename-items-to-game.mjs). Search and name-keyed lookups fall back on these.',
  },
  items: {},
};
for (const c of changes) {
  const list = former.items[String(c.id)] ?? [];
  if (!list.some((n) => n.name === c.from)) list.push({ name: c.from, until: TODAY });
  former.items[String(c.id)] = list;
}
fs.writeFileSync(path, JSON.stringify(former, null, 1));
console.log(`former names recorded for ${changes.length} items`);
if (FORMER_ONLY) process.exit(0);

const write = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
let done = 0;
for (const c of changes) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/items?id=eq.${c.id}`, { method: 'PATCH', headers: write, body: JSON.stringify({ name_en: c.to }) });
  if (!res.ok) throw new Error(`#${c.id} failed: ${res.status} ${await res.text()} (after ${done} renamed)`);
  done += 1;
}
console.log(`renamed ${done} items`);

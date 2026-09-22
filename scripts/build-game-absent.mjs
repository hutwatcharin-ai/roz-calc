// Which of our items the live game client does not know.
//
// data/game-items.json is the client's own item table (build-game-items.py).
// The client cannot display an item it has no entry for, so a row of ours
// missing from it is not in the current game: on 22 Sep 2026 that was 937
// rows, mostly costumes and gear from maps not yet open (Turtle Island,
// Hatii) and a few names still in Chinese from another server's data.
//
// Writes data/game-absent-items.json, small enough for list pages to import:
// the ids, and a per-category count for the log.
//
// Run:  node scripts/build-game-absent.mjs
import fs from 'node:fs';

const env = Object.fromEntries(fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]));
const headers = { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY, Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY}` };
const game = JSON.parse(fs.readFileSync('data/game-items.json', 'utf8'));

const rows = [];
for (let offset = 0; ; offset += 1000) {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/items?select=id,category&order=id&offset=${offset}&limit=1000`, { headers });
  if (!res.ok) throw new Error(`items read failed: ${res.status}`);
  const page = await res.json();
  rows.push(...page);
  if (page.length < 1000) break;
}

const absent = rows.filter((row) => !(String(row.id) in game.items));
const byCategory = {};
for (const row of absent) byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;

fs.writeFileSync('data/game-absent-items.json', JSON.stringify({
  _meta: { checkedAgainst: game._meta.source, clientBuilt: game._meta.built, siteItems: rows.length, absent: absent.length, byCategory },
  ids: absent.map((row) => row.id),
  // Per category too: a list that pages in the database filters with a
  // not-in list, and only its own categories' ids need to go in the URL.
  idsByCategory: Object.fromEntries(Object.keys(byCategory).map((c) => [c, absent.filter((r) => r.category === c).map((r) => r.id)])),
}));
console.log(`${absent.length} of ${rows.length} items are not in the client`, byCategory);

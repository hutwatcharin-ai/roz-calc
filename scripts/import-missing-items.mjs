// Fills the holes in the items table.
//
// Found on 7 Sep 2026 while building the crafting guides: an arrow recipe
// kept dropping out because Silver Arrow, Iron Arrow, Holy Arrow and eleven
// other ammo types were not in our table at all -- the whole Ammo category
// was missing. Checking every id turned up 864 the 3 Sep prontera crawl has
// and we do not:
//
//   458  the (Bound) costumes deleted on 31 Aug, which the user now wants
//        back with a filter on the costume page rather than removed
//   406  never imported at all: 14 Ammo, 28 Monster Egg, 27 Consumable,
//        21 Package/Box, 8 Costume, 2 Card, and ~296 whose prontera page
//        title carries no category (refinement tickets, essences, tokens)
//
// Two sources, each used where it is the better one:
//   - the Bound costumes come from OUR OWN backup file, written by the
//     script that deleted them, so the rows go back exactly as they were
//   - everything else is read out of the crawled page payloads, whose
//     data_source field says "client_extract" (read from the game client)
//
// Nothing is invented: a field the source does not carry is left null, and
// an item whose payload cannot be decoded is skipped and reported.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/import-missing-items.mjs [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const CRAWL = path.join(process.cwd(), 'docs', 'prontera-export', 'data', 'items.jsonl');
const BOUND_BACKUP = path.join(
  process.env.USERPROFILE ?? process.env.HOME ?? '',
  'Downloads',
  'roz-bound-costumes-backup-2026-08-31.json',
);

const REACTIVE = new Set(['ShallowReactive', 'Reactive', 'Ref', 'EmptyShallowReactive']);

/** Nuxt's flat, index-referencing payload. Same rules as resolve-lib.mjs. */
function resolvePayload(text) {
  const arr = JSON.parse(text);
  const isRef = (x) => Number.isInteger(x) && x >= 0 && x < arr.length;
  const memo = new Map();
  function resolve(i, seen = new Set()) {
    if (seen.has(i)) return null; // a cycle: the payload links back on itself
    if (memo.has(i)) return memo.get(i);
    const v = arr[i];
    const next = new Set(seen);
    next.add(i);
    let out;
    if (Array.isArray(v)) {
      if (v.length === 2 && REACTIVE.has(v[0]) && isRef(v[1])) return resolve(v[1], next);
      out = v.map((x) => (isRef(x) ? resolve(x, next) : x));
    } else if (v && typeof v === 'object') {
      out = {};
      for (const k of Object.keys(v)) out[k] = isRef(v[k]) ? resolve(v[k], next) : v[k];
    } else {
      out = v;
    }
    memo.set(i, out);
    return out;
  }
  return resolve(arr[0][1]);
}

function findItem(root, id) {
  let found = null;
  (function walk(o, depth = 0) {
    if (found || !o || typeof o !== 'object' || depth > 40) return;
    if (Array.isArray(o)) {
      for (const x of o) walk(x, depth + 1);
      return;
    }
    if (o.item_id_ingame === id && typeof o.name === 'string') {
      found = o;
      return;
    }
    for (const v of Object.values(o)) walk(v, depth + 1);
  })(root);
  return found;
}

// Our category vocabulary is the one already in the table; the crawl's own
// wording is mapped onto it rather than adding a second spelling for the
// same thing. Anything unrecognised becomes "Other", which is what the
// table already uses for the long tail.
function categoryFor(rec, titleCategory) {
  if (rec.equip_slot === 'ammo') return 'Ammo';
  if (rec.costume_slot || /costume/i.test(titleCategory ?? '')) return 'Costume Equipment';
  switch (titleCategory) {
    case 'Card': return 'Card';
    case 'Monster Egg': return 'Pet';
    case 'Consumable': return 'Consumable / Recovery';
    case 'Garment': return 'Armor';
    default: return 'Other';
  }
}

async function allOurIds(db) {
  const ids = new Set();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('id').order('id').range(from, from + 999);
    if (error) throw error;
    for (const r of data ?? []) ids.add(r.id);
    if ((data ?? []).length < 1000) break;
  }
  return ids;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const ours = await allOurIds(db);
  console.log(`items table holds ${ours.size} ids`);

  const bound = fs.existsSync(BOUND_BACKUP)
    ? JSON.parse(fs.readFileSync(BOUND_BACKUP, 'utf8'))
    : [];
  console.log(`bound-costume backup: ${bound.length} rows${bound.length ? '' : ' (file not found)'}`);

  const rows = [];
  const skipped = [];

  for (const row of bound) {
    if (ours.has(row.id)) continue;
    // Straight back in, exactly as it was taken out.
    rows.push({ ...row, description_th: null });
  }
  const restored = rows.length;

  const rl = readline.createInterface({ input: fs.createReadStream(CRAWL, 'utf8') });
  const seen = new Set(rows.map((r) => r.id));
  for await (const line of rl) {
    if (!line.trim()) continue;
    const page = JSON.parse(line);
    if (page.status !== 200) continue;
    const m = /-(\d+)$/.exec(page.slug ?? '');
    if (!m) continue;
    const id = Number(m[1]);
    if (ours.has(id) || seen.has(id)) continue;

    const title = page.title ?? '';
    const titleCategory = title.includes(' - ') ? title.split(' - ')[1].split('|')[0].trim() : null;
    let rec = null;
    try {
      rec = findItem(resolvePayload(page.nuxt_data), id);
    } catch (e) {
      skipped.push({ id, why: `payload: ${e.message}` });
      continue;
    }
    if (!rec) {
      skipped.push({ id, why: 'no record for this id in its own page payload' });
      continue;
    }

    seen.add(id);
    rows.push({
      id,
      name_en: rec.name,
      name_th: null,
      category: categoryFor(rec, titleCategory),
      weapon_type: rec.weapon_type ?? null,
      atk: rec.physical_attack ?? null,
      required_level: rec.min_level ?? null,
      weapon_level: rec.weapon_level ?? null,
      equippable_classes: [],
      buy_price: rec.buy_price ?? null,
      sell_price: rec.sell_price ?? null,
      // No icon yet: scripts/mirror-prontera-icons.mjs fills every row whose
      // icon_url is null, and it is the one place that verifies the bytes.
      icon_url: null,
      description: rec.description ?? null,
      description_th: null,
      slots: rec.slots ?? 0,
    });
  }

  const byCategory = {};
  for (const r of rows) byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
  console.log(`${rows.length} rows to insert (${restored} restored from the backup, ${rows.length - restored} from the crawl)`);
  console.log('by category:', byCategory);
  if (skipped.length) console.log(`skipped ${skipped.length}:`, skipped.slice(0, 5));

  if (dryRun) {
    console.log('dry run: nothing written');
    return;
  }
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await db.from('items').insert(chunk);
    if (error) throw error;
    console.log(`  inserted ${i + chunk.length}/${rows.length}`);
  }
  console.log('done');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

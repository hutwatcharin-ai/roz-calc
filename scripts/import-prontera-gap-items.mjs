// Imports the items fetched by scripts/fetch-prontera-gap-items.mjs.
//
// Insert-only, same rule as import-rozerodb-items.ts: an id already in the
// table is skipped rather than overwritten, so nothing here can blank a
// Thai translation or a mirrored icon we already have.
//
// Run it with:
//   node --env-file=.env.local scripts/import-prontera-gap-items.mjs [--dry]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const IN = path.join(process.cwd(), 'data', 'raw', 'prontera-gap-items.json');

// Their category words mapped onto ours, same spirit as import-rozerodb-items.ts:
// a category we already have gets folded in, one we have never seen is kept
// as itself so it shows up in the filter rather than vanishing into "Other".
const CATEGORY = {
  Consumable: 'Consumable / Recovery',
  Costume: 'Costume Equipment',
  // Shield is a body slot, not its own top-level category on our site --
  // it goes in Armor with weapon_type carrying the slot, exactly how the
  // Shield rows we already have are stored (checked 14 Sep 2026: an
  // existing row named plain "Shield" has category Armor, weapon_type
  // Shield).
  Shield: 'Armor',
};

// Their site left these three without a category at all. Two are plainly
// boxes by name; the third is a quest item that is neither, so it goes in
// "Other" instead of being guessed into a box category it is not.
const NAME_FALLBACK_CATEGORY = [
  { test: /box/i, category: 'Package/Box' },
  { test: /.*/, category: 'Other' },
];

function categoryFor(item) {
  if (item.category) return CATEGORY[item.category] ?? item.category;
  return NAME_FALLBACK_CATEGORY.find((rule) => rule.test.test(item.name)).category;
}

function toItemRow(item) {
  const category = categoryFor(item);
  return {
    id: item.id,
    name_en: item.name,
    name_th: null,
    category,
    weapon_type: item.category === 'Shield' ? 'Shield' : null,
    atk: null,
    required_level: item.requiredLevel,
    weapon_level: null,
    equippable_classes: [],
    buy_price: item.buy,
    sell_price: item.sell,
    icon_url: null,
    description: item.description,
  };
}

async function main() {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('run with: node --env-file=.env.local scripts/import-prontera-gap-items.mjs');
  if (!fs.existsSync(IN)) throw new Error(`${IN} not found -- run fetch-prontera-gap-items.mjs first`);

  const fetched = JSON.parse(fs.readFileSync(IN, 'utf8'));
  const db = createClient(url, key);

  const ids = fetched.map((i) => i.id);
  const { data: existingRows, error: existErr } = await db.from('items').select('id').in('id', ids);
  if (existErr) throw existErr;
  const existing = new Set((existingRows ?? []).map((r) => r.id));

  const fresh = fetched.filter((i) => !existing.has(i.id));
  const rows = fresh.map(toItemRow);

  const byCategory = {};
  for (const row of rows) byCategory[row.category] = (byCategory[row.category] ?? 0) + 1;

  console.log(`${fetched.length} fetched · ${fetched.length - fresh.length} already in the table · ${rows.length} to insert`);
  for (const [c, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} ${c}`);

  if (dry) {
    console.log('\n--dry: nothing written');
    console.log(JSON.stringify(rows.slice(0, 3), null, 1));
    return;
  }

  const { error } = await db.from('items').insert(rows);
  if (error) throw new Error(`insert failed: ${error.message}`);

  const { count } = await db.from('items').select('id', { count: 'exact', head: true });
  console.log(`items table now holds ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

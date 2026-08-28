// Imports the items fetched by scripts/fetch-rozerodb-items.ts.
//
// Insert-only. It never overwrites a row we already have: our own rows carry
// mirrored icons, Thai descriptions, and equippable_classes that their pages do
// not publish, and a blind upsert would blank all three. If an id is already in
// the table it is skipped and counted.
//
// Run it with:
//   npx tsx scripts/import-rozerodb-items.ts [--dry]
// Needs SUPABASE_SERVICE_ROLE_KEY exported.

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { FetchedItem } from './fetch-rozerodb-items';

const IN = path.join(process.cwd(), 'data', 'raw', 'rozerodb-items.json');
const CHUNK = 500;

/**
 * Their category words mapped onto the ones already in our table, so the
 * category filter on /database/items keeps working instead of growing a second
 * set of near-duplicate options.
 *
 * Anything not listed here is left as they wrote it rather than forced into
 * "Other" -- a category we have never seen should show up in the filter as
 * itself so it gets noticed, not be quietly absorbed.
 */
const CATEGORY: Record<string, string> = {
  Consumable: 'Consumable / Recovery',
  ETC: 'Other',
  Other: 'Other',
  Weapon: 'Weapon',
  Armor: 'Armor',
  Card: 'Card',
  Pet: 'Pet',
  // They write "Costume" where our table already says "Costume Equipment".
  // Two spellings of one category would split the filter in half.
  Costume: 'Costume Equipment',
  // Enchantment, Enchant Stone and Special are categories our own source never
  // had at all. They are deliberately NOT folded into "Other": a category we
  // have never seen should appear in the filter as itself so somebody notices
  // it, rather than being absorbed into the bucket nobody browses.
};

export interface ItemRow {
  id: number;
  name_en: string;
  name_th: string | null;
  category: string | null;
  weapon_type: string | null;
  atk: number | null;
  required_level: number | null;
  weapon_level: number | null;
  equippable_classes: string[];
  buy_price: number | null;
  sell_price: number | null;
  icon_url: string | null;
  description: string | null;
}

export function toItemRow(item: FetchedItem): ItemRow {
  return {
    id: item.id,
    name_en: item.name,
    // Their pages are English only. Null means "not translated yet", which is
    // what the Thai translation tooling already reads it as.
    name_th: null,
    category: CATEGORY[item.category] ?? item.category,
    // Only a weapon's slot/type is a weapon type. An armour's is a body slot
    // and a card's is where it may be socketed, and calling either a weapon
    // type would put "Upper Head" in the weapon filter.
    weapon_type: item.category === 'Weapon' ? item.slotType : null,
    atk: item.category === 'Weapon' ? item.atk : null,
    required_level: item.requiredLevel,
    // Their pages do not publish a weapon level, and it decides which refine
    // table applies. Guessing it would feed a wrong ore and fee into the refine
    // calculator, so it stays null.
    weapon_level: null,
    // Not published either. An empty list already means "unknown" everywhere
    // this column is read.
    equippable_classes: [],
    buy_price: item.buy,
    sell_price: item.sell,
    // Icons are mirrored locally for the items we already had. Pointing at
    // someone else's server for the new ones would hotlink their images, so
    // these have none until they are mirrored.
    icon_url: null,
    description: item.description,
  };
}

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  if (!fs.existsSync(IN)) throw new Error(`${IN} not found -- run fetch-rozerodb-items.ts first`);

  const fetched = JSON.parse(fs.readFileSync(IN, 'utf8')) as FetchedItem[];
  const db = createClient(url, key);

  const existing = new Set<number>();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await db.from('items').select('id').order('id').range(offset, offset + 999);
    if (error) throw error;
    for (const row of data ?? []) existing.add(row.id);
    if ((data ?? []).length < 1000) break;
  }

  const fresh = fetched.filter((i) => !existing.has(i.id));
  const skipped = fetched.length - fresh.length;
  const rows = fresh.map(toItemRow);

  const byCategory: Record<string, number> = {};
  for (const row of rows) byCategory[row.category ?? '(none)'] = (byCategory[row.category ?? '(none)'] ?? 0) + 1;

  console.log(`${fetched.length} fetched · ${skipped} already in the table · ${rows.length} to insert`);
  for (const [c, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(5)} ${c}`);

  const unknown = [...new Set(fresh.map((i) => i.category).filter((c) => !(c in CATEGORY)))];
  if (unknown.length > 0) console.log(`category words we have no mapping for, kept as-is: ${unknown.join(', ')}`);

  if (dry) {
    console.log('\n--dry: nothing written');
    console.log(JSON.stringify(rows.slice(0, 3), null, 1));
    return;
  }

  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await db.from('items').insert(chunk);
    if (error) throw new Error(`insert failed at row ${i}: ${error.message}`);
    console.log(`  inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}`);
  }

  const { count } = await db.from('items').select('id', { count: 'exact', head: true });
  console.log(`items table now holds ${count}`);
}

if (process.argv[1]?.includes('import-rozerodb-items')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

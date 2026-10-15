// One-off (owner, 15 Oct 2026): re-file items our client import left under
// "Other" using rozerodb's category for the same id, and replace the item
// names still in Chinese with rozerodb's English. Ids only -- no item is
// added, and nothing moves between the URL groups (equipment, costumes,
// cards stay where they are; only /database/items rows change), so no URL
// changes.
//
// Input: the listing rozerodb shows on /items, /equipment and /cards, read as
// normal pages on 15 Oct 2026 (no /api/), saved as JSON rows
// { kind, id, name, tags } -- pass its path.
//
//   set -a; . ./.env.local; set +a
//   npx tsx scripts/refile-item-categories.mts <theirs.json>          (dry run)
//   npx tsx scripts/refile-item-categories.mts <theirs.json> --write
//
// Mapping, chosen to fit our own categories rather than copy theirs:
//   Material -> Material, Package/Box -> Package/Box, Pet Equipment -> Pet,
//   and their Enchant Stone (essences,
//   "AGI +3 LUK -3") -> Enchantment, which is where our other stat enchants
//   already are. Only rows we file as "Other" move, plus Consumable rows they
//   call Package/Box. ETC, Collectible and their Consumable stay as they are:
//   their Consumable takes in reward boxes and coins, ours means potions and food.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const [file, flag] = process.argv.slice(2);
if (!file) throw new Error('usage: refile-item-categories.mts <theirs.json> [--write]');
const write = flag === '--write';
const theirs = JSON.parse(readFileSync(file, 'utf8')) as { kind: string; id: number | null; name: string; tags?: string[] }[];
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });

const ours = new Map<number, { id: number; name_en: string; category: string | null }>();
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from('items').select('id, name_en, category').order('id').range(from, from + 999);
  if (error) throw error;
  for (const r of data ?? []) ours.set(r.id, r);
  if (!data || data.length < 1000) break;
}

const TO: Record<string, string> = {
  Material: 'Material',
  'Package/Box': 'Package/Box',
  'Pet Equipment': 'Pet',
  'Enchant Stone': 'Enchantment',
};
const moves: { id: number; name: string; from: string; to: string }[] = [];
const renames: { id: number; from: string; to: string }[] = [];
const chinese = /[㐀-鿿]/;
for (const t of theirs) {
  if (t.id === null) continue;
  const o = ours.get(t.id);
  if (!o) continue;
  if (o.name_en && chinese.test(o.name_en) && t.name && !chinese.test(t.name)) renames.push({ id: o.id, from: o.name_en, to: t.name });
  if (t.kind !== 'items') continue;
  const tag = (t.tags ?? []).find((x) => TO[x]);
  if (!tag) continue;
  const to = TO[tag];
  const movable = o.category === 'Other' || (o.category === 'Consumable / Recovery' && to === 'Package/Box');
  if (movable && o.category !== to) moves.push({ id: o.id, name: o.name_en, from: o.category ?? '', to });
}

const tally: Record<string, number> = {};
for (const m of moves) tally[`${m.from} -> ${m.to}`] = (tally[`${m.from} -> ${m.to}`] ?? 0) + 1;
console.log(write ? 'WRITE' : 'DRY RUN', `${moves.length} moves, ${renames.length} renames`);
console.log(tally);
for (const to of new Set(moves.map((m) => m.to))) {
  console.log(`  e.g. -> ${to}:`, moves.filter((m) => m.to === to).slice(0, process.env.ALL ? 999 : 6).map((m) => `${m.id} ${m.name}`).join(' | '));
}
for (const r of renames) console.log(`  rename ${r.id}: ${r.from} -> ${r.to}`);

if (write) {
  for (const to of new Set(moves.map((m) => m.to))) {
    const ids = moves.filter((m) => m.to === to).map((m) => m.id);
    const { error } = await db.from('items').update({ category: to }).in('id', ids);
    if (error) throw error;
  }
  for (const r of renames) {
    const { error } = await db.from('items').update({ name_en: r.to }).eq('id', r.id);
    if (error) throw error;
  }
  console.log('written');
}

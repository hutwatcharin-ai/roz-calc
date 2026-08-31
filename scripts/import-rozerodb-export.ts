// Imports the rozerodb-export JSONL files into the live tables.
//
// Chunk A of the export work (approved 31 Aug): enrich items with equipment
// stats -- above all weapon_level, which decides which refine table applies and
// was deliberately left null when no source published it -- plus card effects,
// new equipment rows, and the drop lists that make item pages worth indexing.
//
// Rules, same as every import here:
//   - existing rows: fill NULL fields only; never overwrite a value we have
//     (our rows carry mirrored icons and Thai text their pages do not)
//   - new rows: insert
//   - drops: insert only pairs we do not have; a monster name that does not
//     resolve is counted and reported, never guessed
//   - pages without an item id (241 cash-shop costumes) are counted and skipped
//   - --dry prints everything and writes nothing
//
// Run:  npx tsx scripts/import-rozerodb-export.ts [--dry]
// Needs NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY exported.
// The skills part needs the description/requires columns; see the ALTER in
// docs/rozerodb-export/README or run scripts/migrate via the management API.

import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import {
  normalizeMonsterName,
  parseCard,
  parseDrops,
  parseEquipment,
  parseSkill,
  type ParsedDrop,
} from './rozerodb-export-parse';
import { parseItemPage } from './fetch-rozerodb-items';

const BASE = 'docs/rozerodb-export/data/';
const CHUNK = 400;

function lines(file: string): { slug: string; text?: string }[] {
  return fs
    .readFileSync(BASE + file, 'utf8')
    .trim()
    .split('\n')
    .map((l) => JSON.parse(l));
}

type ItemPatch = Record<string, unknown>;

async function main(): Promise<void> {
  const dry = process.argv.includes('--dry');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  // Ordered on a unique column: unstable order across pages silently drops and
  // duplicates rows, which bit this project on monster_spawns once already.
  async function all<T>(table: string, select: string, orderCol: string): Promise<T[]> {
    const out: T[] = [];
    for (let from = 0; ; from += 1000) {
      const { data, error } = await db.from(table).select(select).order(orderCol).range(from, from + 999);
      if (error) throw new Error(`${table}: ${error.message}`);
      out.push(...((data ?? []) as T[]));
      if ((data ?? []).length < 1000) break;
    }
    return out;
  }

  // ---- current state ----
  const items = await all<Record<string, unknown> & { id: number }>(
    'items',
    'id, name_en, category, weapon_type, atk, required_level, weapon_level, buy_price, sell_price, description',
    'id',
  );
  const itemById = new Map(items.map((r) => [r.id, r]));

  const monsters = await all<{ id: number; name_en: string }>('monsters', 'id, name_en', 'id');
  const monsterByName = new Map(monsters.map((m) => [normalizeMonsterName(m.name_en), m.id]));

  const dropRows = await all<{ monster_id: number; item_id: number }>('monster_drops', 'monster_id, item_id', 'item_id');
  const dropPairs = new Set(dropRows.map((d) => `${d.monster_id}:${d.item_id}`));

  const skills = await all<{ slug: string; name: string }>('skills', 'slug, name', 'slug');
  const skillByName = new Map(skills.map((s) => [s.name.toLowerCase(), s.slug]));

  console.log(`current: ${items.length} items · ${monsters.length} monsters · ${dropRows.length} drops · ${skills.length} skills`);

  // ---- accumulate ----
  const updates = new Map<number, ItemPatch>(); // null-only fills, keyed by item id
  const inserts: ItemPatch[] = [];
  const newDrops: { monster_id: number; item_id: number; rate: number }[] = [];
  const unresolvedMonsters = new Map<string, number>();
  let noId = 0;
  let parseFails = 0;

  function fillNulls(id: number, source: Record<string, unknown>): void {
    const current = itemById.get(id);
    if (!current) return;
    const patch: ItemPatch = updates.get(id) ?? {};
    for (const [field, value] of Object.entries(source)) {
      if (value === null || value === undefined) continue;
      if (current[field] === null || current[field] === undefined) patch[field] = value;
    }
    if (Object.keys(patch).length > 0) updates.set(id, patch);
  }

  function collectDrops(itemId: number, drops: ParsedDrop[]): void {
    for (const drop of drops) {
      const monsterId = monsterByName.get(normalizeMonsterName(drop.monster));
      if (monsterId === undefined) {
        unresolvedMonsters.set(drop.monster, (unresolvedMonsters.get(drop.monster) ?? 0) + 1);
        continue;
      }
      const pairKey = `${monsterId}:${itemId}`;
      if (dropPairs.has(pairKey)) continue;
      dropPairs.add(pairKey);
      newDrops.push({ monster_id: monsterId, item_id: itemId, rate: drop.rate });
    }
  }

  // ---- equipment ----
  const EQUIP_CATEGORY = { Weapon: 'Weapon', Armor: 'Armor', Costume: 'Costume Equipment' } as const;
  for (const row of lines('equipment.jsonl')) {
    const text = row.text ?? '';
    if (!text.includes('← Equipment')) continue;
    const e = parseEquipment(text);
    if (!e) {
      if (/← Equipment [^#]+ (Costume|Type) /.test(text)) noId += 1;
      else parseFails += 1;
      continue;
    }
    // Their generic "Type Weapon" on headgear is not a weapon type; a weapon
    // type only means something on a Weapon.
    const weaponType = e.kind === 'Weapon' && e.weaponType && e.weaponType !== 'Weapon' ? e.weaponType : null;
    const fields = {
      weapon_type: weaponType,
      // Zero here is their placeholder, not a stat: headgear pages print
      // "ATK 0" and costume pages "Weapon level 0". A weapon level outside 1-4
      // has no refine table, and storing it would feed the refine calculator
      // a gear class that does not exist.
      atk: e.kind === 'Weapon' && e.atk !== null && e.atk > 0 ? e.atk : null,
      required_level: e.requiredLevel !== null && e.requiredLevel > 0 ? e.requiredLevel : null,
      weapon_level: e.weaponLevel !== null && e.weaponLevel >= 1 && e.weaponLevel <= 4 ? e.weaponLevel : null,
      buy_price: e.buy,
      sell_price: e.sell,
      description: e.description,
    };
    if (itemById.has(e.id)) fillNulls(e.id, fields);
    else {
      inserts.push({
        id: e.id,
        name_en: e.name,
        name_th: null,
        category: EQUIP_CATEGORY[e.kind],
        equippable_classes: [],
        icon_url: null,
        ...fields,
      });
      itemById.set(e.id, { id: e.id });
    }
    collectDrops(e.id, e.drops);
  }

  // ---- cards ----
  for (const row of lines('cards.jsonl')) {
    const text = row.text ?? '';
    if (!text.includes('← Card')) continue;
    const c = parseCard(text);
    if (!c) {
      parseFails += 1;
      continue;
    }
    const fields = { description: c.effect, buy_price: c.buy, sell_price: c.sell };
    if (itemById.has(c.id)) fillNulls(c.id, fields);
    else {
      inserts.push({
        id: c.id,
        name_en: c.name,
        name_th: null,
        category: 'Card',
        weapon_type: null,
        atk: null,
        required_level: null,
        weapon_level: null,
        equippable_classes: [],
        icon_url: null,
        ...fields,
      });
      itemById.set(c.id, { id: c.id });
    }
    collectDrops(c.id, c.drops);
  }

  // ---- plain items (same page shape as the live crawl) ----
  for (const row of lines('items.jsonl')) {
    const text = (row.text ?? '').replace(/\s+/g, ' ');
    if (!text.includes('← Item')) continue;
    const item = parseItemPage(text);
    if (!item) {
      parseFails += 1;
      continue;
    }
    if (itemById.has(item.id)) {
      fillNulls(item.id, { description: item.description, buy_price: item.buy, sell_price: item.sell });
    }
    // New plain items would have come from the live crawl already; if any id
    // is genuinely new it is inserted too.
    else {
      inserts.push({
        id: item.id,
        name_en: item.name,
        name_th: null,
        category: 'Other',
        weapon_type: null,
        atk: null,
        required_level: item.requiredLevel,
        weapon_level: null,
        equippable_classes: [],
        buy_price: item.buy,
        sell_price: item.sell,
        icon_url: null,
        description: item.description,
      });
      itemById.set(item.id, { id: item.id });
    }
    collectDrops(item.id, parseDrops(text));
  }

  // ---- skills ----
  const skillUpdates: { slug: string; patch: Record<string, string> }[] = [];
  let skillUnmatched = 0;
  for (const row of lines('player-skills.jsonl')) {
    const text = row.text ?? '';
    if (!text.includes('← Player Skill')) continue;
    const s = parseSkill(text);
    if (!s) continue;
    const slug = skillByName.get(s.name.toLowerCase());
    if (!slug) {
      skillUnmatched += 1;
      continue;
    }
    const patch: Record<string, string> = {};
    if (s.description) patch.description = s.description;
    if (s.requires) patch.requires = s.requires;
    if (Object.keys(patch).length > 0) skillUpdates.push({ slug, patch });
  }

  // ---- report ----
  console.log(`\nitem field fills (null-only): ${updates.size} rows`);
  console.log(`item inserts: ${inserts.length}`);
  console.log(`new drop rows: ${newDrops.length}`);
  console.log(`skill updates: ${skillUpdates.length} · their skills not in our table: ${skillUnmatched}`);
  console.log(`pages without an item id (cash-shop costumes), skipped: ${noId}`);
  console.log(`pages that failed to parse: ${parseFails}`);
  const topUnresolved = [...unresolvedMonsters.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  console.log(`unresolved monster names in drop lists: ${unresolvedMonsters.size} distinct`);
  for (const [name, count] of topUnresolved) console.log(`   ${count}x ${name}`);

  if (dry) {
    const sample = [...updates.entries()].slice(0, 3);
    console.log('\n--dry: nothing written. sample fills:', JSON.stringify(sample, null, 1).slice(0, 600));
    return;
  }

  // ---- write ----
  let done = 0;
  for (const [id, patch] of updates) {
    const { error } = await db.from('items').update(patch).eq('id', id);
    if (error) throw new Error(`update item ${id}: ${error.message}`);
    done += 1;
    if (done % 500 === 0) console.log(`  fills ${done}/${updates.size}`);
  }
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const { error } = await db.from('items').insert(inserts.slice(i, i + CHUNK));
    if (error) throw new Error(`insert items at ${i}: ${error.message}`);
  }
  for (let i = 0; i < newDrops.length; i += CHUNK) {
    const { error } = await db.from('monster_drops').insert(newDrops.slice(i, i + CHUNK));
    if (error) throw new Error(`insert drops at ${i}: ${error.message}`);
  }
  for (const { slug, patch } of skillUpdates) {
    const { error } = await db.from('skills').update(patch).eq('slug', slug);
    if (error) throw new Error(`update skill ${slug}: ${error.message}`);
  }

  const { count } = await db.from('items').select('id', { count: 'exact', head: true });
  const { count: dropCount } = await db.from('monster_drops').select('monster_id', { count: 'exact', head: true });
  console.log(`\ndone. items table: ${count} · drops table: ${dropCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

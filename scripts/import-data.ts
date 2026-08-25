import { readFileSync } from 'node:fs';
import { supabaseAdmin } from '../lib/supabase';
import { transformMonster, transformItem, transformDrops, transformSpawns } from './transform';

function loadJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

async function importMonstersAndItems() {
  const db = supabaseAdmin();
  const monstersRaw = loadJson('data/raw/monsters.json').monsters;
  const itemsRaw = loadJson('data/raw/items.json').items;

  console.log(`Importing ${itemsRaw.length} items...`);
  const itemRows = itemsRaw.map(transformItem);
  const { error: itemsError } = await db.from('items').upsert(itemRows);
  if (itemsError) {
    throw new Error(`Failed to import items, aborting (no partial overwrite): ${itemsError.message}`);
  }

  console.log(`Importing ${monstersRaw.length} monsters...`);
  const monsterRows = monstersRaw.map(transformMonster);
  const { error: monstersError } = await db.from('monsters').upsert(monsterRows);
  if (monstersError) {
    throw new Error(`Failed to import monsters, aborting: ${monstersError.message}`);
  }

  const dropRows = monstersRaw.flatMap(transformDrops);
  const spawnRows = monstersRaw.flatMap(transformSpawns);

  console.log(`Importing ${dropRows.length} drop rows...`);
  const { error: dropsError } = await db.from('monster_drops').upsert(dropRows, { onConflict: 'monster_id,item_id' });
  if (dropsError) {
    throw new Error(`Failed to import monster_drops: ${dropsError.message}`);
  }

  console.log(`Importing ${spawnRows.length} spawn rows...`);
  const { error: spawnsError } = await db.from('monster_spawns').insert(spawnRows);
  if (spawnsError) {
    throw new Error(`Failed to import monster_spawns: ${spawnsError.message}`);
  }

  console.log('Monsters and items import complete.');
}

importMonstersAndItems().catch((err) => {
  console.error(err);
  process.exit(1);
});

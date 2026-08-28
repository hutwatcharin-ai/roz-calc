import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { supabaseAdmin } from '../lib/supabase';
import { transformMonster, transformItem, transformDrops, transformSpawns, transformSkill, transformMonsterSkills } from './transform';
import { missingImages, withServableImages } from './monster-images';

function loadJson(path: string): any {
  return JSON.parse(readFileSync(path, 'utf-8'));
}

// Only paths this site serves from /public are ours to vouch for; an absolute
// URL to somewhere else is left alone.
function servedFileExists(publicPath: string): boolean {
  if (!publicPath.startsWith('/')) return true;
  return existsSync(join(process.cwd(), 'public', publicPath));
}

// Supabase rejects or silently truncates very large single requests. Every
// import upsert goes through here so row count never becomes a hidden cap.
const UPSERT_CHUNK = 500;

async function upsertInChunks(
  db: ReturnType<typeof supabaseAdmin>,
  table: string,
  rows: any[],
  options?: { onConflict: string },
) {
  for (let i = 0; i < rows.length; i += UPSERT_CHUNK) {
    const chunk = rows.slice(i, i + UPSERT_CHUNK);
    const { error } = await db.from(table).upsert(chunk, options);
    if (error) {
      throw new Error(
        `Failed to import ${table} rows ${i}-${i + chunk.length - 1}, aborting: ${error.message}`,
      );
    }
  }
}

async function importMonstersAndItems() {
  const db = supabaseAdmin();
  const monstersRaw = loadJson('data/raw/monsters.json').monsters;
  const itemsRaw = loadJson('data/raw/items.json').items;

  console.log(`Importing ${itemsRaw.length} items...`);
  const itemRows = itemsRaw.map(transformItem);
  await upsertInChunks(db, 'items', itemRows);

  console.log(`Importing ${monstersRaw.length} monsters...`);
  // The feed names an image for every monster; two of them were never mirrored,
  // so storing the URL put a broken-image icon on every surface those monsters
  // appear on and nothing reported it. A URL to a file we do not serve is worse
  // than no URL, and re-running the import must not put it back.
  const transformed = monstersRaw.map(transformMonster);
  const dropped = missingImages(transformed, servedFileExists);
  if (dropped.length > 0) {
    console.log(`  ${dropped.length} monsters name an image this checkout does not serve:`);
    for (const row of dropped) console.log(`    ${row.id}  ${row.name_en}  ${row.image_url}`);
  }
  const monsterRows = withServableImages(transformed, servedFileExists);
  await upsertInChunks(db, 'monsters', monsterRows);

  const dropRows = monstersRaw.flatMap(transformDrops);
  const spawnRows = monstersRaw.flatMap(transformSpawns);

  const rawDropCount = monstersRaw.reduce(
    (sum: number, m: any) => sum + (m.ragnarokZero.drops?.length ?? 0),
    0,
  );
  const skippedDropCount = rawDropCount - dropRows.length;
  if (skippedDropCount > 0) {
    console.log(`Skipped ${skippedDropCount} drop rows with unparseable rate`);
  }

  console.log(`Importing ${dropRows.length} drop rows...`);
  await upsertInChunks(db, 'monster_drops', dropRows, { onConflict: 'monster_id,item_id' });

  console.log(`Importing ${spawnRows.length} spawn rows...`);
  await upsertInChunks(db, 'monster_spawns', spawnRows, { onConflict: 'monster_id,map_code' });

  const monsterSkillRows = monstersRaw.flatMap(transformMonsterSkills);
  console.log(`Importing ${monsterSkillRows.length} monster skill rows...`);
  await upsertInChunks(db, 'monster_skills', monsterSkillRows, {
    onConflict: 'monster_id,entry_index',
  });

  console.log('Monsters and items import complete.');
}

async function importSkills() {
  const db = supabaseAdmin();
  const skillsRaw = loadJson('data/raw/skills.json');
  console.log(`Importing ${skillsRaw.length} skills...`);
  const skillRows = skillsRaw.map(transformSkill);
  const { error } = await db.from('skills').upsert(skillRows);
  if (error) {
    throw new Error(`Failed to import skills: ${error.message}`);
  }
  console.log('Skills import complete.');
}

async function main() {
  await importMonstersAndItems();
  await importSkills();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

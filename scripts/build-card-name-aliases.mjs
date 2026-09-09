// Lets a card's name find the monster that drops it.
//
// Found on 9 Sep 2026: 43 cards carry a name that appears nowhere on the
// monster they drop from. Somebody hunting a Zealotus Card searches
// "Zealotus" and gets nothing, because the monster is filed as Zherlthsh.
// Same for Evil Nymph (Wicked Nymph), Mi Gao (Increase Soil), Golden Thief
// Bug (Golden Bug) and thirty-five more.
//
// This is not a claim that the card name is another name for the monster --
// often it is not, and Baphomet Jr. Card dropping from Baphomet is a case
// where the two are plainly different creatures. It is the narrower, checkable
// claim that the card with this name comes off this monster, which is a row in
// our own monster_drops table.
//
// A pair is kept only when all three hold, so nothing ambiguous gets in:
//
//   1. the card's name is not already a monster's name -- otherwise the alias
//      would pull a search away from a monster that legitimately owns the word
//   2. the card has exactly one dropper (Challenge clones excluded), so family
//      cards like Andre, which drops off Andre, Deniro and Piere, are skipped
//   3. searching the card's name does not already reach the monster; the site
//      matches word by word, so "Male ThiefBug" would need a rule but
//      "Poring Egg" would not
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-card-name-aliases.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const OUT = path.join(process.cwd(), 'data', 'card-name-aliases.json');
const PAGE = 1000;

const squash = (s) => (s ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function readAll(db, table, columns) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from(table).select(columns).order('id').range(from, from + PAGE - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE) break;
  }
  return rows;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first');
  const db = createClient(url, key);

  const [cards, monsters, drops] = await Promise.all([
    readAll(db, 'items', 'id, name_en').then((rows) => rows),
    readAll(db, 'monsters', 'id, name_en'),
    readAll(db, 'monster_drops', 'id, item_id, monster_id'),
  ]);
  const { data: cardRows, error } = await db.from('items').select('id, name_en').eq('category', 'Card');
  if (error) throw error;

  const cardName = new Map(cardRows.map((c) => [c.id, c.name_en]));
  const monsterName = new Map(monsters.map((m) => [m.id, m.name_en]));
  const monsterNames = new Set(monsters.map((m) => squash(m.name_en)));

  const droppers = new Map();
  for (const d of drops) {
    const name = monsterName.get(d.monster_id);
    if (!cardName.has(d.item_id) || !name || /^C\d /.test(name)) continue;
    const set = droppers.get(d.item_id) ?? new Set();
    set.add(d.monster_id);
    droppers.set(d.item_id, set);
  }

  const aliases = [];
  const skipped = { familyCard: 0, nameIsAMonster: 0, alreadyFound: 0 };
  for (const [id, set] of droppers) {
    const name = cardName.get(id);
    if (!name.endsWith(' Card')) continue;
    const alias = name.slice(0, -5);
    if (monsterNames.has(squash(alias))) { skipped.nameIsAMonster += 1; continue; }
    if (set.size !== 1) { skipped.familyCard += 1; continue; }
    const monster = [...set][0];
    const target = monsterName.get(monster);
    // The site's search ANDs one condition per word, so a card name whose
    // every word already appears in the monster's name needs no help.
    if (alias.toLowerCase().split(/\s+/).every((w) => target.toLowerCase().includes(w))) {
      skipped.alreadyFound += 1;
      continue;
    }
    aliases.push({ alias, monster, monsterName: target, card: id, cardName: name });
  }
  aliases.sort((a, b) => a.alias.localeCompare(b.alias));

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        _meta: {
          what: 'ชื่อการ์ดที่ใช้ค้นหามอนตัวที่ดรอปการ์ดใบนั้นได้',
          why: 'การ์ดหลายใบชื่อไม่มีคำไหนตรงกับมอนที่ดรอปมันเลย พิมพ์ "Zealotus" จึงไม่เจอ Zherlthsh',
          claim: 'ไม่ได้แปลว่าการ์ดชื่อนี้คือชื่ออีกชื่อของมอน แต่แปลว่าการ์ดชื่อนี้ดรอปจากมอนตัวนี้ ซึ่งเป็นแถวใน monster_drops ของเราเอง',
          rule: 'เก็บเฉพาะคู่ที่ชื่อการ์ดไม่ซ้ำกับชื่อมอนตัวใด และการ์ดมีมอนดรอปตัวเดียว และค้นด้วยชื่อการ์ดแล้วยังไม่เจอ',
          regenerate: 'node scripts/build-card-name-aliases.mjs',
          generatedAt: new Date().toISOString(),
        },
        aliases,
      },
      null,
      1,
    ),
  );
  console.log(
    `${aliases.length} คู่ -> ${path.relative(process.cwd(), OUT)}\n` +
      `  ข้าม: การ์ดตระกูล ${skipped.familyCard} · ชื่อชนกับมอน ${skipped.nameIsAMonster} · ค้นเจออยู่แล้ว ${skipped.alreadyFound}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

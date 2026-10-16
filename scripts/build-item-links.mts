// Builds data/item-links.json, two things the thin item pages lacked
// (owner, 16 Oct 2026, AdSense low-value round 3):
//
//   families -- items that are levels of one thing ("STR +1" .. "STR +10",
//   "Dishes Lv.1" .. "Lv.9", "Insight Lv.1" .. "Lv.6"). Each level had its own
//   page holding one line of text; now the lowest id holds the whole ladder
//   and the others redirect to it. Same name once the level is cut off, same
//   category, and only on the plain item route (gear, costumes and cards
//   keep their own pages).
//
//   mentions -- the items an item's own game text names: what a box holds,
//   what a package gives, what a scroll needs. Read off the live client's
//   Thai text (data/game-items.json), which writes item names in English,
//   matched longest name first so "Blue Potion (Bound)" is not read as
//   "Blue Potion". `box` marks the items whose text says it holds or gives
//   them, so the other side can say "comes in this box".
//
//   set -a; . ./.env.local; set +a
//   npx tsx scripts/build-item-links.mts
import { readFileSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
const game = JSON.parse(readFileSync('data/game-items.json', 'utf8')).items as Record<string, { name: string; desc: string | string[] }>;

const rows: { id: number; name_en: string; category: string | null }[] = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await db.from('items').select('id, name_en, category').order('id').range(from, from + 999);
  if (error) throw error;
  rows.push(...(data ?? []));
  if (!data || data.length < 1000) break;
}
const inGame = rows.filter((r) => game[r.id]);
const ITEM_ROUTE = (c: string | null) => !['Weapon', 'Armor', 'Costume Equipment', 'Card'].includes(c ?? '');

// ---- families
const LEVEL = /\s*(?:Lv\.?\s*(\d+)|\+(\d+)%?)\s*$/i;
const familyKey = (name: string) => {
  const m = name.trim().match(LEVEL);
  return m ? { base: name.trim().replace(LEVEL, '').trim(), level: Number(m[1] ?? m[2]) } : null;
};
const groups = new Map<string, { id: number; level: number; name: string }[]>();
for (const r of inGame) {
  if (!ITEM_ROUTE(r.category)) continue;
  const k = familyKey(r.name_en);
  if (!k || !k.base) continue;
  const key = `${r.category}|${k.base}`;
  groups.set(key, [...(groups.get(key) ?? []), { id: r.id, level: k.level, name: r.name_en }]);
}
const families: Record<string, { name: string; members: number[] }> = {};
const headOf: Record<number, number> = {};
for (const [key, list] of groups) {
  // A family has distinct levels; two items at one level are not a ladder.
  if (list.length < 2 || new Set(list.map((m) => m.level)).size !== list.length) continue;
  list.sort((a, b) => a.level - b.level || a.id - b.id);
  const head = Math.min(...list.map((m) => m.id));
  families[head] = { name: key.split('|')[1], members: list.map((m) => m.id) };
  for (const m of list) if (m.id !== head) headOf[m.id] = head;
}

// ---- mentions
// Names that are also words the text uses for something else: a weapon type
// ("ประเภท : Sword"), a stat line ("INT +3"). Matching them linked every
// sword to an item called Sword.
const NOT_A_MENTION = new Set([
  'Sword', 'Armor', 'Shield', 'Critical', 'Spear', 'Arrow', 'Dagger', 'Staff', 'Bow', 'Mace', 'Axe', 'Book', 'Katar',
  'Knuckle', 'Whip', 'Garment', 'Shoes', 'Accessory', 'Potion', 'Card', 'Costume', 'Headgear', 'Weapon', 'Rod',
  'Stone', 'Flower', 'Chain', 'Guard', 'Shell', 'Spike', 'Cloak', 'Boots',
  'Two-Handed Sword', 'Two-Handed Axe', 'Two-Handed Spear', 'One-Handed Sword', 'Musical Instrument', 'Instrument',
]);
const byName = new Map<string, number>();
for (const r of inGame) {
  const n = r.name_en.trim();
  if (n.length < 5 || NOT_A_MENTION.has(n) || /[+-]\s*\d/.test(n) || byName.has(n)) continue;
  byName.set(n, r.id);
}
const names = [...byName.keys()].sort((a, b) => b.length - a.length);
const BOXY = /บรรจุ|สุ่มได้รับ|ประกอบด้วย|เลือกรับ|ภายในกล่อง|จะได้รับ/;
const mentions: Record<number, { ids: number[]; box: boolean }> = {};
for (const r of inGame) {
  const raw = game[r.id].desc;
  // Joined with a space: the client wraps lines mid-name ("Blue Potion" /
  // "(Bound) 10 ชิ้น"), and a newline there would match the wrong item.
  let text = (Array.isArray(raw) ? raw.join(' ') : raw ?? '').replace(/\^[0-9a-fA-F]{6}/g, '').replace(/\s+/g, ' ');
  const box = r.category === 'Package/Box' || BOXY.test(text);
  // Listed in the order the text names them, as the box lists its goods.
  const found: { id: number; at: number }[] = [];
  for (const n of names) {
    if (n === r.name_en.trim() || !text.includes(n)) continue;
    const id = byName.get(n)!;
    if (!found.some((f) => f.id === id)) found.push({ id, at: text.indexOf(n) });
    text = text.split(n).join(' '.repeat(n.length));
  }
  if (found.length) mentions[r.id] = { ids: found.sort((a, b) => a.at - b.at).map((f) => f.id), box };
}

writeFileSync(
  'data/item-links.json',
  JSON.stringify({
    _meta: {
      what: 'Item families folded into one page, and the items each item text names (scripts/build-item-links.mts).',
      built: new Date().toISOString().slice(0, 10),
      families: Object.keys(families).length,
      folded: Object.keys(headOf).length,
      withMentions: Object.keys(mentions).length,
    },
    families,
    mentions,
  }) + '\n',
);
// The redirect map on its own: lib/item-href reads it in the browser too, so
// it must not pull the mentions along.
writeFileSync('data/item-family-heads.json', JSON.stringify(headOf) + '\n');
console.log('families', Object.keys(families).length, 'folded pages', Object.keys(headOf).length, 'items with mentions', Object.keys(mentions).length);

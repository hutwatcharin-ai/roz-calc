// Weight of every item the client describes, for /tools/weight (owner, 12 Oct
// 2026: "how much can I carry, what do the things I pick weigh, how much is
// left"). Read from the "น้ำหนัก : N" line of the client's Thai item text
// (data/game-items.json, System/iteminfo_thTH.lub), which is the number the
// game shows: a Red Potion 7, a Two-Handed Axe 250. Costumes and items whose
// text has no weight line are left out rather than guessed.
//
// Run:  node scripts/build-item-weights.mjs
// Writes data/item-weights.json.

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const src = JSON.parse(fs.readFileSync(path.join(root, 'data', 'game-items.json'), 'utf8'));

export function weightOf(desc) {
  const text = (desc ?? []).join(' ').replace(/\^[0-9A-Fa-f]{6}/g, '');
  const m = /น้ำหนัก\s*:\s*([\d.]+)/.exec(text);
  return m ? Number(m[1]) : null;
}

const items = [];
for (const [id, it] of Object.entries(src.items)) {
  if (it.costume) continue;
  const w = weightOf(it.desc);
  if (w === null || !Number.isFinite(w)) continue;
  items.push([Number(id), it.name, w]);
}
items.sort((a, b) => a[0] - b[0]);

fs.writeFileSync(
  path.join(root, 'data', 'item-weights.json'),
  JSON.stringify({
    _meta: { how: 'node scripts/build-item-weights.mjs', source: `data/game-items.json (${src._meta?.source ?? 'client'}, built ${src._meta?.built ?? '?'})`, row: '[id, name, weight as the game shows it]' },
    items,
  }),
);
console.log(`${items.length} items with a weight`);

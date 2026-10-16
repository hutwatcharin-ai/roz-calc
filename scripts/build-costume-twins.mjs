// Builds data/costume-twins.json: each (Bound) costume that has a free twin
// of the same name, mapped to that twin.
//
// The two are the same look -- same sprite, same text but for "cannot be
// traded" -- so the site keeps one page per look (owner, 16 Oct 2026, after
// AdSense turned the site down for low-value content: 578 of 1,163 costume
// pages were near-copies of another). The Bound id redirects to the free
// one, and the free page carries what is Bound-only, mainly who drops it.
//
// Source: data/game-items.json (the live client), which holds only items
// that are in the game. When a name has two free ids, the higher id wins
// (the Zero re-id; the lower one is the classic copy).
//
// Run: node scripts/build-costume-twins.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'game-items.json'), 'utf8')).items;
const BOUND = /\s*[([]Bound[)\]]\s*$/i;

const free = new Map();
const bound = [];
for (const [id, item] of Object.entries(items)) {
  if (!item.costume) continue;
  const name = item.name.trim();
  if (BOUND.test(name)) bound.push([Number(id), name.replace(BOUND, '').trim()]);
  else if (!free.has(name) || Number(id) > free.get(name)) free.set(name, Number(id));
}

const pairs = {};
for (const [id, name] of bound.sort((a, b) => a[0] - b[0])) {
  if (free.has(name)) pairs[id] = free.get(name);
}

fs.writeFileSync(
  path.join(ROOT, 'data', 'costume-twins.json'),
  JSON.stringify(
    {
      _meta: {
        what: 'Bound costume id -> the free costume with the same look. The Bound page redirects there (scripts/build-costume-twins.mjs).',
        built: new Date().toISOString().slice(0, 10),
        pairs: Object.keys(pairs).length,
        boundWithoutTwin: bound.length - Object.keys(pairs).length,
      },
      pairs,
    },
    null,
    0,
  ) + '\n',
);
console.log('pairs', Object.keys(pairs).length, 'bound without a free twin', bound.length - Object.keys(pairs).length);

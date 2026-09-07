// Proposes new Thai aliases from what people actually searched.
//
// Search Console records the query AND the page Google chose for it. When
// the query contains Thai and the page is an entity page, that pair is
// evidence that Thai word refers to that monster or item -- คาราเมล to
// Caramel, หมาฟ้า ("blue dog") to Wolf. This reads the last 90 days and
// prints the pairs that are not already in data/aliases-th.json.
//
// It PROPOSES only. Nothing is written: a nickname can be ambiguous (หมาฟ้า
// matched three Wolf pages at once), and one wrong entry would put a wrong
// name in a title. A human copies the ones that are right into the file,
// keeping the query and impressions alongside so the claim stays checkable.
//
// Run:  python scripts/gsc-thai-queries.py | node scripts/mine-thai-aliases.mjs
// or:   node scripts/mine-thai-aliases.mjs path/to/queries.json
//
// The JSON it expects is Search Console's own rows: [{ keys: [query, page],
// impressions, position }, ...].

import fs from 'node:fs';
import path from 'node:path';

const THAI = /[฀-๿]/;
const ENTITY = /\/database\/(monsters|items|equipment|costumes|cards)\/(\d+)/;
// Words that describe the site or a section rather than one thing.
const GENERIC = /ข้อมูล|ฐานข้อมูล|ทั้งหมด|อาชีพ|เผ่า|ขนาด|ธาตุ|การ์ด ragnarok|ro zero/i;
// The question wrapped around a name: "milk ro ซื้อที่ไหน" is a question
// about Milk, not a Thai name for it.
const QUESTION = /(ซื้อ|ขาย|อยู่|หา|ดรอป|เก็บ|ฟาร์ม|ตี|ใช้)?\s*(ที่ไหน|แม\s*พ\s*ไหน|ยังไง|อะไร|เท่าไร|กี่)/g;

function readInput() {
  const arg = process.argv[2];
  if (arg) return JSON.parse(fs.readFileSync(arg, 'utf8'));
  const stdin = fs.readFileSync(0, 'utf8').trim();
  if (!stdin) throw new Error('no input: pass a JSON file or pipe Search Console rows in');
  return JSON.parse(stdin);
}

function main() {
  const rows = readInput();
  const file = path.join(process.cwd(), 'data', 'aliases-th.json');
  const known = JSON.parse(fs.readFileSync(file, 'utf8'));

  const seen = new Set();
  for (const kind of ['monsters', 'items']) {
    for (const [id, list] of Object.entries(known[kind])) {
      for (const a of list) seen.add(`${kind}:${id}:${a.name}`);
    }
  }

  // One query can match several pages (a nickname that fits three Wolves);
  // group so a human sees the ambiguity instead of one arbitrary winner.
  const byQuery = new Map();
  for (const row of rows) {
    const [query, page] = row.keys ?? [];
    if (!query || !page || !THAI.test(query)) continue;
    const m = ENTITY.exec(page);
    if (!m) continue;
    const kind = m[1] === 'monsters' ? 'monsters' : 'items';
    const id = m[2];
    // Strip the " ro" / " ragnarok" people append to every game search.
    const name = query
      .replace(QUESTION, ' ')
      .replace(/(ro zero|rozero|ragnarok|ro)/gi, ' ')
      // Latin letters left over belong to the English name, not a Thai one.
      .replace(/[a-z0-9]+/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!name || !THAI.test(name) || GENERIC.test(name)) continue;
    // "หมาฟ้า" and "หมา ฟ้า" are the same word typed two ways.
    const tight = name.replace(/\s+/g, '');
    if (seen.has(`${kind}:${id}:${name}`) || seen.has(`${kind}:${id}:${tight}`)) continue;
    const key = `${tight}|${kind}`;
    const entry = byQuery.get(key) ?? { name: tight, kind, hits: [] };
    entry.hits.push({ id, query, impressions: row.impressions, position: row.position });
    byQuery.set(key, entry);
  }

  const proposals = [...byQuery.values()].sort(
    (a, b) =>
      b.hits.reduce((n, h) => n + h.impressions, 0) - a.hits.reduce((n, h) => n + h.impressions, 0),
  );

  if (proposals.length === 0) {
    console.log('no new Thai aliases in this window');
    return;
  }
  console.log(`${proposals.length} candidate names. Confirm each before adding to data/aliases-th.json:\n`);
  for (const p of proposals) {
    const flag = p.hits.length > 1 ? '  <-- matched several pages, pick one' : '';
    console.log(`${p.name}  (${p.kind})${flag}`);
    for (const h of p.hits.sort((a, b) => a.position - b.position)) {
      console.log(`    id ${h.id}  ${h.impressions} imp  pos ${h.position.toFixed(1)}  "${h.query}"`);
    }
    console.log('');
  }
}

main();

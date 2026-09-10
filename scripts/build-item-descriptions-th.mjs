// Thai item descriptions, taken from a Thai RO client's own item table.
//
// The site had 4,867 items with a description and Thai for 58 of them. The
// rest read in English on a Thai site, and the hand-built dictionary
// (item_description_lines) can only grow one line at a time.
//
// Source: System/itemInfo_true.lub from a Thai client (Eternal RO, path given
// by the site owner on 10 Sep 2026). The file is plain Lua, not compiled, and
// its description strings are TIS-620/cp874 Thai -- Gravity's own Thai
// localisation, which is why "Yellow Potion" reads
// "น้ำยาสำหรับฟื้น HP ประมาณ 175" and our English row says "Recovers about 175 HP".
//
// The honest problem with that source: it is not this game's client. Its item
// table is a different edition -- 1,569 of the ids we share carry a different
// display name there -- so a description could describe a different version of
// the same item. Nothing is copied on faith:
//
//   1. only items our table has, and only where we have no Thai at all;
//   2. every number in our English description must appear in the Thai, and
//      every number in the Thai (weight line dropped -- we print weight from
//      our own column) must appear in our English. A rebalanced potion, a
//      different duration or a different chance fails this and is skipped.
//
// What is deliberately NOT taken: the display names. Zero has its own.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-item-descriptions-th.mjs [--client PATH]

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_CLIENT = 'D:/EternalROClient140869/System/itemInfo_true.lub';
const DEST = path.join(process.cwd(), 'data', 'item-descriptions-th.json');

const argv = process.argv.slice(2);
const clientAt = argv.indexOf('--client');
const CLIENT = clientAt === -1 ? DEFAULT_CLIENT : argv[clientAt + 1];

const THAI = /[\u0E00-\u0E7F]/;
/**
 * Categories this will not touch.
 *
 * Gear and costume descriptions in that client are stat blocks -- "\u0E1B\u0E23\u0E30\u0E40\u0E20\u0E17 :
 * Axe / \u0E1E\u0E25\u0E31\u0E07\u0E42\u0E08\u0E21\u0E15\u0E35 : 80 / Lv \u0E02\u0E2D\u0E07\u0E2D\u0E32\u0E27\u0E38\u0E18 : 1" -- numbers we cannot verify against a
 * different edition's item table, and numbers our own pages already print from
 * our own columns. Card effects have their own translated file
 * (data/card-effects-th.json) and must not be contradicted by a second one.
 */
const SKIP_CATEGORIES = new Set(['Weapon', 'Armor', 'Costume Equipment', 'Card']);
/**
 * Some entries carry Korean read through the Thai codepage -- "\u0E19\u0E3F\u0E20\u0E3A\u0E11\u0E19\u0E20\u0E2C\u0E26\u0E45\u0E26\u0E0E" is
 * what a Korean resource name looks like decoded as TIS-620. Every character
 * in it IS a Thai code point, so a range check passes it; what it has not got
 * is a single vowel or tone mark, which no line of real Thai lacks. Six Thai
 * letters and one of these is the test.
 */
const THAI_VOWEL = /[\u0E30\u0E31\u0E32\u0E33\u0E34\u0E35\u0E36\u0E37\u0E38\u0E39\u0E40\u0E41\u0E42\u0E43\u0E44\u0E48\u0E49\u0E4A\u0E4B\u0E47\u0E4C\u0E4D]/;
/**
 * A vowel test alone is not enough -- Korean bytes read as TIS-620 land on
 * tone marks too ("\u0E1B\u0E3A\u0E16\u0E4C\u0E12\u0E1F\u0E18\u0E0E\u0E11\u0E19\u0E1C\u0E56" passes it). Real prose also contains at least
 * one everyday word, and a mis-decoded resource name never does.
 */
const THAI_WORDS = /(\u0E17\u0E35\u0E48|\u0E43\u0E0A\u0E49|\u0E44\u0E14\u0E49|\u0E40\u0E1B\u0E47\u0E19|\u0E02\u0E2D\u0E07|\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A|\u0E08\u0E32\u0E01|\u0E41\u0E25\u0E30|\u0E44\u0E21\u0E48|\u0E43\u0E2B\u0E49|\u0E21\u0E35|\u0E17\u0E33|\u0E40\u0E1E\u0E34\u0E48\u0E21|\u0E1F\u0E37\u0E49\u0E19|\u0E2B\u0E23\u0E37\u0E2D|\u0E15\u0E31\u0E27|\u0E04\u0E19|\u0E40\u0E21\u0E37\u0E48\u0E2D|\u0E16\u0E49\u0E32|\u0E01\u0E31\u0E1A|\u0E43\u0E19|\u0E19\u0E35\u0E49|\u0E04\u0E27\u0E32\u0E21|\u0E2D\u0E32\u0E01\u0E32\u0E23|\u0E2A\u0E32\u0E21\u0E32\u0E23\u0E16|\u0E0A\u0E19\u0E34\u0E14|\u0E41\u0E1A\u0E1A)/;
function isThaiProse(line) {
  const thai = (line.match(/[\u0E00-\u0E7F]/g) ?? []).length;
  return thai >= 6 && THAI_VOWEL.test(line) && THAI_WORDS.test(line);
}
/** Colour codes the client puts around numbers: ^000088175^000000. */
const COLOUR = /\^[0-9a-fA-F]{6}/g;
const WEIGHT_LINE = /^น้ำหนัก\s*:/;

const numbersIn = (text) => (text.match(/\d+/g) ?? []).map(Number);

function parseClient(text) {
  const items = new Map();
  for (const match of text.matchAll(/\[(\d+)\]\s*=\s*\{([\s\S]*?)\n\t\},/g)) {
    const body = match[2];
    const block = /identifiedDescriptionName\s*=\s*\{([\s\S]*?)\n\t\t\}/.exec(body)?.[1] ?? '';
    const lines = [...block.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
      .map((line) => line[1].replace(COLOUR, '').replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (lines.some((line) => THAI.test(line))) items.set(Number(match[1]), lines);
  }
  return items;
}

async function fetchAll(db, table, columns) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from(table).select(columns).range(from, from + 999);
    if (error) throw error;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  if (!fs.existsSync(CLIENT)) throw new Error(`${CLIENT} is missing -- pass --client PATH`);
  const db = createClient(url, key);

  const client = parseClient(new TextDecoder('windows-874').decode(fs.readFileSync(CLIENT)));
  console.log(`${client.size} items carry a Thai description in the client table`);

  const items = await fetchAll(db, 'items', 'id, name_en, description, category');
  const dictRows = await fetchAll(db, 'item_description_lines', 'source_line');
  const translated = new Set(dictRows.map((row) => row.source_line));

  const out = {};
  const reasons = { noDescription: 0, alreadyThai: 0, categorySkipped: 0, notInClient: 0, unreadable: 0, numbersDisagree: 0 };
  const rejected = [];
  for (const item of items) {
    const source = (item.description ?? '')
      .split('\n')
      .map((line) => line.replace(COLOUR, '').trim())
      .filter(Boolean);
    if (source.length === 0) {
      reasons.noDescription += 1;
      continue;
    }
    // A line the dictionary already covers means this item is being translated
    // properly, line by line; leave it to that.
    if (source.some((line) => translated.has(line))) {
      reasons.alreadyThai += 1;
      continue;
    }
    if (SKIP_CATEGORIES.has(item.category ?? '')) {
      reasons.categorySkipped += 1;
      continue;
    }
    const theirs = client.get(item.id);
    if (!theirs) {
      reasons.notInClient += 1;
      continue;
    }
    // Thai prose only: the English lines in that file are the item's own name
    // repeated, which this page already shows, and the Korean-through-TIS-620
    // lines are noise.
    const effect = theirs.filter((line) => !WEIGHT_LINE.test(line) && isThaiProse(line));
    if (effect.length === 0) {
      reasons.unreadable += 1;
      continue;
    }
    const ourNumbers = new Set(numbersIn(source.join(' ')));
    const theirNumbers = new Set(numbersIn(effect.join(' ')));
    const agrees =
      [...ourNumbers].every((n) => theirNumbers.has(n)) && [...theirNumbers].every((n) => ourNumbers.has(n));
    if (!agrees) {
      reasons.numbersDisagree += 1;
      if (rejected.length < 10) {
        rejected.push(`${item.id} ${item.name_en}: ours ${[...ourNumbers].join(',') || 'none'} vs client ${[...theirNumbers].join(',') || 'none'}`);
      }
      continue;
    }
    out[item.id] = effect;
  }

  const ordered = Object.fromEntries(Object.keys(out).sort((a, b) => Number(a) - Number(b)).map((id) => [id, out[id]]));
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          built: new Date().toISOString().slice(0, 10),
          source: 'System/itemInfo_true.lub from a Thai RO client (Eternal RO)',
          how: 'node scripts/build-item-descriptions-th.mjs',
          gate: 'every number in our English description appears in the Thai and the other way round, weight line excluded',
          caveat:
            'Not this game\'s client. Only items whose numbers agree with our own English description are published, and display names are never taken from it.',
          itemsWithThaiInClient: client.size,
          published: Object.keys(ordered).length,
          skipped: reasons,
        },
        items: ordered,
      },
      null,
      2,
    )}\n`,
  );
  console.log(`published ${Object.keys(ordered).length} Thai descriptions`);
  console.log(`skipped: ${JSON.stringify(reasons)}`);
  console.log('rejected by the number gate, first few:');
  for (const line of rejected) console.log(`  ${line}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

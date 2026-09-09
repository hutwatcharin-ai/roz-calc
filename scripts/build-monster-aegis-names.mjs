// Pulls each monster's internal name out of the rozerodb export.
//
// Six names in our table belong to two monsters each -- Whisper, Poring,
// Picky, Petit, Baphomet, Thief Bug -- and that is not a mistake to fix: both
// sources print the same name for both ids, so the game itself ships two
// monsters called Whisper. What the game does have is a second name, the one
// in its own files: 1179 is WHISPER and 1185 is WHISPER_.
//
// rozerodb prints it on every monster page ("# 1185 · WHISPER_"), so this
// reads it from the local export rather than guessing from spelling. It is a
// fact about the client, which is the only kind of disambiguation worth
// showing a player who has two identical rows in front of them.
//
// Run:  node scripts/build-monster-aegis-names.mjs

import fs from 'node:fs';
import path from 'node:path';

const SOURCE = path.join(process.cwd(), 'docs', 'rozerodb-export', 'data', 'monsters.jsonl');
const DEST = path.join(process.cwd(), 'data', 'monster-aegis-names.json');

// "# 1185 · WHISPER_" -- the id and the internal name, as the page prints them.
const HEADING = /#\s*(\d+)\s*·\s*([A-Z0-9_]+)/;

function main() {
  const lines = fs.readFileSync(SOURCE, 'utf8').split('\n').filter(Boolean);
  const names = {};
  let missed = 0;

  for (const line of lines) {
    const row = JSON.parse(line);
    const text = (row.text ?? '').split(/\s+/).join(' ');
    const match = HEADING.exec(text);
    if (!match) {
      missed += 1;
      continue;
    }
    // The heading is the page's own <h1> area, so an id from the URL that
    // disagrees with it would mean the crawl saved the wrong page.
    const fromUrl = /\/monsters\/(\d+)/.exec(row.url ?? '');
    if (fromUrl && fromUrl[1] !== match[1]) {
      console.log(`  ${row.url}: heading says ${match[1]}, skipped`);
      continue;
    }
    names[match[1]] = match[2];
  }

  const sorted = Object.fromEntries(Object.keys(names).sort((a, b) => Number(a) - Number(b)).map((id) => [id, names[id]]));
  fs.writeFileSync(DEST, `${JSON.stringify(sorted, null, 2)}\n`);
  console.log(`${Object.keys(sorted).length} internal names written, ${missed} pages had no heading`);
}

main();

// Pictures for the shopkeepers, out of a client's own sprite files.
//
// The NPC pages show a sprite for 42 of 624 NPCs -- the ones a rozerodb page
// happened to cover. The 110 shopkeepers have none, and the reason was a
// missing link rather than a missing picture: rAthena's shop scripts give each
// NPC a numeric sprite id (54 distinct ones), and nothing we held turned that
// number into a file.
//
// A client GRF closes it in two steps:
//
//   npcidentity.lub  sprite id  -> JT_ constant   (5,751 of them)
//   data\sprite\npc\ constant   -> .spr file      (1,344 of them)
//
// All 54 ids our shops use resolve, and all 54 have a sprite. The .spr is
// decoded here (scripts/lib/spr.mjs) and written as a PNG with the sprite's
// own transparency, into public/images/npcs -- the folder the site already
// serves the rozerodb-mirrored sprites from.
//
// The picture is Gravity's art, like every other sprite on this site; the
// pages that show one credit where it came from.
//
// Run:  node scripts/extract-npc-sprites-from-grf.mjs [--client D:/Path/To/Client] [--dry-run]

import fs from 'node:fs';
import path from 'node:path';
import { Grf, GrfSet } from './lib/grf.mjs';
import { biggestFrame, decodeSpr, frameToRgba } from './lib/spr.mjs';
import { encodePng } from './lib/png.mjs';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const at = argv.indexOf(name);
  return at === -1 ? fallback : argv[at + 1];
};
const CLIENT = arg('--client', 'D:/EternalROClient140869');
const DRY = argv.includes('--dry-run');
const OUT = path.join(process.cwd(), 'public', 'images', 'npcs');
const SHOPS = path.join(process.cwd(), 'data', 'npc-shops.json');
const DEST = path.join(process.cwd(), 'data', 'npc-sprites.json');

function archives(clientDir) {
  return fs
    .readFileSync(path.join(clientDir, 'DATA.INI'), 'latin1')
    .split('\n')
    .map((line) => /^\s*\d+\s*=\s*(.+?)\s*$/.exec(line)?.[1])
    .filter(Boolean)
    .map((name) => path.join(clientDir, name))
    .filter((file) => fs.existsSync(file));
}

/** sprite id -> JT_ constant, from whichever archive ships it as plain Lua. */
function spriteConstants(files) {
  for (const file of files) {
    const grf = new Grf(file);
    const entry = grf.names().find((name) => name.toLowerCase().endsWith('datainfo\\npcidentity.lub'));
    if (!entry) continue;
    let text;
    try {
      text = grf.read(entry)?.toString('latin1') ?? '';
    } catch {
      continue;
    }
    // The base archive ships this compiled (it starts with the Lua bytecode
    // signature); a server's own patch archive usually ships the source.
    if (text.startsWith('\u001bLua')) continue;
    const byId = new Map();
    for (const match of text.matchAll(/JT_([A-Z0-9_]+)\s*=\s*(\d+)/g)) {
      const id = Number(match[2]);
      if (!byId.has(id)) byId.set(id, match[1]);
    }
    if (byId.size > 0) return { byId, from: path.basename(file) };
  }
  throw new Error('no readable npcidentity.lub in any archive');
}

function main() {
  const files = archives(CLIENT);
  const { byId, from } = spriteConstants(files);
  console.log(`${byId.size} sprite ids named, from ${from}`);

  const set = new GrfSet(files);
  const sprites = set.find((name) => /\\sprite\\npc\\.*\.spr$/i.test(name));
  const byFile = new Map(sprites.map((name) => [name.toLowerCase(), name]));
  console.log(`${sprites.length} NPC sprites in the archives`);

  const shops = JSON.parse(fs.readFileSync(SHOPS, 'utf8'));
  const wanted = [...new Set((shops.sellers ?? []).map((seller) => seller.sprite).filter(Number.isInteger))];
  console.log(`${wanted.length} sprite ids used by shop NPCs`);

  if (!DRY) fs.mkdirSync(OUT, { recursive: true });
  const written = {};
  const failed = [];
  for (const id of wanted) {
    const constant = byId.get(id);
    if (!constant) {
      failed.push(`${id}: no constant`);
      continue;
    }
    const key = [...byFile.keys()].find((name) => name.endsWith(`\\${constant.toLowerCase()}.spr`));
    if (!key) {
      failed.push(`${id} ${constant}: no sprite file`);
      continue;
    }
    let png;
    try {
      const sprite = decodeSpr(set.read(byFile.get(key)));
      const frame = biggestFrame(sprite);
      if (!frame || frame.width === 0 || frame.height === 0) throw new Error('no usable frame');
      png = encodePng(frameToRgba(frame, sprite.palette), frame.width, frame.height);
    } catch (error) {
      failed.push(`${id} ${constant}: ${error.message}`);
      continue;
    }
    const file = `${constant.toLowerCase()}.png`;
    if (!DRY) fs.writeFileSync(path.join(OUT, file), png);
    written[id] = constant.toLowerCase();
  }

  if (!DRY) {
    fs.writeFileSync(
      DEST,
      `${JSON.stringify(
        {
          _meta: {
            built: new Date().toISOString().slice(0, 10),
            source: `npcidentity.lub and data\\sprite\\npc from a client GRF (${path.basename(CLIENT)})`,
            how: 'node scripts/extract-npc-sprites-from-grf.mjs',
            note: 'Sprite id comes from rAthena\'s shop scripts; the picture is the client\'s own sprite for that id.',
            sprites: Object.keys(written).length,
          },
          bySpriteId: written,
        },
        null,
        2,
      )}\n`,
    );
  }
  console.log(`${Object.keys(written).length} sprites written${DRY ? ' (dry run, nothing saved)' : ` to ${OUT}`}`);
  if (failed.length) {
    console.log(`${failed.length} could not be done:`);
    for (const line of failed.slice(0, 10)) console.log(`  ${line}`);
  }
}

main();

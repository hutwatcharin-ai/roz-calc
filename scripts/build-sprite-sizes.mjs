// Writes data/monster-sprite-sizes.json: the pixel size of every mirrored
// monster sprite, keyed by file name ("1015.gif": [56, 89]).
//
// The monster page draws the sprite at a whole-number scale (1x, 2x, 3x) so
// the pixels stay square and nothing is squashed -- the old fixed 64x64 box
// bent every sprite that was not square (owner, 30 Sep 2026). Choosing the
// scale needs the size before the image loads, so it is read here once from
// the file headers: GIF stores width/height at bytes 6-9, PNG at 16-23.
//
// Run after adding sprites: node scripts/build-sprite-sizes.mjs

import fs from 'node:fs';
import path from 'node:path';

const dir = path.join(process.cwd(), 'public', 'images', 'monsters');
const out = {};
for (const name of fs.readdirSync(dir).sort()) {
  const buf = fs.readFileSync(path.join(dir, name));
  // By content, not extension: 1244.gif is a PNG.
  if (buf.toString('ascii', 0, 3) === 'GIF') {
    out[name] = [buf.readUInt16LE(6), buf.readUInt16LE(8)];
  } else if (buf.readUInt32BE(12) === 0x49484452) {
    out[name] = [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  }
}
fs.writeFileSync(path.join(process.cwd(), 'data', 'monster-sprite-sizes.json'), JSON.stringify(out) + '\n');
console.log(`${Object.keys(out).length} sprites`);

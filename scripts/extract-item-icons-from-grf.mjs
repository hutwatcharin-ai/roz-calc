// Item icons, taken out of a client's own GRF.
//
// 741 items on this site have no icon. The mirror script that fills them
// (scripts/mirror-prontera-icons.mjs) is out of sources: prontera.info knows
// 14 of the 741, and the same-name pass finds none, because the missing rows
// are [Event] and [NFS] variants whose names no icon-bearing row shares.
//
// A client GRF has every icon the game can draw, addressed by the item's
// resource name -- which the client's own item table carries. So the join is:
//
//   our item id -> itemInfo identifiedResourceName -> data\texture\...\item\<name>.bmp
//
// The resource name is Korean text in cp949. It is never decoded here: the
// file is read as latin1 so each byte survives, and GRF entry names are read
// the same way, so the lookup is byte for byte. Decoding and re-encoding
// through a codepage is exactly how this kind of join breaks.
//
// The bitmaps land in a temp directory; scripts/icons-bmp-to-gif.py converts
// them (magenta is the transparency colour RO uses) and drops them into
// public/images/items, which is what the site serves.
//
// Run:  node scripts/extract-item-icons-from-grf.mjs --client D:/Path/To/Client --out .tmp/icons
//       (then the python converter, then scripts/link-item-icons.mjs)

import fs from 'node:fs';
import path from 'node:path';
import { GrfSet } from './lib/grf.mjs';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const at = argv.indexOf(name);
  return at === -1 ? fallback : argv[at + 1];
};
const CLIENT = arg('--client', 'D:/EternalROClient140869');
const OUT = arg('--out', path.join(process.cwd(), '.tmp', 'icons'));
const IDS = arg('--ids', null); // a file of item ids, one per line

function grfFiles(clientDir) {
  const ini = path.join(clientDir, 'DATA.INI');
  if (!fs.existsSync(ini)) throw new Error(`${ini} is missing`);
  // DATA.INI lists the archives in priority order, which is the order a
  // client reads them: a patch archive overrides the base one.
  return fs
    .readFileSync(ini, 'latin1')
    .split('\n')
    .map((line) => /^\s*\d+\s*=\s*(.+?)\s*$/.exec(line)?.[1])
    .filter(Boolean)
    .map((name) => path.join(clientDir, name))
    .filter((file) => fs.existsSync(file));
}

/** id -> resource name, as raw bytes kept in a latin1 string. */
function resourceNames(clientDir) {
  const file = path.join(clientDir, 'System', 'itemInfo_true.lub');
  if (!fs.existsSync(file)) throw new Error(`${file} is missing`);
  const text = fs.readFileSync(file, 'latin1');
  const out = new Map();
  for (const match of text.matchAll(/\[(\d+)\]\s*=\s*\{([\s\S]*?)\n\t\},/g)) {
    const name = /identifiedResourceName\s*=\s*"([^"]*)"/.exec(match[2])?.[1];
    if (name) out.set(Number(match[1]), name);
  }
  return out;
}

function main() {
  const files = grfFiles(CLIENT);
  console.log(`reading ${files.length} archives: ${files.map((f) => path.basename(f)).join(', ')}`);
  const grf = new GrfSet(files);

  // The icon folder's name is Korean; take it from the archive rather than
  // spelling it out, so the bytes are the archive's own.
  const iconNames = grf.find((name) => /\\item\\.*\.bmp$/i.test(name));
  console.log(`${iconNames.length} item bitmaps in the archives`);
  const byLower = new Map(iconNames.map((name) => [name.toLowerCase(), name]));
  const prefix = iconNames[0].slice(0, iconNames[0].toLowerCase().lastIndexOf('\\item\\') + 6);

  const names = resourceNames(CLIENT);
  console.log(`${names.size} items in the client table carry a resource name`);

  const wanted = IDS
    ? fs.readFileSync(IDS, 'utf8').split('\n').map((line) => Number(line.trim())).filter(Boolean)
    : [...names.keys()];

  fs.mkdirSync(OUT, { recursive: true });
  let written = 0;
  const missing = [];
  for (const id of wanted) {
    const resource = names.get(id);
    if (!resource) {
      missing.push(`${id}: not in the client table`);
      continue;
    }
    const key = `${prefix}${resource}.bmp`.toLowerCase();
    const entry = byLower.get(key);
    if (!entry) {
      missing.push(`${id}: no bitmap for its resource name`);
      continue;
    }
    const data = grf.read(entry);
    if (!data) {
      missing.push(`${id}: entry could not be read`);
      continue;
    }
    fs.writeFileSync(path.join(OUT, `${id}.bmp`), data);
    written += 1;
  }
  console.log(`wrote ${written} bitmaps to ${OUT}`);
  const reasons = {};
  for (const line of missing) {
    const why = line.slice(line.indexOf(': ') + 2);
    reasons[why] = (reasons[why] ?? 0) + 1;
  }
  console.log(`${missing.length} could not be found: ${JSON.stringify(reasons)}`);
  for (const line of missing.slice(0, 10)) console.log(`  ${line}`);
}

main();

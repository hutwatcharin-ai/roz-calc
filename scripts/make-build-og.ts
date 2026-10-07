// The /tools/build page's own preview card (public/og-build.png): a sample
// build drawn by the same renderer as shared builds (lib/build-card), so a
// link to the tool shows what the tool makes. Rerun when the card changes:
//   npx tsx scripts/make-build-og.ts
import fs from 'fs';
import path from 'path';
import { buildCardPng } from '../lib/build-card';
import { sanitizeBuild } from '../lib/build-calc';

const sample = sanitizeBuild({
  cls: 'assassin', lv: 70, job: 50,
  st: { str: 60, agi: 80, vit: 25, int: 1, dex: 45, luk: 30 },
  g: {
    weapon: { id: 1201, r: 9, c: [4029, 4006, 0] },
    shield: { id: 1201, r: 7, c: [0, 0, 0] },
    head_upper: { id: 401510, r: 7, c: [0] },
    head_middle: { id: 2276, r: 0, c: [] },
    armor: { id: 2301, r: 7, c: [] },
    garment: { id: 480414, r: 7, c: [4183] },
  },
  f: [12065],
  sk: { Grimtooth: 5, 'Righthand Mastery': 5, 'Lefthand Mastery': 5 },
})!;

buildCardPng(sample, 'sample', 'rozerothai.com/tools/build').then((png) => {
  fs.writeFileSync(path.join(process.cwd(), 'public', 'og-build.png'), png);
  console.log('public/og-build.png', png.length, 'bytes');
});

// Job portraits for the class guides, from roz.prontera.info.
//
// Each job page's payload names its picture as /assets/<uuid>; the file is
// saved under public/images/jobs/<slug>.<ext> so the guide never hotlinks.
// Same source and same Gravity sprites as scripts/mirror-prontera-icons.mjs.
// robots.txt allows everything but /api/.
//
// Run: node scripts/mirror-job-images.mjs
import fs from 'node:fs';
import path from 'node:path';
import { resolveNuxtData } from './prontera-nuxt.mjs';

const DIR = path.join(process.cwd(), 'public', 'images', 'jobs');
const JOBS = [
  'swordsman', 'mage', 'archer', 'acolyte', 'thief', 'merchant',
  'knight', 'crusader', 'wizard', 'sage', 'hunter', 'bard', 'dancer',
  'priest', 'monk', 'assassin', 'rogue', 'blacksmith', 'alchemist',
];
const EXT = { 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp', 'image/jpeg': 'jpg' };

fs.mkdirSync(DIR, { recursive: true });
for (const slug of JOBS) {
  const html = await (await fetch(`https://roz.prontera.info/jobs/${slug}`)).text();
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html);
  const image = m && resolveNuxtData(JSON.parse(m[1])).data[`job-${slug}`]?.job?.image;
  if (!image) { console.log(`${slug}: no image`); continue; }
  const res = await fetch(`https://roz.prontera.info${image}`);
  const ext = EXT[(res.headers.get('content-type') ?? '').split(';')[0]];
  if (!res.ok || !ext) { console.log(`${slug}: ${res.status} ${res.headers.get('content-type')}`); continue; }
  const bytes = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(path.join(DIR, `${slug}.${ext}`), bytes);
  console.log(`${slug}: ${ext} ${bytes.length} bytes`);
  await new Promise((r) => setTimeout(r, 300));
}

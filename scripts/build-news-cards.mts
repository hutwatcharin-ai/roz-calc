// Draws each news page's share picture (lib/news-card) into
// app/news/<slug>/opengraph-image.png, which Next serves as that page's
// og:image. Run after adding a row to lib/news:
//
//   npx tsx scripts/build-news-cards.mts [--only <slug>]
//
// Rows that point into another page (a '#' anchor) share that page's card,
// so only the first row for each folder is drawn.

import fs from 'fs';
import path from 'path';
import { NEWS } from '@/lib/news';
import { newsCardSvg, type NewsCardExtra } from '@/lib/news-card';
import { svgToPng } from '@/lib/build-card';

// Patches carry no cast in lib/news; their headline monsters go on the card.
const EXTRA: Record<string, NewsCardExtra> = {
  // Orc Lord, Dracula, Osiris (Doppelganger, the fourth, does not fit).
  'patch-2026-09-17': {
    cast: ['/images/monsters/1190.gif', '/images/monsters/1389.gif', '/images/monsters/1038.gif'],
    blurb: 'MVP Orc Lord, Osiris, Dracula, Doppelganger · ช่องตัวละครที่ 6',
  },
  'patch-2026-09-03': { blurb: 'Episode 1-2 · Orc Underground Caverns · Comodo Luanda · Memorial Dungeon 2 แห่ง' },
  // MVP Raid Amon Ra and Baphomet, the GM event's Marc.
  'patch-2026-10-15': { cast: ['/images/monsters/1511.gif', '/images/monsters/1039.gif', '/images/monsters/1045.gif'] },
  'events-2026-11': { blurb: 'Gatchaman ถึง 26 พ.ย. · EXP x2 ทุกเสาร์อาทิตย์ · คอสตูมผี' },
  // Clock Tower monsters: Clock, Alarm, Rideword.
  'patch-2026-10-29': { blurb: 'ปิดปรับปรุง 29 ต.ค. 08:00–14:00 น. · ดันใหม่ เควสรายวัน อุปกรณ์ใหม่ 12 ชิ้น', cast: ['/images/monsters/1269.gif', '/images/monsters/1193.gif', '/images/monsters/1195.gif'] },
};

const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const done = new Set<string>();
for (const item of NEWS) {
  if (item.href.includes('#')) continue;
  const slug = item.href.replace(/^\/news\//, '');
  if (done.has(slug) || (only && slug !== only)) continue;
  done.add(slug);
  const dir = path.join(process.cwd(), 'app/news', slug);
  if (!fs.existsSync(dir)) {
    console.warn(`skip ${slug}: no page folder`);
    continue;
  }
  const png = await svgToPng(newsCardSvg(item, EXTRA[slug]));
  fs.writeFileSync(path.join(dir, 'opengraph-image.png'), png);
  console.log(`${slug}: ${(png.length / 1024).toFixed(0)} kB`);
}

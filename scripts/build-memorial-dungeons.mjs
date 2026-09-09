// Pulls the six memorial-dungeon walkthroughs out of the mirrored guide.
//
// Every one of these is prose, not a table, so this reads the shapes the
// author writes consistently: the required base level, whether it is a party
// instance, and a monster list where each entry is "Nom français (English
// Name) Niveau N · HP X".
//
// The English names are what matter, and checking them turned up something.
// The monsters inside these instances are almost all instance-only variants
// -- Cannibal Deniro, Deepsea Merman, Sewer Thief Bug, Stormy Wraith,
// Fortified Poring, Fallen Orc Hero, Shaman's Flower -- and our monsters
// table has none of them. The one name that does match, Orc Skeleton, has
// different stats inside the instance (level 60 and 4,458 HP against our
// level 53 and 3,376), so it is a reinforced copy rather than the same row.
//
// So nothing here links to a monster page: there is nothing to link to. That
// is a gap in our data, recorded rather than hidden, and the page says so.
//
// Run:  node scripts/build-memorial-dungeons.mjs

import fs from 'node:fs';
import path from 'node:path';

const PAGES = path.join(process.cwd(), 'docs', 'rozglobal-export', 'pages');
const OUT = path.join(process.cwd(), 'data', 'memorial-dungeons.json');

// slug -> the name this site uses, and the map it sits on where we know it.
const DUNGEONS = [
  { file: 'donjon-poring-village.html', name: 'Poring Village', th: 'หมู่บ้านโพริง' },
  { file: 'donjon-orcs-memory.html', name: "Orc's Memory", th: 'ความทรงจำออร์ค' },
  { file: 'donjon-prontera-culvert.html', name: 'Prontera Culvert', th: 'ท่อ Prontera' },
  { file: 'donjon-ant-hell-1f.html', name: 'Ant Hell 1F', th: 'รังมด 1F' },
  { file: 'donjon-izlude-2f.html', name: 'Izlude 2F', th: 'Izlude 2F' },
  { file: 'donjon-sunken-ship.html', name: 'Sunken Ship', th: 'เรือจม' },
];

function plainText(html) {
  const body = html.slice(html.indexOf('<h1'));
  const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è' };
  return body
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&([a-z]+);/gi, (all, n) => named[n.toLowerCase()] ?? all)
    .replace(/\s+/g, ' ')
    .trim();
}

const dungeons = DUNGEONS.map(({ file, name, th }) => {
  const text = plainText(fs.readFileSync(path.join(PAGES, file), 'utf-8'));
  // Poring Village is the one written as a band -- "entre 30 et 60" -- so a
  // single number would have quietly dropped it.
  const band = /Niveau de base requis\s*:\s*entre\s*(\d+)\s*et\s*(\d+)/.exec(text);
  const level = band ? null : /Niveau de base requis\s*:\s*(\d+)/.exec(text);
  const navi = /\/navi\s+(\S+)\s+(\d+)\/(\d+)/.exec(text);
  const monsters = [...text.matchAll(/\(([A-Z][A-Za-z' -]+)\)\s*Niveau\s*(\d+)\s*·\s*HP\s*([\d\s]+)/g)].map((m) => ({
    name: m[1].trim(),
    level: Number(m[2]),
    hp: Number(m[3].replace(/\s/g, '')),
  }));
  return {
    name,
    th,
    level: level ? Number(level[1]) : band ? Number(band[1]) : null,
    levelMax: band ? Number(band[2]) : null,
    map: navi?.[1] ?? null,
    x: navi ? Number(navi[2]) : null,
    y: navi ? Number(navi[3]) : null,
    party: /uniquement en groupe/.test(text),
    // "réinitialisé chaque jour à 4h du matin"
    dailyReset: /réinitialis\w*\s+chaque\s+jour/.test(text),
    monsters,
  };
});

fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      _meta: {
        what: 'ดันเจี้ยนความทรงจำ 6 แห่ง: เลเวลที่เข้าได้ เข้าเดี่ยว/กลุ่ม และมอนในนั้น',
        source: 'roz-global.info (docs/rozglobal-export, ดึง 8 ก.ย. 2026)',
        gap: 'มอนในดันเจี้ยนพวกนี้เกือบทั้งหมดเป็นตัวเฉพาะอินสแตนซ์ และไม่มีในตาราง monsters ของเราเลย จึงลิงก์ไปหน้ามอนไม่ได้ · ชื่อเดียวที่ตรงคือ Orc Skeleton แต่ค่าสถานะในอินสแตนซ์ไม่เท่ากับตัวปกติ (lv60 HP4,458 เทียบกับของเรา lv53 HP3,376) แปลว่าเป็นคนละตัว',
        regenerate: 'node scripts/build-memorial-dungeons.mjs',
        generatedAt: new Date().toISOString(),
      },
      dungeons,
    },
    null,
    1,
  ),
);
const total = dungeons.reduce((n, d) => n + d.monsters.length, 0);
console.log(`${dungeons.length} ดันเจี้ยน · มอนรวม ${total}`);
for (const d of dungeons) {
  const lv = d.levelMax ? `${d.level}-${d.levelMax}` : String(d.level ?? '?');
  console.log(`  ${d.name.padEnd(20)} lv${lv.padEnd(6)} ${d.party ? 'กลุ่ม' : '?'} · มอน ${d.monsters.length} · navi ${d.map ?? '—'}`);
}

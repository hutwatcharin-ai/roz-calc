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

// "Squelette orc (Orc Skeleton) Niveau 60 · HP 4 458 DEF 82 / MDEF 10 ·
//  Moyenne Mort-vivant · Mort-vivant LV1 EXP 627 / JEXP 562"
//
// The shape is not constant, which one regex kept getting wrong. Poring
// Village writes no race at all -- "Petite Terre LV1" is size and element --
// and a pattern with an optional race in the middle happily read Terre as the
// race and left the element empty. So the line is cut into pieces first and
// the middle is classified by looking words up, which cannot mistake an
// element for a race.
// One regex only finds where each monster starts; the rest of its line is
// whatever sits before the next one begins. Trying to express the whole line
// in a single pattern failed twice -- a lazy tail matched nothing because
// everything after it was optional, and a greedy one swallowed the EXP.
const MONSTER_START = /\(([A-Z][A-Za-z' -]+)\)\s*Niveau\s*(\d+)\s*·\s*HP\s*([\d\s]+)/g;

function readMonsters(text) {
  const starts = [...text.matchAll(MONSTER_START)];
  return starts.map((m, i) => {
    const line = text.slice(m.index + m[0].length, starts[i + 1]?.index ?? m.index + m[0].length + 220);
    const def = /DEF\s*(\d+)\s*\/\s*MDEF\s*(\d+)/.exec(line);
    const exp = /EXP\s*([\d\s]+?)\s*\/\s*JEXP\s*([\d\s]+)/.exec(line);
    // Between the MDEF and the EXP sits some subset of size, race, element.
    const tailFrom = def ? def.index + def[0].length : 0;
    const tailTo = exp ? exp.index : line.length;
    return {
      name: m[1].trim(),
      level: Number(m[2]),
      hp: Number(m[3].replace(/\s/g, '')),
      def: def ? Number(def[1]) : null,
      mdef: def ? Number(def[2]) : null,
      ...classifyTail(line.slice(tailFrom, Math.max(tailFrom, tailTo))),
      // "EXP n.c." is the guide saying it does not know, which is not zero.
      baseExp: exp ? Number(exp[1].replace(/\s/g, '')) : null,
      jobExp: exp ? Number(exp[2].replace(/\s/g, '')) : null,
    };
  });
}

const SIZE_TH = { Petite: 'เล็ก', Moyenne: 'กลาง', Grande: 'ใหญ่' };
const RACE_TH = {
  'Mort-vivant': 'อันเดด', Brute: 'สัตว์', Insecte: 'แมลง', Plante: 'พืช', Poisson: 'ปลา',
  'Démon': 'ปีศาจ', Ange: 'เทวดา', Dragon: 'มังกร',
  // The guide writes two of these more than one way.
  'Demi-humain': 'กึ่งมนุษย์', 'Semi-humain': 'กึ่งมนุษย์',
  Amorphe: 'ไร้รูปร่าง', Informe: 'ไร้รูปร่าง',
};
const ELEMENT_TH = {
  Vent: 'ลม', Eau: 'น้ำ', Terre: 'ดิน', Feu: 'ไฟ',
  Poison: 'พิษ', 'Sacré': 'ศักดิ์สิทธิ์', Ombre: 'มืด', 'Fantôme': 'ผี', Neutre: 'ไร้ธาตุ',
  // Undead is both a race and an element, and the guide uses the same word
  // for both. Which one it is comes from where it sits, not from the word.
  'Mort-vivant': 'อันเดด',
};

/**
 * The middle of the line: some subset of size, race, element and element
 * level, in that order, with any of them missing.
 *
 * Read left to right so position decides the ambiguous case: the first
 * "Mort-vivant" is the race, the one before LVn is the element.
 */
function classifyTail(tail) {
  const out = { size: null, race: null, element: null, elementLevel: null };
  const lv = /LV\s*(\d)/.exec(tail);
  if (lv) out.elementLevel = Number(lv[1]);
  const words = tail
    .replace(/LV\s*\d/g, ' ')
    .split(/[·\s]+/)
    .map((w) => w.trim())
    .filter(Boolean);
  // Two-word names ("Mort-vivant" survives the split, "Demi humain" would
  // not) are already hyphenated upstream, so single tokens are enough.
  for (const word of words) {
    if (out.size === null && SIZE_TH[word]) { out.size = SIZE_TH[word]; continue; }
    if (out.race === null && RACE_TH[word]) { out.race = RACE_TH[word]; continue; }
    if (out.element === null && ELEMENT_TH[word]) { out.element = ELEMENT_TH[word]; continue; }
  }
  // "Petite Terre LV1": no race written, and an element must not be left
  // sitting in the race slot just because it came first.
  if (out.element === null && out.race !== null && !RACE_TH[words.find((w) => RACE_TH[w]) ?? ''] === false) {
    const raceWord = words.find((w) => RACE_TH[w]);
    if (raceWord && ELEMENT_TH[raceWord] && !words.some((w) => w !== raceWord && ELEMENT_TH[w])) {
      out.element = ELEMENT_TH[raceWord];
      out.race = null;
    }
  }
  return out;
}

// What the end-of-run chests give.
//
// The section is prose, not a list, and splitting it produced fragments like
// "Émeraude maudite (fabrique la" -- a cross-reference sentence cut in half.
// So it is scanned for known names instead: a small closed lexicon that
// repeats across all six pages, every entry checked against our items table
// (21 matched by name; "Elunium brut" and "Oridecon brut" are the Ore rows).
// A reward the lexicon does not know is simply not listed, which is a
// shorter list rather than a wrong one.
const REWARD_ITEMS = [
  ["Boucles d'oreilles d'Opale scintillante", 'Shimmering Opal Earrings'],
  ["Boucle d'oreille d'Émeraude maudite", 'Cursed Emerald Earring'],
  ["Armure de l'escouade de répression", "Subjugation Team's Armor"],
  ["Baudrier de l'escouade de répression", "Subjugation Team's Shoulder Belt"],
  ["Bottes de l'escouade de répression", 'Subjugation Team Boots'],
  ["Bague de l'escouade de répression", "Subjugation Team's Ring"],
  ['Boîte de fragments de Jellopy', 'Jellopy Fragment Box'],
  ['Anneau du Serment bleu', 'Ring of Blue Oath'],
  ['Anneau du Serment rouge', 'Red Oath Ring'],
  ['Cristal scintillant', 'Faintly Glowing Crystal'],
  ['Cristal azur', 'Crystal of Blue Light'],
  ['Émeraude maudite', 'Cursed Emerald'],
  ['Opale brillante', 'Shimmering Opal'],
  ['Saphir marin', 'Sapphire of the Blue Sea'],
  ['Rubis ensanglanté', 'Ruby Soaked in Blood'],
  ['Minerai de Mithril', 'Mithril Ore'],
  ['Elunium brut', 'Elunium Ore'],
  ['Oridecon brut', 'Oridecon Ore'],
  ['Vent de Verdure', 'Wind of Verdure'],
  ['Sang rouge', 'Red Blood'],
  ['Vie verte', 'Green Live'],
  ['Elunium', 'Elunium'],
  ['Oridecon', 'Oridecon'],
];

function rewardsIn(segment) {
  const found = [];
  let rest = segment;
  // Longest first, and each match is cut out, so "Elunium brut" is claimed
  // before the bare "Elunium" can take half of it.
  for (const [fr, en] of REWARD_ITEMS) {
    if (!rest.includes(fr)) continue;
    found.push(en);
    rest = rest.split(fr).join(' ');
  }
  return found;
}

// Poring Village has no Normal/Hard split: its chests give two headgears
// unique to it, named in the guide with the English in brackets the way the
// monster lines are. Both are in our items table (Poring Village Carrot,
// Poring Village Green Onion -- the guide calls the second one Leek).
// The guide calls this one a Leek; our table (and the client) call it a
// Green Onion. Checked by hand, they are the same headgear.
const REWARD_ALIAS = { 'Poring Village Leek': 'Poring Village Green Onion' };

function bracketedRewards(text) {
  const at = text.indexOf('récompenses des coffres', 900);
  if (at === -1) return [];
  const block = text.slice(at, at + 900);
  return [...block.matchAll(/\(([A-Z][A-Za-z' -]{3,40})\)/g)].map((m) => {
    const name = m[1].trim();
    return REWARD_ALIAS[name] ?? name;
  });
}

function chestRewards(text) {
  const normalAt = text.indexOf('Mode Normal');
  if (normalAt === -1) return { normal: bracketedRewards(text), hard: [], note: null };
  const endAt = text.indexOf('À lire aussi', normalAt);
  const block = text.slice(normalAt, endAt === -1 ? undefined : endAt);
  const hardAt = block.indexOf('Mode Difficile');
  return {
    normal: rewardsIn(hardAt === -1 ? block : block.slice(0, hardAt)),
    hard: hardAt === -1 ? [] : rewardsIn(block.slice(hardAt)),
    note: null,
  };
}

const dungeons = DUNGEONS.map(({ file, name, th }) => {
  const text = plainText(fs.readFileSync(path.join(PAGES, file), 'utf-8'));
  // Poring Village is the one written as a band -- "entre 30 et 60" -- so a
  // single number would have quietly dropped it.
  const band = /Niveau de base requis\s*:\s*entre\s*(\d+)\s*et\s*(\d+)/.exec(text);
  const level = band ? null : /Niveau de base requis\s*:\s*(\d+)/.exec(text);
  const navi = /\/navi\s+(\S+)\s+(\d+)\/(\d+)/.exec(text);
  const monsters = readMonsters(text);
  const rewards = chestRewards(text);
  return {
    name,
    th,
    level: level ? Number(level[1]) : band ? Number(band[1]) : null,
    levelMax: band ? Number(band[2]) : null,
    map: navi?.[1] ?? null,
    x: navi ? Number(navi[2]) : null,
    y: navi ? Number(navi[3]) : null,
    rewards,
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

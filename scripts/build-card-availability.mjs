// Works out which cards are actually in the game yet.
//
// Our items table holds every card the client ships, released or not, and the
// site has been listing all 315 of them as if a player could go and get one.
// 64 of them cannot be got: they belong to content that has not opened on the
// Global server.
//
// Two independent sources say so and this script only keeps what both of them
// support:
//
//   roz-global.info's card pages carry a "Disponibilité" column -- "Disponible"
//   or "Indisponible (JAN 2027)" (mirrored 8 Sep 2026, 267 cards).
//   rozerodb's card pages carry an "UPCOMING · JAN 2027" banner (crawled 31
//   Aug 2026, 262 cards).
//
// They overlap on 246 cards and disagree on none of them, which is what makes
// this worth publishing. Where only one source covers a card, that is recorded
// too, and the page says how many sources back the row.
//
// The dates are the patch a card arrives with, as each source prints it. They
// are plans, not promises, and the page says so.
//
// Run:  node scripts/build-card-availability.mjs

import fs from 'node:fs';
import path from 'node:path';

const GUIDE_TABLES = path.join(process.cwd(), 'docs', 'rozglobal-export', 'tables.json');
const ROZERODB_CARDS = path.join(process.cwd(), 'docs', 'rozerodb-export', 'data', 'cards.jsonl');
const DEST = path.join(process.cwd(), 'data', 'card-availability.json');

const squash = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

/** "OCT 2026" -> a sortable key, so the page can order by when a card lands. */
const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

function guideRows() {
  const tables = JSON.parse(fs.readFileSync(GUIDE_TABLES, 'utf8'))['cartes-equipement.html'];
  const out = new Map();
  for (const table of tables) {
    for (const row of table.rows.slice(1)) {
      // "Bébé Orc (Orc Baby) ⭐" -- the English name is the one in brackets,
      // and it is the one our items table uses.
      const bracketed = /\(([^)]+)\)/.exec(row[0]);
      const name = (bracketed ? bracketed[1] : row[0]).replace('⭐', '').trim();
      const available = row[2].startsWith('Disponible');
      const when = /Indisponible \(([^)]+)\)/.exec(row[2]);
      out.set(squash(name), {
        available,
        when: available || !when || when[1] === 'date inconnue' ? null : when[1].toUpperCase(),
      });
    }
  }
  return out;
}

function rozerodbRows() {
  const out = new Map();
  for (const line of fs.readFileSync(ROZERODB_CARDS, 'utf8').split('\n').filter(Boolean)) {
    const row = JSON.parse(line);
    // Only per-card pages: the listing page carries the banner of whichever
    // card it happens to mention first.
    if (!/\/cards\/[a-z0-9-]+$/.test(row.url ?? '')) continue;
    const name = (row.title ?? '').split(' - ')[0].replace(/\bCard\b/, '').trim();
    const text = (row.text ?? '').split(/\s+/).join(' ');
    const upcoming = /UPCOMING\s*·\s*([A-Z]{3}\s*\d{4})/.exec(text);
    out.set(squash(name), { available: !upcoming, when: upcoming ? upcoming[1].replace(/\s+/, ' ') : null });
  }
  return out;
}

// Cards both sources still call upcoming but whose monsters a patch has since
// let loose. The 17 Sep 2026 update opened Pyramid Dungeon (see
// scripts/build-map-availability.mjs); these five spawn there, and every one
// of them was listed "OCT 2026" only because Pyramid was.
const MANUAL_AVAILABLE = new Map([
  ...['ancientmummy', 'arclouse', 'isis', 'mummy', 'verit'].map((key) => [key, 'Pyramid Dungeon, 17 Sep 2026 update']),
  // Clock Tower opened with the 29 Oct 2026 patch. Checked 10 Nov 2026 against
  // the live client (D:\RagnarokZero\data.grf, navi_mob.lub): every one of
  // these monsters spawns on an alde_dun01-04 / c_tower4 map that is in
  // navi_map.lub. Both sources had them "OCT 2026" only because of Clock Tower.
  ...['brilight', 'erzsebet', 'extrajoker', 'highorc', 'jeniffer', 'joker', 'orcarcher', 'orcgeneral', 'owlduke', 'penomena', 'sieglouse'].map(
    (key) => [key, 'Clock Tower, 29 Oct 2026 patch'],
  ),
]);

// Cards both sources call available whose monsters spawn nowhere a player can
// go. Checked 10 Nov 2026 against the live client (D:\RagnarokZero\data.grf):
// none of these monsters is in navi_mob.lub, which lists spawns only on maps
// in navi_map.lub (858 of 858), and every map our monster_spawns table puts
// them on is either closed in data/map-availability.json or absent from
// navi_map.lub (guild dungeons gld_dun01-04, Karu bea_d01, the boss rooms
// b_pay_f10 / b_sp_d05 / b_moc_f17 / b_bea_d01). No client item package
// (probabilityinfo/packageitem.lub) gives any of them either. The sources
// were crawled Aug-Sep 2026 and mark "available" anything not on their own
// calendar, Lutie and Ant Hell cards included. `when` is the area's month in
// data/map-availability.json where every spawn map shares one; otherwise null.
const CLIENT = 'game client (navi_mob, 10 Nov 2026)';
const MANUAL_UNAVAILABLE = new Map([
  // Pirate Cave iz_dun03-04 (closed, owner in-game 14 Sep 2026)
  ...['phen', 'marinesphere', 'swordfish', 'strouf', 'deviace', 'merman'].map((key) => [key, null]),
  // Lutie / Toy Factory
  ...['mystcase', 'christmascookie', 'cookie', 'cruiser'].map((key) => [key, 'JAN 2027']),
  // Guild dungeons (gld_dun01-04), not in navi_map
  ...['gullinbursti', 'leibolmai', 'wraithdead', 'ancientworm', 'gianthornet', 'zombiemaster', 'caterpillar', 'creamyfear'].map(
    (key) => [key, null],
  ),
  // Karu (beach_dun open but empty, owner 28 Oct 2026); Pest also Turtle Island
  ...['medusa', 'nereid', 'pest'].map((key) => [key, null]),
  ['dragontail', 'FEB 2027'], // Turtle Island
  ['maya', 'NOV 2026'], // Ant Hell boss room b_an_d02
  ['darklord', 'DEC 2026'], // Old Glast Heim boss room b_gl_chy
  ['drake', 'MAR 2027'], // Sunken Ship boss room b_tre_d02
  // Boss rooms not in navi_map: b_pay_f10, b_sp_d05, b_moc_f17, b_bea_d01
  ...['eddga', 'pharaoh', 'phreeoni', 'taogunka'].map((key) => [key, null]),
  // No drop or spawn row in our DB, and no CHEPET / BLOODY_KNIGHT in navi_mob
  ...['chepet', 'bloodyknight'].map((key) => [key, null]),

  // Cards neither source covers at all, so nothing flagged them. Same check:
  // the monster is in no navi_mob row (every navi_mob sprite was matched to a
  // monster in our DB; none of these is among them), no client package gives
  // the card, and every map monster_spawns has for it is closed in
  // data/map-availability.json, which supplies the month.
  // Niflheim (Lord of the Dead: boss room b_nif)
  ...['dullahan', 'disguise', 'loliruri', 'lude', 'bloodymurderer', 'gibbet', 'quve', 'hylozoist', 'lordofthedead'].map((key) => [key, 'FEB 2027']),
  ...['solider', 'springrabbit', 'assaulter', 'permeter', 'freezer', 'heater', 'turtlegeneral'].map((key) => [key, 'FEB 2027']), // Turtle Island
  ...['dumplingchild', 'enchantedpeachtree', 'hermitplant', 'babyleopard', 'evilnymph', 'cloudhermit', 'zipperbear', 'bloodybutterfly', 'evilsnakelord'].map(
    (key) => [key, 'MAR 2027'], // Gonryun
  ),
  ...['maoguai', 'migao', 'jingguai', 'zhupolong', 'yaojun', 'whitelady', 'greenmaiden'].map((key) => [key, 'APR 2027']), // Louyang
  ...['leafcat', 'kraben', 'tamruan', 'ladytanee'].map((key) => [key, 'APR 2027']), // Ayothaya
  ...['firelocksoldier', 'thepaper', 'poisonoustoad', 'miyabidoll', 'shinobi', 'tengu', 'karakasa', 'kapha'].map((key) => [key, 'MAY 2027']), // Amatsu
  // No spawn row in our DB at all (Incantation Samurai, Garm, Knight of Windstorm)
  ...['samuraispector', 'hatii', 'frozenknight'].map((key) => [key, null]),
]);

function main() {
  const guide = guideRows();
  const rozerodb = rozerodbRows();

  const names = new Set([...guide.keys(), ...rozerodb.keys(), ...MANUAL_UNAVAILABLE.keys()]);
  const cards = {};
  let conflicts = 0;
  let both = 0;

  for (const key of names) {
    const a = guide.get(key);
    const b = rozerodb.get(key);
    if (!a && !b) {
      // Only the client check speaks for this card (MANUAL_UNAVAILABLE).
      const when = MANUAL_UNAVAILABLE.get(key);
      cards[key] = { when, sortKey: when ? Number(when.slice(-4)) * 100 + MONTHS[when.slice(0, 3)] : 999999, sources: [CLIENT] };
      continue;
    }
    if (a && b) {
      both += 1;
      if (a.available !== b.available) {
        conflicts += 1;
        console.log(`  conflict on ${key}: guide ${a.available ? 'available' : 'not'}, rozerodb ${b.available ? 'available' : 'not'}`);
        // A card the sources disagree about is left out entirely: a wrong
        // "not in the game yet" is worse than saying nothing.
        continue;
      }
    }
    const merged = a ?? b;
    if (merged.available && MANUAL_UNAVAILABLE.has(key)) {
      const when = MANUAL_UNAVAILABLE.get(key);
      cards[key] = { when, sortKey: when ? Number(when.slice(-4)) * 100 + MONTHS[when.slice(0, 3)] : 999999, sources: [CLIENT] };
      continue;
    }
    if (merged.available) continue; // Available is the default; only the gaps are stored.
    if (MANUAL_AVAILABLE.has(key)) continue;
    const when = a?.when ?? b?.when ?? null;
    const month = when ? MONTHS[when.slice(0, 3)] : null;
    const year = when ? Number(when.slice(-4)) : null;
    cards[key] = {
      when,
      sortKey: year && month ? year * 100 + month : 999999,
      sources: [a ? 'roz-global.info' : null, b ? 'rozerodb' : null].filter(Boolean),
    };
  }

  const sorted = Object.fromEntries(Object.keys(cards).sort().map((key) => [key, cards[key]]));
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          builtBy: 'scripts/build-card-availability.mjs',
          guideCards: guide.size,
          rozerodbCards: rozerodb.size,
          coveredByBoth: both,
          conflicts,
          note: 'Only cards that are NOT in the game yet are listed. Keys are the English card name with everything but letters and digits removed.',
        },
        cards: sorted,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`${guide.size} cards from the guide, ${rozerodb.size} from rozerodb, ${both} covered by both`);
  console.log(`${conflicts} conflicts, ${Object.keys(sorted).length} cards recorded as not released yet`);
}

main();

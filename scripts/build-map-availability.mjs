// Works out which maps are not open on the Global server yet.
//
// The spawn data covers every map the client ships, so the farm tool was
// recommending places a player cannot go -- Undersea-adjacent Clock Tower
// copies, Glast Heim, Turtle Island (owner, 11 Sep 2026: "show only what can
// actually be used now"). Two sources, and a map is closed if either says so:
//
//   rozerodb's map pages carry an "UPCOMING · OCT 2026 Global · <area>" banner
//   (crawled 31 Aug 2026, docs/rozerodb-export/data/maps.jsonl).
//   The publisher's own roadmap, as roz-global.info transcribes it month by
//   month (docs/rozglobal-export/pages/10-roadmap.html). rozerodb's banners
//   miss areas that roadmap names -- Labyrinth, Sphinx, Mjolnir Dead Pit,
//   Ant Hell, Turtle Island -- so both are needed.
//
// Only closed maps are stored: open is the default, so an absent code means
// "nothing says otherwise", never "confirmed open". The dates are plans; when a
// patch lands, re-run this after refreshing the exports.
//
// Run:  node scripts/build-map-availability.mjs

import fs from 'node:fs';
import path from 'node:path';

const ROZERODB_MAPS = path.join(process.cwd(), 'docs', 'rozerodb-export', 'data', 'maps.jsonl');
const DEST = path.join(process.cwd(), 'data', 'map-availability.json');

// The official roadmap, one row per area it opens, matched on map code.
// Codes come from rozerodb's own page headers: tow_d is its "Clock Tower",
// iz_d its "Pirate Cave", tre_d its "Shipwreck", xma_d its "Toy Factory".
const ROADMAP = [
  { when: 'OCT 2026', area: 'Clock Tower', test: /^(c_tower|alde_dun|tow_d)/ },
  { when: 'OCT 2026', area: 'Prontera Labyrinth', test: /^(prt_maze|maz_d|b_maz_d)/ },
  { when: 'OCT 2026', area: 'Sphinx', test: /^(in_sphinx|sp_d|b_sp_d)/ },
  { when: 'OCT 2026', area: 'Mjolnir Dead Pit', test: /^(mjo_dun|mjo_d)/ },
  { when: 'NOV 2026', area: 'Ant Hell', test: /^(anthell|an_d|b_an_d)/ },
  { when: 'DEC 2026', area: 'Old Glast Heim', test: /^(gl_|glast_|b_gl_)/ },
  { when: 'JAN 2027', area: 'Lutie', test: /^(xmas_|xma_|ztw_e)/ },
  { when: 'FEB 2027', area: 'Niflheim', test: /^(nif_|niflheim|b_nif)/ },
  { when: 'FEB 2027', area: 'Turtle Island', test: /^(tur_|b_tur_)/ },
  { when: 'MAR 2027', area: 'Gonryun', test: /^(gon_|b_gon_)/ },
  { when: 'MAR 2027', area: 'Sunken Ship', test: /^(tre_d|treasure|b_tre_d)/ },
  { when: 'APR 2027', area: 'Louyang', test: /^(lou_|b_lou_)/ },
  { when: 'APR 2027', area: 'Ayothaya', test: /^(ayo_|b_ayo_)/ },
  { when: 'MAY 2027', area: 'Amatsu', test: /^ama_/ },
  { when: 'JUN 2027', area: 'Yuno and Nogg Road', test: /^(yuno_|mag_)/ },
];

const BANNER = /UPCOMING\s*·\s*([A-Z]{3}\s+\d{4})\s+Global\s*·\s*(.+?)\s+\d+\s+monsters/;

// iz_d (Pirate Cave, Izlude) never got a rozerodb banner or a roadmap line --
// it just isn't on the published calendar at all. Owner confirmed in-game
// (14 Sep 2026) it is still closed on Global, so this is a manual close, not
// one either crawled source states. Umbala (um_) was flagged the same way
// earlier and got the opposite answer -- owner confirmed it *is* open -- so
// it stays out of this list on purpose.
const MANUAL_CLOSED = [{ when: 'TBD', area: 'Pirate Cave', test: /^iz_d/, source: 'owner confirmed in-game, 14 Sep 2026' }];

// Areas a crawled source still calls upcoming but a patch has since opened.
// These win over both sources until the exports are refreshed. Pyramid was
// bannered "OCT 2026" by rozerodb; the publisher's 16 Sep 2026 notice lists
// "Pyramid Dungeon and Geffen Dungeon added" in the 17 Sep 2026 update.
// The 1 Oct 2026 notice (owner's screenshot, 30 Sep 2026) opens Labyrinth
// Forest, Sphinx and Mjolnir Abandoned Mine. It does not name Clock Tower,
// which the roadmap had for October too, so Clock Tower stays closed.
const MANUAL_OPEN = [
  { area: 'Pyramid', test: /^(moc_pryd|pry_d|b_pry_d)/, source: 'official notice, 17 Sep 2026 update' },
  { area: 'Prontera Labyrinth', test: /^(prt_maze|maz_d|b_maz_d)/, source: 'official notice, 1 Oct 2026 update' },
  { area: 'Sphinx', test: /^(in_sphinx|sp_d|b_sp_d)/, source: 'official notice, 1 Oct 2026 update' },
  { area: 'Mjolnir Dead Pit', test: /^(mjo_dun|mjo_d)/, source: 'official notice, 1 Oct 2026 update' },
];

// The client's own navigation table is the strongest "open" signal there is
// (4 Oct 2026). The publisher adds a map to navi_map.lub when it opens on
// Global: the 1 Oct patch added exactly Labyrinth, Sphinx and Mjolnir, and on
// that build it lists Umbala (owner-confirmed open) but no Clock Tower, Glast
// Heim, Niflheim, Turtle Island, Louyang, Ayothaya, Amatsu, Yuno or Lutie.
// The roadmap regexes above also swept up classic dungeons that share a
// prefix with a scheduled memorial dungeon -- anthell01/02 (Ant Hell), the
// Izlude undersea dungeon iz_dun00-02, treasure01/02 (Sunken Ship) -- and the
// site called all three closed while players were in them. A code the client
// navigates to is open, whatever a crawled calendar says. Point CLIENT_NAVI at
// the newest extract after each patch.
const CLIENT_NAVI =
  process.env.CLIENT_NAVI ??
  'D:/Data grf roz/data_grf_comparison_20261001/extracted/changed/data/luafiles514/lua files/navigation/navi_map.lub';
const naviOpen = fs.existsSync(CLIENT_NAVI)
  ? new Set([...fs.readFileSync(CLIENT_NAVI).toString('latin1').matchAll(/[a-z][a-z0-9_@]{2,20}/g)].map((m) => m[0]))
  : null;
if (!naviOpen) console.warn(`no client navi_map at ${CLIENT_NAVI}: open status from the calendars only`);
let fromNavi = 0;

const pages = fs
  .readFileSync(ROZERODB_MAPS, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line))
  .filter((row) => row.path?.startsWith('/maps/'));

const maps = {};
let fromBanner = 0;
let fromRoadmap = 0;
for (const page of pages) {
  const code = page.slug;
  if (MANUAL_OPEN.some((row) => row.test.test(code))) continue;
  if (naviOpen?.has(code)) {
    fromNavi += 1;
    continue;
  }
  const banner = BANNER.exec(page.text);
  const roadmap = ROADMAP.find((row) => row.test.test(code));
  const manual = MANUAL_CLOSED.find((row) => row.test.test(code));
  if (!banner && !roadmap && !manual) continue;
  const sources = [];
  if (roadmap) {
    sources.push('roadmap');
    fromRoadmap += 1;
  }
  if (banner) {
    sources.push('rozerodb');
    fromBanner += 1;
  }
  if (manual) sources.push(manual.source);
  maps[code] = {
    // The publisher's calendar wins a disagreement (Glast Heim: roadmap DEC
    // 2026, rozerodb JAN 2027); rozerodb fills areas the roadmap never names.
    when: roadmap?.when ?? banner?.[1] ?? manual.when,
    area: roadmap?.area ?? banner?.[2] ?? manual.area,
    sources,
  };
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    roadmap: 'docs/rozglobal-export/pages/10-roadmap.html (publisher calendar, Aug 2026 - Jul 2027)',
    rozerodb: `docs/rozerodb-export/data/maps.jsonl UPCOMING banners (crawled ${pages[0]?.fetched_at?.slice(0, 10) ?? '?'})`,
    clientNavi: naviOpen ? 'client navi_map.lub (1 Oct 2026 patch): a map listed there is open' : 'not available',
  },
  maps: Object.fromEntries(Object.entries(maps).sort(([a], [b]) => a.localeCompare(b))),
};
fs.writeFileSync(DEST, `${JSON.stringify(out, null, 2)}\n`);

const byArea = {};
for (const row of Object.values(maps)) byArea[`${row.when} ${row.area}`] = (byArea[`${row.when} ${row.area}`] ?? 0) + 1;
console.log(`${pages.length} map pages · ${Object.keys(maps).length} closed (roadmap ${fromRoadmap}, rozerodb banner ${fromBanner}) · ${fromNavi} open per client navi`);
for (const [area, count] of Object.entries(byArea).sort()) console.log(`  ${area}: ${count}`);

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
  const banner = BANNER.exec(page.text);
  const roadmap = ROADMAP.find((row) => row.test.test(code));
  if (!banner && !roadmap) continue;
  const sources = [];
  if (roadmap) {
    sources.push('roadmap');
    fromRoadmap += 1;
  }
  if (banner) {
    sources.push('rozerodb');
    fromBanner += 1;
  }
  maps[code] = {
    // The publisher's calendar wins a disagreement (Glast Heim: roadmap DEC
    // 2026, rozerodb JAN 2027); rozerodb fills areas the roadmap never names.
    when: roadmap?.when ?? banner[1],
    area: roadmap?.area ?? banner[2],
    sources,
  };
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  sources: {
    roadmap: 'docs/rozglobal-export/pages/10-roadmap.html (publisher calendar, Aug 2026 - Jul 2027)',
    rozerodb: `docs/rozerodb-export/data/maps.jsonl UPCOMING banners (crawled ${pages[0]?.fetched_at?.slice(0, 10) ?? '?'})`,
  },
  maps: Object.fromEntries(Object.entries(maps).sort(([a], [b]) => a.localeCompare(b))),
};
fs.writeFileSync(DEST, `${JSON.stringify(out, null, 2)}\n`);

const byArea = {};
for (const row of Object.values(maps)) byArea[`${row.when} ${row.area}`] = (byArea[`${row.when} ${row.area}`] ?? 0) + 1;
console.log(`${pages.length} map pages · ${Object.keys(maps).length} closed (roadmap ${fromRoadmap}, rozerodb banner ${fromBanner})`);
for (const [area, count] of Object.entries(byArea).sort()) console.log(`  ${area}: ${count}`);

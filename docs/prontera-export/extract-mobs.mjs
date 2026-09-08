// Pulls the structured monster records out of the 3 Sep 2026 prontera crawl.
//
// The crawl saved each mob page's raw __NUXT_DATA__ payload (see
// crawl-prontera.mjs); this walks it with the shared resolver and writes one
// flat record per monster: stats, drops with rates, spawn maps, and the card
// the monster is named by. Map codes are not on the mob page, so the map
// crawl is read alongside it to turn each spawn's map slug into the
// navi_code the rest of the site uses.
//
// Run:  node docs/prontera-export/extract-mobs.mjs
import fs from 'node:fs';
import path from 'node:path';
import { resolvePayload } from './resolve-lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const DATA = path.join(HERE, 'data');

function readJsonl(file) {
  return fs.readFileSync(path.join(DATA, file), 'utf-8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function payloadEntry(row, prefix) {
  const p = resolvePayload(row.nuxt_data);
  const key = Object.keys(p.data ?? {}).find((k) => k.startsWith(prefix));
  return key ? p.data[key] : null;
}

// map slug -> navi_code, from the map pages of the same crawl.
const mapCodes = {};
for (const row of readJsonl('maps.jsonl')) {
  if (!row.path.startsWith('/maps/') || !row.nuxt_data) continue;
  try {
    const m = payloadEntry(row, 'map-');
    if (m?.slug && m?.navi_code) mapCodes[m.slug] = m.navi_code;
  } catch { /* a page whose payload will not parse is simply not a source */ }
}

// The item id is the tail of the item slug ("moonlight-dagger-1234").
function itemIdFromSlug(slug) {
  const m = /-(\d+)$/.exec(slug ?? '');
  return m ? Number(m[1]) : null;
}

const out = [];
for (const row of readJsonl('mobs.jsonl')) {
  if (!row.path.startsWith('/mobs/') || !row.nuxt_data) continue;
  let d;
  try { d = payloadEntry(row, 'mob-'); } catch { continue; }
  const mob = d?.mob;
  if (!mob?.mob_id_ingame) continue;
  out.push({
    id: mob.mob_id_ingame,
    slug: mob.slug,
    name: mob.name,
    path: row.path,
    level: mob.level,
    race: mob.race,
    element: mob.element,
    element_level: mob.element_level,
    size: mob.size,
    hp: mob.hp,
    def: mob.def_base,
    mdef: mob.mdef_base,
    atk_min: mob.atk_min,
    atk_max: mob.atk_max,
    base_exp: mob.base_exp,
    job_exp: mob.job_exp,
    hit_100: mob.hit_100,
    flee_95: mob.flee_95,
    agi: mob.agi,
    vit: mob.vit,
    int: mob.int,
    dex: mob.dex,
    luk: mob.luk,
    is_boss: mob.is_boss,
    is_mvp: mob.is_mvp,
    image: mob.image,
    variant_of_mob_id: mob.variant_of_mob_id,
    variant_tier: mob.variant_tier,
    card: d.card ? { slug: d.card.slug, name: d.card.name, id: itemIdFromSlug(d.card.slug) } : null,
    drops: (d.drops ?? []).map((x) => ({
      item_id: itemIdFromSlug(x.item?.slug),
      name: x.item?.name,
      rate: Number(x.rate),
      source: x.source,
    })).filter((x) => x.item_id),
    spawns: (d.spawns ?? []).map((x) => ({
      map_slug: x.map?.slug,
      map_name: x.map?.name,
      map_code: mapCodes[x.map?.slug] ?? null,
      count: x.count,
    })).filter((x) => x.map_slug),
  });
}

const file = path.join(HERE, 'mobs-summary.json');
fs.writeFileSync(file, JSON.stringify({
  _meta: {
    source: 'roz.prontera.info, crawled 3 Sep 2026 (docs/prontera-export/data/mobs.jsonl)',
    extracted_at: new Date().toISOString(),
    count: out.length,
    mapCodes: Object.keys(mapCodes).length,
  },
  monsters: out,
}, null, 1));
console.log(`${out.length} monsters, ${Object.keys(mapCodes).length} map codes -> ${path.relative(process.cwd(), file)}`);

// Adds the two event porings that walk every field on Global -- Bunny Poring
// (25340) and Gold Poring (25339) -- and their spawn rows.
//
// Why they are worth a row with almost no stats: players in the Thai group
// hunt "โพริ่งหูกระต่าย" for the Guild Flames that buy Guild Parma, and the
// only question they ask is WHERE. roz.prontera.info lists 87 maps each,
// three per map, instant respawn, and no level/hp/race at all -- its page is
// spawn data and nothing else. So this inserts the name plus the spawn list
// and leaves every stat null, which the monster page already renders as "—".
//
// Map codes: prontera names a map "Prontera Field 00" where we hold
// "Prontera Field" for prt_fild00, so display-name matching resolves only 42
// of 87. The rest are read from each map page's navi_code, which IS our
// map_code -- one request per unresolved map, cached in the raw file.
//
// Run:  node scripts/import-event-porings.mjs            (dry run)
//       node scripts/import-event-porings.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { resolveNuxtData } from './prontera-nuxt.mjs';

const APPLY = process.argv.includes('--apply');
const RAW = path.join(process.cwd(), 'data', 'raw', 'event-porings.json');
const DELAY_MS = 300;

const MOBS = [
  { slug: 'bunny-poring', id: 25340, name: 'Bunny Poring' },
  { slug: 'gold-poring', id: 25339, name: 'Gold Poring' },
];

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => {
    const i = l.indexOf('=');
    return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')];
  }),
);
const BASE = `${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`;
const HEADERS = { apikey: env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}` };

const norm = (text) => (text ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nuxt(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const m = /<script[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(await res.text());
  if (!m) throw new Error(`no payload at ${url}`);
  return resolveNuxtData(JSON.parse(m[1]));
}

async function fetchMob(slug) {
  const root = await nuxt(`https://roz.prontera.info/mobs/${slug}`);
  const bundle = root.data[Object.keys(root.data).find((k) => k.startsWith('mob-'))];
  return (bundle.spawns ?? []).map((s) => ({ slug: s.map?.slug ?? null, name: s.map?.name ?? null, count: s.count ?? null }));
}

/** Their map page's navi_code is our map_code. */
async function naviCode(slug) {
  const root = await nuxt(`https://roz.prontera.info/maps/${slug}`);
  const bundle = root.data[Object.keys(root.data).find((k) => k.startsWith('map'))];
  // Field maps put the map object at the bundle root; dungeon pages wrap it
  // in .map. Reading only one shape returned null for all 45 field maps.
  return bundle?.map?.navi_code ?? bundle?.navi_code ?? null;
}

async function allRows(pathAndQuery) {
  const out = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${BASE}/${pathAndQuery}`, { headers: { ...HEADERS, Range: `${from}-${from + 999}` } });
    const page = await res.json();
    if (!Array.isArray(page)) throw new Error(JSON.stringify(page));
    out.push(...page);
    if (page.length < 1000) break;
  }
  return out;
}

async function main() {
  const cached = fs.existsSync(RAW) ? JSON.parse(fs.readFileSync(RAW, 'utf8')) : {};

  const ourSpawns = await allRows('monster_spawns?select=map_code,map_display_name');
  const codeByName = new Map();
  for (const row of ourSpawns) if (row.map_display_name) codeByName.set(norm(row.map_display_name), row.map_code);
  const knownCodes = new Set(ourSpawns.map((r) => r.map_code));

  const resolved = { ...(cached.mapCodes ?? {}) };
  const plan = [];

  for (const mob of MOBS) {
    const spawns = cached[mob.slug]?.spawns ?? (await fetchMob(mob.slug));
    if (!cached[mob.slug]) await sleep(DELAY_MS);
    cached[mob.slug] = { spawns };

    const rows = [];
    for (const s of spawns) {
      let code = codeByName.get(norm(s.name)) ?? resolved[s.slug];
      if (!code && s.slug) {
        code = await naviCode(s.slug);
        resolved[s.slug] = code;
        await sleep(DELAY_MS);
      }
      if (!code) {
        console.log(`  no map code for ${s.name} (${s.slug})`);
        continue;
      }
      rows.push({ monster_id: mob.id, map_code: code, map_display_name: s.name, amount: s.count });
    }
    plan.push({ mob, rows });
  }

  cached.mapCodes = resolved;
  fs.mkdirSync(path.dirname(RAW), { recursive: true });
  fs.writeFileSync(RAW, JSON.stringify(cached, null, 1));

  for (const { mob, rows } of plan) {
    const unknown = rows.filter((r) => !knownCodes.has(r.map_code));
    console.log(`${mob.name} (${mob.id}): ${rows.length} spawn rows, ${unknown.length} on maps no other monster uses`);
  }

  if (!APPLY) {
    console.log('\ndry run -- pass --apply to write');
    return;
  }

  for (const { mob, rows } of plan) {
    const exists = await (await fetch(`${BASE}/monsters?select=id&id=eq.${mob.id}`, { headers: HEADERS })).json();
    if (exists.length === 0) {
      // Every stat stays null on purpose: the source has none, and a guessed
      // level would end up in the farm tools as if it were measured.
      const res = await fetch(`${BASE}/monsters`, {
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=representation' },
        body: JSON.stringify({ id: mob.id, name_en: mob.name, image_url: `/images/monsters/${mob.id}.gif` }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(`insert ${mob.id}: ${res.status} ${JSON.stringify(body)}`);
      console.log(`inserted monster ${mob.id} ${mob.name}`);
    } else {
      console.log(`monster ${mob.id} already present, left alone`);
    }

    const already = await allRows(`monster_spawns?select=map_code&monster_id=eq.${mob.id}`);
    const have = new Set(already.map((r) => r.map_code));
    const fresh = rows.filter((r) => !have.has(r.map_code));
    if (fresh.length === 0) {
      console.log(`  spawns already recorded for ${mob.name}`);
      continue;
    }
    const res = await fetch(`${BASE}/monster_spawns`, {
      method: 'POST',
      headers: { ...HEADERS, 'Content-Type': 'application/json', Prefer: 'return=representation' },
      body: JSON.stringify(fresh),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(`spawns ${mob.id}: ${res.status} ${JSON.stringify(body)}`);
    console.log(`  inserted ${body.length} spawn rows for ${mob.name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

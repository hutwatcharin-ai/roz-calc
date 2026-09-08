// Builds data/crafting-recipes.json: what can be made from what in Zero,
// with how far each recipe can be trusted.
//
// Two independent sources, neither trusted alone:
//
//   rAthena  db/pre-re/produce_db.txt and db/create_arrow_db.yml on GitHub.
//            The server's own production table, keyed by item id, so it
//            joins to our items without any name matching. It is classic
//            RO, not Zero, so it can list things Zero removed.
//   prontera the 3 Sep 2026 crawl (docs/prontera-export/data/crafting.jsonl,
//            gitignored). A Zero database -- but it labels 217 of its 355
//            recipes `other_region`, meaning it took them from another
//            region's server and has not confirmed them here.
//
// Every recipe is filtered to items that exist in OUR table, then tagged:
//
//   both           the server table and the Zero database list it with the
//                  same materials -- two independent sources agree
//   rathena-only   the server table has it and no Zero database mentions it
//   prontera-only  only the Zero database has it, and 217 of those it labels
//                  other_region itself
//
// The guides show verified first and put the rest behind a disclosure that
// says which is which. Nothing is merged into a single confident list.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/build-crafting-recipes.mjs

import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const OUT = path.join(process.cwd(), 'data', 'crafting-recipes.json');
const CACHE = path.join(process.cwd(), 'docs', 'prontera-export', 'craft-cache');
const CRAWL = path.join(process.cwd(), 'docs', 'prontera-export', 'data', 'crafting.jsonl');
const RA_PRODUCE = 'https://raw.githubusercontent.com/rathena/rathena/master/db/pre-re/produce_db.txt';
const RA_ARROW = 'https://raw.githubusercontent.com/rathena/rathena/master/db/create_arrow_db.yml';
const RA_ITEMS = [
  'https://raw.githubusercontent.com/rathena/rathena/master/db/pre-re/item_db_etc.yml',
  'https://raw.githubusercontent.com/rathena/rathena/master/db/pre-re/item_db_usable.yml',
  'https://raw.githubusercontent.com/rathena/rathena/master/db/pre-re/item_db_equip.yml',
];

// Downloads are cached: this script is re-run whenever the item table
// changes, and rAthena's files change far less often than that.
async function cached(url) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, url.split('/').pop());
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const res = await fetch(url, { headers: { 'user-agent': 'rozerothai.com recipe build' } });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(file, text);
  return text;
}

function parseProduce(text) {
  const out = [];
  for (const raw of text.split('\n')) {
    const line = raw.split('//')[0].trim();
    if (!line) continue;
    const parts = line.split(',').map((x) => x.trim()).filter((x) => x !== '');
    if (parts.length < 6 || parts.some((p) => !/^-?\d+$/.test(p))) continue;
    const n = parts.map(Number);
    const [, product, itemLevel, skillId, skillLv] = n;
    if (!product) continue;
    const materials = [];
    for (let i = 5; i < n.length - 1; i += 2) {
      // produce_db's own header: "If MaterialAmount is 0, the player must
      // have that item in their inventory" -- a cookbook or a creation
      // guide, held not spent. Printing it as "x0" would read as a bug.
      if (n[i]) materials.push({ id: n[i], amount: n[i + 1], held: n[i + 1] === 0 });
    }
    out.push({ product, itemLevel, skillId, skillLv, materials });
  }
  return out;
}

function parseAegisNames(texts) {
  const map = new Map();
  for (const text of texts) {
    let id = null;
    for (const line of text.split('\n')) {
      const idm = /^\s*-\s*Id:\s*(\d+)/.exec(line);
      if (idm) { id = Number(idm[1]); continue; }
      const nm = /^\s*AegisName:\s*(\S+)/.exec(line);
      if (nm && id !== null) { map.set(nm[1], id); id = null; }
    }
  }
  return map;
}

function parseArrows(text, aegis) {
  const out = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const src = /^\s*-\s*Source:\s*(\S+)/.exec(line);
    if (src) { cur = { source: src[1], make: [] }; out.push(cur); continue; }
    const item = /^\s*-\s*Item:\s*(\S+)/.exec(line);
    if (item && cur) { cur.make.push({ item: item[1], amount: 1 }); continue; }
    const amt = /^\s*Amount:\s*(\d+)/.exec(line);
    if (amt && cur && cur.make.length) cur.make[cur.make.length - 1].amount = Number(amt[1]);
  }
  return out
    .filter((a) => a.make.length && aegis.has(a.source))
    .map((a) => ({
      source: aegis.get(a.source),
      make: a.make.filter((m) => aegis.has(m.item)).map((m) => ({ id: aegis.get(m.item), amount: m.amount })),
    }))
    .filter((a) => a.make.length);
}

const REACTIVE = new Set(['ShallowReactive', 'Reactive', 'Ref', 'EmptyShallowReactive']);
function resolvePayload(text) {
  const arr = JSON.parse(text);
  const isRef = (x) => Number.isInteger(x) && x >= 0 && x < arr.length;
  const memo = new Map();
  function resolve(i, seen = new Set()) {
    if (seen.has(i)) return null;
    if (memo.has(i)) return memo.get(i);
    const v = arr[i];
    const next = new Set(seen);
    next.add(i);
    let out;
    if (Array.isArray(v)) {
      if (v.length === 2 && REACTIVE.has(v[0]) && isRef(v[1])) return resolve(v[1], next);
      out = v.map((x) => (isRef(x) ? resolve(x, next) : x));
    } else if (v && typeof v === 'object') {
      out = {};
      for (const k of Object.keys(v)) out[k] = isRef(v[k]) ? resolve(v[k], next) : v[k];
    } else out = v;
    memo.set(i, out);
    return out;
  }
  return resolve(arr[0][1]);
}

function pronteraRecipes() {
  if (!fs.existsSync(CRAWL)) {
    console.log('no prontera crawl on disk: every recipe will be rathena-only');
    return [];
  }
  const line = fs.readFileSync(CRAWL, 'utf8').split('\n')[0];
  const root = resolvePayload(JSON.parse(line).nuxt_data);
  const found = new Map();
  (function walk(o, d = 0) {
    if (!o || typeof o !== 'object' || d > 50) return;
    if (Array.isArray(o)) { for (const x of o) walk(x, d + 1); return; }
    if (o.craft_type && o.product && o.materials) found.set(o.id, o);
    for (const v of Object.values(o)) walk(v, d + 1);
  })(root);
  return [...found.values()];
}

async function ourItems(db) {
  const map = new Map();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('items')
      .select('id, name_en, icon_url, category')
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    // The icon and category ride along so a recipe row can show the sprite
    // without the page having to look up every item it names.
    for (const r of data ?? []) map.set(r.id, { name: r.name_en, icon: r.icon_url, category: r.category });
    if ((data ?? []).length < 1000) break;
  }
  return map;
}

// Compared on what is CONSUMED only. rAthena lists the cookbook or creation
// guide that has to be in the bag (amount 0) and prontera does not, so
// including it made every brewing and cooking recipe look like a
// disagreement when the two sources say exactly the same thing.
const sameMaterials = (a, b) => {
  const key = (list) =>
    list
      .filter((m) => m.amount > 0)
      .map((m) => `${m.id}x${m.amount}`)
      .sort()
      .join(',');
  return key(a) === key(b);
};

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  const items = await ourItems(db);
  const has = (id) => items.has(id);
  const name = (id) => items.get(id).name;
  const icon = (id) => items.get(id).icon ?? null;
  const category = (id) => items.get(id).category ?? null;
  const itemRef = (id, extra = {}) => ({ id, name: name(id), icon: icon(id), category: category(id), ...extra });

  const produce = parseProduce(await cached(RA_PRODUCE));
  const aegis = parseAegisNames(await Promise.all(RA_ITEMS.map(cached)));
  const arrows = parseArrows(await cached(RA_ARROW), aegis);
  const pron = pronteraRecipes();
  console.log(`rathena: ${produce.length} produce, ${arrows.length} arrow · prontera: ${pron.length}`);

  // prontera's craft_type per product id, and its own confidence label.
  const pronByProduct = new Map();
  for (const r of pron) {
    const pid = r.product?.item_id_ingame;
    if (!pid) continue;
    const mats = (r.materials ?? [])
      .filter((m) => m.item_id_ingame)
      .map((m) => ({ id: m.item_id_ingame, amount: m.amount ?? 1 }));
    const list = pronByProduct.get(pid) ?? [];
    list.push({ kind: r.craft_type, materials: mats, source: r.data_source, quantity: r.quantity ?? 1 });
    pronByProduct.set(pid, list);
  }

  // Which crafting skill means which kind, learned from the recipes both
  // sources share rather than assumed: for every rAthena recipe prontera
  // also lists, the skill id is credited with prontera's craft_type, and
  // the majority wins. A skill nothing agrees on stays null and its
  // recipes are grouped as "other" instead of guessed into a section.
  const votes = new Map();
  for (const r of produce) {
    for (const p of pronByProduct.get(r.product) ?? []) {
      const v = votes.get(r.skillId) ?? new Map();
      v.set(p.kind, (v.get(p.kind) ?? 0) + 1);
      votes.set(r.skillId, v);
    }
  }
  const kindOfSkill = new Map();
  for (const [skill, v] of votes) {
    const [best] = [...v.entries()].sort((a, b) => b[1] - a[1]);
    kindOfSkill.set(skill, best[0]);
  }
  console.log('skill id -> kind, learned from the overlap:', Object.fromEntries(kindOfSkill));

  const recipes = [];
  const dropped = { produce: 0, arrow: 0, prontera: 0 };

  for (const r of produce) {
    if (!has(r.product) || r.materials.some((m) => !has(m.id))) { dropped.produce += 1; continue; }
    const theirs = pronByProduct.get(r.product) ?? [];
    // Two sources agreeing is stronger evidence than either alone, even
    // when prontera calls its own copy other_region -- rAthena's table is
    // the independent confirmation that the recipe is real.
    const match = theirs.find((p) => sameMaterials(p.materials, r.materials));
    const confidence = match ? 'both' : 'rathena-only';
    recipes.push({
      id: `p${r.product}-${r.materials.map((m) => m.id).join('-')}`,
      kind: kindOfSkill.get(r.skillId) ?? (match ? match.kind : 'other'),
      product: itemRef(r.product, { amount: 1 }),
      materials: r.materials.map((m) => itemRef(m.id, { amount: m.amount, held: m.held || undefined })),
      itemLevel: r.itemLevel || null,
      skillId: r.skillId || null,
      skillLevel: r.skillLv || null,
      confidence,
      sources: match ? ['rathena', 'prontera'] : ['rathena'],
    });
  }

  for (const a of arrows) {
    if (!has(a.source) || a.make.some((m) => !has(m.id))) { dropped.arrow += 1; continue; }
    for (const m of a.make) {
      const theirs = pronByProduct.get(m.id) ?? [];
      const match = theirs.find((p) => p.materials.length === 1 && p.materials[0].id === a.source);
      recipes.push({
        id: `a${a.source}-${m.id}`,
        kind: 'arrow',
        product: itemRef(m.id, { amount: m.amount }),
        materials: [itemRef(a.source, { amount: 1 })],
        itemLevel: null,
        skillId: null,
        skillLevel: null,
        confidence: match ? 'both' : 'rathena-only',
        sources: match ? ['rathena', 'prontera'] : ['rathena'],
      });
    }
  }

  // prontera-only recipes: kept, flagged, never mixed in with the rest.
  const seen = new Set(recipes.map((r) => `${r.product.id}|${r.materials.map((m) => m.id).sort().join(',')}`));
  for (const r of pron) {
    const pid = r.product?.item_id_ingame;
    const mats = (r.materials ?? []).filter((m) => m.item_id_ingame).map((m) => ({ id: m.item_id_ingame, amount: m.amount ?? 1 }));
    if (!pid || !has(pid) || mats.length === 0 || mats.some((m) => !has(m.id))) { dropped.prontera += 1; continue; }
    const k = `${pid}|${mats.map((m) => m.id).sort().join(',')}`;
    if (seen.has(k)) continue;
    seen.add(k);
    recipes.push({
      id: `x${pid}-${mats.map((m) => m.id).join('-')}`,
      kind: r.craft_type,
      product: itemRef(pid, { amount: r.quantity ?? 1 }),
      materials: mats.map((m) => itemRef(m.id, { amount: m.amount })),
      itemLevel: r.item_level ?? null,
      skillId: null,
      skillLevel: null,
      confidence: 'prontera-only',
      otherRegion: r.data_source === 'other_region',
      sources: ['prontera'],
    });
  }

  const byKind = {};
  const byConfidence = {};
  for (const r of recipes) {
    byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
    byConfidence[r.confidence] = (byConfidence[r.confidence] ?? 0) + 1;
  }
  console.log(`${recipes.length} recipes · by kind`, byKind, '· by confidence', byConfidence);
  console.log('dropped because an item is not in Zero:', dropped);

  recipes.sort((a, b) => a.kind.localeCompare(b.kind) || a.product.name.localeCompare(b.product.name));
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        _meta: {
          built: new Date().toISOString().slice(0, 10),
          how: 'node scripts/build-crafting-recipes.mjs',
          sources: {
            rathena: 'db/pre-re/produce_db.txt + db/create_arrow_db.yml (server production tables, classic RO)',
            prontera: 'roz.prontera.info crawl of 3 Sep 2026 (a Zero database; labels some of its own rows other_region)',
          },
          confidence: {
            both: 'rAthena and the Zero database list it with the same materials',
            'rathena-only': "rAthena's server table has it; no Zero database mentions it",
            'prontera-only': 'only the Zero database has it (otherRegion marks the ones it took from another region)',
          },
          held: 'a material with amount 0 is required in the bag but not consumed (a cookbook, a creation guide)',
          filtered: 'every product and every material exists in our items table',
        },
        recipes,
      },
      null,
      1,
    ) + '\n',
  );
  console.log('wrote', OUT);
}

main().catch((e) => { console.error(e); process.exit(1); });

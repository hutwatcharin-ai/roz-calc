// Fills the item icons ratemyserver could not: roz.prontera.info serves the
// same 24x24 Gravity sprites under UUID asset paths (robots.txt allows
// everything but /api/). The UUID for each item is already in the page
// payloads crawled on 3 Sep 2026 (docs/prontera-export/data/items.jsonl,
// gitignored), so this never re-crawls a page -- one asset request per
// missing icon, 150 ms apart.
//
// Second pass, no network: an item whose name another item already has an
// icon for (Arc Wand [1] vs Arc Wand [2]) gets a copy of that icon. Same
// sprite in the game, so the same picture here (user, 7 Sep 2026).
//
// Only verified GIF bytes are saved; a placeholder that repeats across many
// ids would show up as one md5 many times, so the run reports the top hashes
// for a human to eyeball. Provenance goes to data/item-icon-sources.json.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/mirror-prontera-icons.mjs [--limit N] [--dry-run]
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { createClient } from '@supabase/supabase-js';

const DELAY_MS = 150;
const DIR = path.join(process.cwd(), 'public', 'images', 'items');
const CRAWL = path.join(process.cwd(), 'docs', 'prontera-export', 'data', 'items.jsonl');
const SOURCES = path.join(process.cwd(), 'data', 'item-icon-sources.json');
const UA = 'rozerothai.com icon mirror (hutwatcharin@gmail.com)';

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const limitAt = argv.indexOf('--limit');
const limit = limitAt === -1 ? Infinity : Number(argv[limitAt + 1]);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// prontera serves most icons as GIF and ~40 newer ones as PNG; both are real
// sprites, so the extension follows the bytes, never the content-type header.
function imageExt(buf) {
  if (buf.length < 10) return null;
  const head = buf.subarray(0, 8);
  if (head.subarray(0, 6).toString() === 'GIF87a' || head.subarray(0, 6).toString() === 'GIF89a') return 'gif';
  if (head.equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  return null;
}
const existingIcon = (id) => ['gif', 'png'].map((e) => path.join(DIR, `${id}.${e}`)).find((f) => fs.existsSync(f));

async function readCrawl() {
  const uuidByItem = new Map();
  const rl = readline.createInterface({ input: fs.createReadStream(CRAWL, 'utf8') });
  for await (const line of rl) {
    if (!line) continue;
    const page = JSON.parse(line);
    if (page.status !== 200) continue;
    const m = /-(\d+)$/.exec(page.slug ?? '');
    if (!m) continue;
    const id = Number(m[1]);
    // In the devalue payload the small icon path sits right before the id:
    //   ...,"/assets/<uuid>",550127,"weapon",...
    const s = JSON.stringify(page.nuxt_data ?? null);
    const hit = new RegExp(`\\\\"(/assets/[0-9a-f-]{36})\\\\",${id},`).exec(s);
    if (hit) uuidByItem.set(id, hit[1]);
  }
  return uuidByItem;
}

async function allItems(db) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from('items').select('id, name_en, icon_url').order('id').range(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return rows;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  fs.mkdirSync(DIR, { recursive: true });
  const sources = fs.existsSync(SOURCES) ? JSON.parse(fs.readFileSync(SOURCES, 'utf8')) : {};

  const items = await allItems(db);
  const missing = items.filter((i) => !i.icon_url);
  const uuidByItem = await readCrawl();
  console.log(`${items.length} items, ${missing.length} without an icon, prontera knows ${missing.filter((i) => uuidByItem.has(i.id)).length} of them`);

  async function setIcon(id, ext, note) {
    sources[id] = note;
    if (dryRun) return;
    const { error } = await db.from('items').update({ icon_url: `/images/items/${id}.${ext}` }).eq('id', id);
    if (error) throw error;
  }

  // Pass 1: prontera assets.
  const hashes = new Map();
  let fetched = 0, saved = 0, notGif = 0, failed = 0;
  for (const item of missing) {
    const asset = uuidByItem.get(item.id);
    if (!asset) continue;
    if (fetched >= limit) break;
    let ext = existingIcon(item.id)?.split('.').pop();
    if (!ext) {
      fetched += 1;
      if (dryRun) continue;
      try {
        const res = await fetch(`https://roz.prontera.info${asset}`, { headers: { 'user-agent': UA } });
        if (!res.ok) { failed += 1; console.log(`  ${item.id} ${item.name_en}: HTTP ${res.status}`); await sleep(DELAY_MS); continue; }
        const buf = Buffer.from(await res.arrayBuffer());
        ext = imageExt(buf);
        if (!ext) { notGif += 1; console.log(`  ${item.id} ${item.name_en}: not an image (${res.headers.get('content-type')})`); await sleep(DELAY_MS); continue; }
        const md5 = createHash('md5').update(buf).digest('hex');
        hashes.set(md5, (hashes.get(md5) ?? 0) + 1);
        fs.writeFileSync(path.join(DIR, `${item.id}.${ext}`), buf);
      } catch (e) {
        failed += 1; console.log(`  ${item.id} ${item.name_en}: ${e.message}`);
        await sleep(DELAY_MS); continue;
      }
      await sleep(DELAY_MS);
    }
    await setIcon(item.id, ext, { source: 'prontera', asset });
    item.icon_url = `/images/items/${item.id}.${ext}`;
    saved += 1;
  }
  console.log(`prontera: fetched ${fetched}, saved ${saved}, not-image ${notGif}, failed ${failed}`);
  const repeated = [...hashes.entries()].filter(([, n]) => n > 3).sort((a, b) => b[1] - a[1]);
  if (repeated.length) console.log('same bytes on several ids (check for a placeholder):', repeated.slice(0, 5));

  // Pass 2: same-name siblings.
  const iconByName = new Map();
  for (const i of items) if (i.icon_url && !iconByName.has(i.name_en)) iconByName.set(i.name_en, i);
  let copied = 0, noSibling = 0;
  for (const item of items) {
    if (item.icon_url) continue;
    const donor = iconByName.get(item.name_en);
    if (!donor) { noSibling += 1; continue; }
    const from = path.join(process.cwd(), 'public', donor.icon_url);
    if (!fs.existsSync(from)) continue;
    const ext = from.split('.').pop();
    if (!dryRun) fs.copyFileSync(from, path.join(DIR, `${item.id}.${ext}`));
    await setIcon(item.id, ext, { source: 'same-name', from: donor.id });
    item.icon_url = `/images/items/${item.id}.${ext}`;
    copied += 1;
  }
  console.log(`same-name copies: ${copied}; still without an icon: ${noSibling}`);
  if (!dryRun) fs.writeFileSync(SOURCES, JSON.stringify(sources, null, 0) + '\n');
}

main().catch((e) => { console.error(e); process.exit(1); });

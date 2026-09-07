// Mirrors the full map renders roz.prontera.info shows on its map pages
// (~500 px PNG, the in-game map with terrain), one file per prontera map,
// for every map code in our map_stats. The asset UUIDs come from the 3 Sep
// 2026 crawl (data/prontera-map-images.json, extracted from
// docs/prontera-export/data/maps.jsonl) so no page is re-fetched -- one
// asset request per map, 150 ms apart. robots.txt allows everything but /api/.
//
// A Zero code matches directly (prt_ca01), by family (our gef_f10_a /
// gef_f10_b / b_gef_f10 and prontera's bea_d02_c collapse to one base: the
// picture is of the place, not the channel), or through the same classic-code
// rewrites the minimap mirror uses (pay_d01_a -> pay_dun01).
//
// Output: raw PNGs in docs/prontera-export/map-images/ (gitignored, ~135 KB
// each) and public/images/maps/full/_index.json mapping each of our codes to
// its prontera code. scripts/compress-map-images.py turns the PNGs into the
// WebP files the site serves.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/mirror-prontera-maps.mjs [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { candidates } from './mirror-map-images.mjs';

const DELAY_MS = 150;
const DIR = path.join(process.cwd(), 'docs', 'prontera-export', 'map-images');
const OUT = path.join(process.cwd(), 'public', 'images', 'maps', 'full');
const UA = 'rozerothai.com map mirror (hutwatcharin@gmail.com)';
const dryRun = process.argv.includes('--dry-run');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const base = (code) => code.replace(/^b_/, '').replace(/_[abcz]$/, '');

function imageExt(buf) {
  if (buf.length < 10) return null;
  if (buf.subarray(0, 6).toString() === 'GIF87a' || buf.subarray(0, 6).toString() === 'GIF89a') return 'gif';
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  return null;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  fs.mkdirSync(DIR, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });

  const prontera = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'prontera-map-images.json'), 'utf8'));
  const byBase = new Map();
  for (const code of Object.keys(prontera)) if (!byBase.has(base(code))) byBase.set(base(code), code);

  const { data, error } = await db.from('map_stats').select('map_code').order('map_code').range(0, 1999);
  if (error) throw error;
  const ours = data.map((r) => r.map_code);

  const index = {};
  const files = new Map(); // prontera code -> filename
  let fetched = 0, saved = 0, bad = 0, none = [];
  for (const code of ours) {
    const pcode =
      candidates(code).find((c) => prontera[c]) ??
      candidates(code).map((c) => byBase.get(base(c))).find(Boolean);
    if (!pcode) { none.push(code); continue; }
    if (!files.has(pcode)) {
      const existing = ['png', 'gif'].map((e) => `${pcode}.${e}`).find((f) => fs.existsSync(path.join(DIR, f)));
      if (existing) files.set(pcode, existing);
      else {
        fetched += 1;
        if (dryRun) { files.set(pcode, `${pcode}.png`); }
        else {
          try {
            const res = await fetch(`https://roz.prontera.info${prontera[pcode].asset}`, { headers: { 'user-agent': UA } });
            const buf = res.ok ? Buffer.from(await res.arrayBuffer()) : null;
            const ext = buf && imageExt(buf);
            if (!ext) { bad += 1; console.log(`  ${pcode}: HTTP ${res.status} ${res.headers.get('content-type')}`); }
            else { fs.writeFileSync(path.join(DIR, `${pcode}.${ext}`), buf); files.set(pcode, `${pcode}.${ext}`); saved += 1; }
          } catch (e) { bad += 1; console.log(`  ${pcode}: ${e.message}`); }
          await sleep(DELAY_MS);
        }
      }
    }
    if (files.has(pcode)) index[code] = { prontera: pcode, name: prontera[pcode].name };
  }
  if (!dryRun) fs.writeFileSync(path.join(OUT, '_index.json'), JSON.stringify(index, null, 0) + '\n');
  console.log(`${ours.length} map codes; ${Object.keys(index).length} have a prontera image (${files.size} files, fetched ${fetched}, saved ${saved}, bad ${bad}); ${none.length} without`);
  console.log('without:', none.join(' '));
}

main().catch((e) => { console.error(e); process.exit(1); });

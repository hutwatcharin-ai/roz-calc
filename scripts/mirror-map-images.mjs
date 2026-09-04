// Mirrors map minimaps into public/images/maps/<code>.gif.
//
// Source: ratemyserver.net/maps/<code>.gif -- 205x205 GIFs, the same map codes
// this game uses. Checked before writing any of this: its robots.txt is empty
// (no rules), and a request for a made-up code answers 302, so a 200 with GIF
// bytes is a real map and not a placeholder. The same site already provides
// the item icons this project mirrors.
//
// Mirrored, never hotlinked -- the rule the item icons follow, so the site
// keeps working if theirs moves and we are not spending their bandwidth.
//
// Zero renamed a lot of maps, so coverage is partial by construction: a code
// with no image is reported and the page simply shows no picture. Nothing is
// substituted from a similar-looking map.
//
// Run:  node scripts/mirror-map-images.mjs [--limit 50] [--force]

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.resolve('public', 'images', 'maps');
const SOURCE = (code) => `https://ratemyserver.net/maps/${code}.gif`;
const DELAY_MS = 350;
const UA = 'Mozilla/5.0 (compatible; roz-calc map mirror; +https://rozerothai.com)';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Zero renamed maps that classic RO still calls something else: an_d01_a is
 * Ant Hell F1 (anthell01), ama_d02_b is Amatsu Dungeon 2 (ama_dun02). The
 * image only exists under the old name, so each code is tried under a short
 * list of mechanical rewrites -- never a guess at a similar-looking map, and
 * the one that answers is recorded in _source.json so the substitution is
 * auditable rather than invisible.
 */
function candidates(code) {
  const out = [];
  const base = code.replace(/_[abz]$/, '');
  // b_ marks Zero's second copy of a map (b_gef_f10 is the same Geffen Field
  // 10), so the plain name is a candidate for it as well.
  for (const stem of new Set([base, base.replace(/^b_/, '')])) {
    out.push(stem);

    const dungeon = /^([a-z_]+?)_d(\d+)$/.exec(stem);
    if (dungeon) {
      out.push(`${dungeon[1]}_dun${dungeon[2]}`);
      if (dungeon[1] === 'an') out.push(`anthell${dungeon[2]}`);
      if (dungeon[1] === 'orc') out.push(`orcsdun${dungeon[2]}`);
      if (dungeon[1] === 'iz') out.push(`iz_dun${dungeon[2]}`);
    }

    const field = /^([a-z_]+?)_f(\d+)$/.exec(stem);
    if (field) out.push(`${field[1]}_fild${field[2]}`);

    if (stem === 'gl_chy') out.push('gl_chyard');
    if (stem === 'gl_sew') out.push('gl_sew01');

    // Maps Zero renamed wholesale. Each pair was read off the map's own
    // display name -- pry_d05 says "Pyramid B1F", which is moc_pryd05 -- so
    // this is a translation of names, not a guess at which picture looks
    // close. A pair whose classic code does not answer is simply dropped.
    const renamed = /^([a-z]+)_([dfe])(\d+)$/.exec(stem);
    if (renamed) {
      const [, family, kind, digits] = renamed;
      const n = Number(digits);
      const two = String(n).padStart(2, '0');
      if (family === 'pry' && kind === 'd') out.push(`moc_pryd${two}`);
      if (family === 'sp' && kind === 'd') out.push(`in_sphinx${n}`);
      if (family === 'prt' && kind === 'd') out.push(`prt_sewb${n}`);
      if (family === 'tre' && kind === 'd') out.push(`treasure${two}`);
      if (family === 'maz' && kind === 'd') out.push(`prt_maze${two}`);
      if (family === 'xma' && kind === 'd') out.push(`xmas_dun${two}`);
      if (family === 'xma' && kind === 'f') out.push(`xmas_fild${two}`);
    }
    if (stem === 'gl_c01') out.push('gl_cas01');
    if (stem === 'gl_c02') out.push('gl_cas02');
    if (stem === 'gl_k01') out.push('gl_knt01');
    if (stem === 'gl_pri') out.push('gl_prison');
    if (stem === 'gl_chu') out.push('gl_church');
    // A trailing underscore is a code typo upstream, not a different map.
    if (stem.endsWith('_')) out.push(stem.slice(0, -1));
  }

  return [...new Set([code, ...out])];
}

function loadEnv() {
  try {
    for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
      const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch {
    // Reported below when the keys turn out to be missing.
  }
}

async function allMapCodes() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');

  const codes = [];
  for (let from = 0; ; from += 1000) {
    const res = await fetch(`${url}/rest/v1/map_stats?select=map_code&order=map_code`, {
      headers: { apikey: key, Authorization: `Bearer ${key}`, Range: `${from}-${from + 999}` },
    });
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) break;
    codes.push(...rows.map((r) => r.map_code));
    if (rows.length < 1000) break;
  }
  return codes;
}

async function main() {
  loadEnv();
  const force = process.argv.includes('--force');
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg >= 0 ? Number(process.argv[limitArg + 1]) : Infinity;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const codes = (await allMapCodes()).slice(0, limit);
  console.log(`${codes.length} map codes to check`);

  const sourceOf = {};
  let saved = 0;
  let already = 0;
  let missing = 0;
  const missingCodes = [];

  for (const [i, code] of codes.entries()) {
    const file = path.join(OUT_DIR, `${code}.gif`);
    if (!force && fs.existsSync(file)) {
      already += 1;
      continue;
    }

    let hit = null;
    for (const candidate of candidates(code)) {
      let res;
      try {
        res = await fetch(SOURCE(candidate), { headers: { 'User-Agent': UA }, redirect: 'manual' });
      } catch {
        await sleep(DELAY_MS);
        continue;
      }
      // 302 is this site's "no such map". Only GIF bytes count as a hit -- an
      // HTML error page saved as .gif would render as a broken image forever.
      const buffer = res.status === 200 ? Buffer.from(await res.arrayBuffer()) : null;
      if (buffer && buffer.subarray(0, 3).toString() === 'GIF') {
        hit = { candidate, buffer };
        break;
      }
      await sleep(DELAY_MS);
    }

    if (hit) {
      fs.writeFileSync(file, hit.buffer);
      if (hit.candidate !== code) sourceOf[code] = hit.candidate;
      saved += 1;
    } else {
      missing += 1;
      missingCodes.push(code);
    }

    if (i % 25 === 0) process.stdout.write(`\r  ${i + 1}/${codes.length} saved ${saved} missing ${missing}   `);
    await sleep(DELAY_MS);
  }

  console.log(`\nsaved ${saved} · already had ${already} · no image ${missing}`);
  if (Object.keys(sourceOf).length > 0) {
    fs.writeFileSync(path.join(OUT_DIR, '_source.json'), JSON.stringify(sourceOf, null, 2));
    console.log(`${Object.keys(sourceOf).length} images came from the map's classic code (see _source.json)`);
  }
  if (missingCodes.length > 0) {
    fs.writeFileSync(path.join(OUT_DIR, '_missing.json'), JSON.stringify(missingCodes, null, 2));
    console.log(`codes with no image listed in ${path.join(OUT_DIR, '_missing.json')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

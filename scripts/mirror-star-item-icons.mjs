// Icons for the 24 ★ items neither the game client nor ratemyserver has.
//
// scripts/item-icons-from-client.py found nothing for these: they have no
// row at all in itemInfo_data.lub (checked 24 Sep 2026 -- the client ships
// zero data for them, not even a bare name, which also explains why they
// have no Thai text and no weapon_type/jobs footer parsed from the client).
// scripts/mirror-item-icons.ts's source, ratemyserver, returns its "No
// Image" placeholder for all 24 -- expected, since a classic-RO database
// has never heard of Zero's ★ items.
//
// static.divine-pride.net has real, distinct art for them (allowed source,
// robots open -- see CLAUDE.md). Its own "not found" placeholder is a red
// circular watermark, always 5,610 bytes with md5 1e92868d...; every real
// icon sampled here was 500-750 bytes, so size alone already separates them,
// and the hash check makes that exact rather than a heuristic.
//
// Saved to public/images/items/<id>.png; icon_url set only on a verified,
// non-placeholder PNG.
//
// Run: node scripts/mirror-star-item-icons.mjs

import { createHash } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split('\n').filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const DIR = path.join(process.cwd(), 'public', 'images', 'items');
fs.mkdirSync(DIR, { recursive: true });

const NOT_FOUND_MD5 = '1e92868d31890f7e46f867da225d4f56';

async function main() {
  const { data, error } = await db.from('items').select('id,name_en').like('name_en', '★%').is('icon_url', null);
  if (error) throw error;
  console.log(`${data.length} ★ items with no icon_url`);

  let ok = 0, placeholder = 0, badStatus = 0;
  for (const { id, name_en } of data) {
    const file = path.join(DIR, `${id}.png`);
    const res = await fetch(`https://static.divine-pride.net/images/items/item/${id}.png`);
    if (!res.ok) { badStatus += 1; console.log(id, name_en, '-> HTTP', res.status); continue; }
    const buf = Buffer.from(await res.arrayBuffer());
    const hash = createHash('md5').update(buf).digest('hex');
    if (hash === NOT_FOUND_MD5) { placeholder += 1; console.log(id, name_en, '-> not-found placeholder'); continue; }
    fs.writeFileSync(file, buf);
    const { error: upErr } = await db.from('items').update({ icon_url: `/images/items/${id}.png` }).eq('id', id);
    if (upErr) throw new Error(`item ${id}: ${upErr.message}`);
    ok += 1;
    console.log(id, name_en, '->', buf.length, 'bytes, saved');
    await new Promise((r) => setTimeout(r, 150));
  }
  console.log(`\ndone: ${ok} mirrored, ${placeholder} were divine-pride's own placeholder, ${badStatus} bad HTTP status`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Mirrors item icons for every item that has none, from ratemyserver's
// id-addressed sprite files (robots.txt: no rules; one request per item, no
// page scraping needed -- unlike rozerodb, whose icon filenames are content
// hashes that would cost a page-load each to discover).
//
// Sprites are Gravity's game art, the same files every database site serves.
// Saved to public/images/items/<id>.gif and icon_url updated only on a
// verified GIF -- an HTML error page saved as .gif would render as a broken
// image on every surface at once.
//
// Run:  npx tsx scripts/mirror-item-icons.ts [--limit N]

import { createHash } from 'node:crypto';
import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';

const DELAY_MS = 150;
const DIR = path.join(process.cwd(), 'public', 'images', 'items');

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);
  fs.mkdirSync(DIR, { recursive: true });

  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg === -1 ? Infinity : Number(process.argv[limitArg + 1]);

  const ids: number[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db
      .from('items')
      .select('id')
      .is('icon_url', null)
      .order('id')
      .range(from, from + 999);
    if (error) throw error;
    ids.push(...(data ?? []).map((r) => r.id));
    if ((data ?? []).length < 1000) break;
  }
  const todo = ids.slice(0, limit);
  console.log(`${ids.length} items without an icon; fetching ${todo.length}`);

  let ok = 0;
  let missing = 0;
  let badBytes = 0;
  for (const [i, id] of todo.entries()) {
    const file = path.join(DIR, `${id}.gif`);
    let saved = false;
    if (fs.existsSync(file)) {
      saved = true; // resumed run: file already mirrored, just fix the row
    } else {
      try {
        const res = await fetch(`https://file5s.ratemyserver.net/items/small/${id}.gif`);
        if (res.ok) {
          const buf = Buffer.from(await res.arrayBuffer());
          // GIF87a / GIF89a magic; anything else is an error page in disguise.
          // The magic check alone let 1,986 of ratemyserver's "No Image"
          // placeholder gifs through (valid GIFs, useless pixels) -- reject
          // that exact file by hash so a re-run cannot re-import it.
          const NO_IMAGE_MD5 = 'a34c3279bc568da4e0000b817fa15a61';
          const isGif = buf.length > 30 && buf.subarray(0, 4).toString('latin1') === 'GIF8';
          const isPlaceholder = createHash('md5').update(buf).digest('hex') === NO_IMAGE_MD5;
          if (isGif && !isPlaceholder) {
            fs.writeFileSync(file, buf);
            saved = true;
          } else badBytes += 1;
        } else missing += 1;
      } catch {
        missing += 1;
      }
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
    if (saved) {
      const { error } = await db.from('items').update({ icon_url: `/images/items/${id}.gif` }).eq('id', id);
      if (error) throw new Error(`item ${id}: ${error.message}`);
      ok += 1;
    }
    if ((i + 1) % 250 === 0) console.log(`  ${i + 1}/${todo.length} (ok ${ok}, missing ${missing}, not-gif ${badBytes})`);
  }
  console.log(`done: ${ok} mirrored, ${missing} not found upstream, ${badBytes} rejected as non-GIF`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Mirrors the card artwork -- the real per-card picture, not the item icon.
//
// The site had no picture of a card worth showing. Our item icons are 313
// files that are only 8 distinct images, two of which cover 294 cards, so the
// icon column was removed on 8 Sep 2026 for saying nothing. Divine-Pride
// answers 200 for every card id under its item image paths but serves one
// card-back placeholder for all of them (checked: identical md5 across six
// ids). ratemyserver serves the actual artwork, id-addressed, and CLAUDE.md
// already lists it as a usable source for id-addressed item images.
//
// Checked before trusting, over all 315 cards: 290 come back as images that
// are distinct from every other card's, 20 are 404 (the Shibasays collab
// cards, the Taiwan exchange boxes, Bloody Knight) and 5 return an image
// another card already has -- Picky Poring gets Poring's picture, and four of
// the newest cards share one. Those 25 get no file, because a picture that
// belongs to a different card is worse than no picture.
//
// Two sizes are written, both WebP:
//   art/<id>.webp    150x200, the size the source is, for a card's own page
//   art/thumb/<id>.webp  60x80, for the list and the hover popup -- 50 rows
//                        of the full size would be ~400 KB a page
//
// Run:  node scripts/mirror-card-art.mjs [--dry-run] [--limit N]
//       python scripts/compress-card-art.py     <- writes the WebP files

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');
const limitFlag = process.argv.indexOf('--limit');
const limit = limitFlag === -1 ? Infinity : Number(process.argv[limitFlag + 1]);

// Raw GIFs land outside public/: they are the input to the WebP step, not
// something the site serves. Same shape as the prontera map images.
const RAW = path.join(process.cwd(), 'docs', 'card-art');
const SOURCE = (id) => `https://file5s.ratemyserver.net/items/large/${id}.gif`;

// ratemyserver's own "No Image" graphic, recorded in CLAUDE.md.
const NO_IMAGE_MD5_PREFIX = 'a34c3279';

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  const { data: cards, error } = await db
    .from('items')
    .select('id, name_en')
    .eq('category', 'Card')
    .order('id')
    .limit(2000);
  if (error) throw error;

  fs.mkdirSync(RAW, { recursive: true });
  const seen = new Map();
  const skipped = [];
  let written = 0;

  for (const card of cards.slice(0, limit)) {
    const response = await fetch(SOURCE(card.id));
    if (!response.ok) {
      skipped.push({ id: card.id, name: card.name_en, why: `HTTP ${response.status}` });
      continue;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    const hash = crypto.createHash('md5').update(bytes).digest('hex');
    if (hash.startsWith(NO_IMAGE_MD5_PREFIX)) {
      skipped.push({ id: card.id, name: card.name_en, why: 'No Image placeholder' });
      continue;
    }
    // The check that matters: an image another card already has is not this
    // card's artwork, whatever the host says.
    if (seen.has(hash)) {
      skipped.push({ id: card.id, name: card.name_en, why: `same image as ${seen.get(hash)}` });
      continue;
    }
    seen.set(hash, card.id);
    if (!dryRun) fs.writeFileSync(path.join(RAW, `${card.id}.gif`), bytes);
    written += 1;
    // A community site's bandwidth, so one at a time with a pause.
    await new Promise((resolve) => setTimeout(resolve, 60));
  }

  console.log(`${written} of ${Math.min(cards.length, limit)} cards have their own artwork${dryRun ? ' (dry run: nothing written)' : ''}`);
  console.log(`${skipped.length} skipped:`);
  for (const row of skipped) console.log(`  ${row.id} ${row.name} -- ${row.why}`);

  if (!dryRun) {
    // The list of what has no picture is written down, so the page can say how
    // many rather than leaving 25 quiet holes.
    fs.writeFileSync(
      path.join(RAW, '_skipped.json'),
      `${JSON.stringify({ builtBy: 'scripts/mirror-card-art.mjs', read: new Date().toISOString().slice(0, 10), skipped }, null, 2)}\n`,
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

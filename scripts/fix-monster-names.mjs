// Corrects monster names our import got wrong.
//
// Found on 7 Sep 2026 from the search log: 18 of the 359 searches typed into
// the monsters page in 90 days found nothing because the name in our table
// is misspelt -- somebody typing "willow" gets nothing, because the row says
// "Wilow". Google cannot find those pages for the right word either.
//
// The check is a card: a monster's card is named after it, so "Willow Card"
// beside a monster called "Wilow" is one of the two being wrong. Where a
// second, independent Zero database (the 3 Sep prontera crawl) agrees with
// the card, our row is the wrong one and gets corrected.
//
// Three names are deliberately NOT touched -- Assulter, Blood Butterfly and
// Poison Toad -- because both sources use both spellings, so there is no
// evidence either way. Goblin 1 is left alone too: prontera calls it
// "Goblin" but ours is part of a numbered 1-5 series, and searching "goblin"
// finds it either way.
//
// Run:  set -a; . ./.env.local; set +a; node scripts/fix-monster-names.mjs [--dry-run]

import { createClient } from '@supabase/supabase-js';

const dryRun = process.argv.includes('--dry-run');

// id, what we have, what the card and prontera both say.
const FIXES = [
  [1069, 'Sword Fish', 'Swordfish'],
  [1293, 'Cremy Fear', 'Creamy Fear'],
  [1047, 'Pecopeco Egg', 'Peco Peco Egg'],
  [1010, 'Wilow', 'Willow'],
  [1048, 'Thief Bug Egg', 'ThiefBug Egg'],
  [1054, 'Thief Bug', 'ThiefBug'],
  [1167, 'Savage Babe', 'Savage Bebe'],
  [1005, 'Farmiliar', 'Familiar'],
  [1019, 'Pecopeco', 'Peco Peco'],
  [1024, 'Worm Tail', 'Wormtail'],
  [1033, 'Elder Wilow', 'Elder Willow'],
  [1165, 'Sand Man', 'Sandman'],
  [1037, 'Side Winder', 'Sidewinder'],
  [1262, 'Mutant Dragon', 'Mutant Dragonoid'],
  [1188, 'Bon Gun', 'Bongun'],
  [1281, 'Sageworm', 'Sage Worm'],
  [1074, 'Shellfish', 'Shell Fish'],
  [1279, 'Tri Joint', 'Tri-Joint'],

  // Round two, 8 Sep 2026. The first pass compared names only where they
  // were nearly the same word; this pass asked the card outright, by
  // following the mob-to-card link in the prontera crawl rather than
  // matching strings. Twelve more monsters are filed under a name their own
  // card does not use -- and in every one of the twelve, prontera agrees
  // with the card. Somebody hunting "Moonlight Flower" or "Skeleton Worker"
  // found nothing at all.
  //
  // The names being replaced here are not typos, they are older or shorter
  // forms, and some of them are what a long-time player would still type.
  // Each one is kept in data/monster-former-names.json so the search still
  // answers to it.
  [1107, 'Desert Wolf B', 'Baby Desert Wolf'],
  [1246, 'Cookie Xmas', 'Christmas Cookie'],
  [1122, 'Goblin 1', 'Goblin'],
  [1280, 'Steam Goblin', 'Goblin Steamrider'],
  [1687, 'Green Iguana', 'Grove'],
  [1515, 'Garm Baby', 'Hatii Bebe'],
  [1150, 'Moonlight', 'Moonlight Flower'],
  [1255, 'Neraid', 'Nereid'],
  [1323, 'See Otter', 'Sea-Otter'],
  [1169, 'Skel Worker', 'Skeleton Worker'],
  [1499, 'Wootan Fighter', 'Utan Fighter'],
  [1498, 'Wootan Shooter', 'Utan Shooter'],
];

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY first');
  const db = createClient(url, key);

  let changed = 0;
  let skipped = 0;
  for (const [id, from, to] of FIXES) {
    const { data, error } = await db.from('monsters').select('id, name_en').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) {
      console.log(`  ${id}: no such monster, skipped`);
      skipped += 1;
      continue;
    }
    if (data.name_en === to) {
      skipped += 1;
      continue;
    }
    // Refuse to write when the row is not what this fix was written against:
    // a name that has since changed is a different decision, not this one.
    if (data.name_en !== from) {
      console.log(`  ${id}: expected "${from}", found "${data.name_en}" -- left alone`);
      skipped += 1;
      continue;
    }
    console.log(`  ${id}: ${from} -> ${to}`);
    if (!dryRun) {
      const { error: upError } = await db.from('monsters').update({ name_en: to }).eq('id', id);
      if (upError) throw upError;
    }
    changed += 1;
  }
  console.log(`${changed} renamed, ${skipped} left as they were${dryRun ? ' (dry run: nothing written)' : ''}`);
}

main().catch((e) => { console.error(e); process.exit(1); });

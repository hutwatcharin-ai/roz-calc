// Checks the slot this site derives for a card against a source that did it
// by hand.
//
// app/guides/cards reads the slot out of the client's own line in each
// card's description ("Equipped on : Weapon"). That is our own data, so it
// needs an outside witness before a page is built on it. The Encyclop'Elvyl
// spreadsheet (docs/elvyl-sheet) lists a slot for 112 cards, typed in by a
// player rather than parsed, which is exactly the independent check wanted.
//
// On 8 Sep 2026: 111 agree, 0 contradict, and the one that does not match is
// Ground Petite Card, whose description carries no slot line at all.
//
// Not a vitest file because it reads the live items table; run it when the
// items table changes or the sheet is refreshed.
//
// Run:  set -a; . ./.env.local; set +a; npx tsx scripts/check-card-slots.mts
import fs from 'node:fs';
import { cardSlot } from '../lib/card-roles';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first');

const res = await fetch(`${url}/rest/v1/items?select=id,name_en,description&category=eq.Card&limit=1000`, {
  headers: { apikey: key, Authorization: `Bearer ${key}` },
});
const cards: { id: number; name_en: string; description: string | null }[] = await res.json();

const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const byName = new Map(cards.map((c) => [squash(c.name_en.replace(/ Card$/, '')), c]));
const sheet: Record<string, string> = JSON.parse(
  fs.readFileSync('docs/elvyl-sheet/card-slots.json', 'utf-8'),
);

let agree = 0;
let absent = 0;
const noSlot: string[] = [];
const contradict: string[] = [];
for (const [name, slot] of Object.entries(sheet)) {
  const card = byName.get(squash(name));
  if (!card) { absent += 1; continue; }
  const ours = cardSlot(card.description);
  if (ours === slot) agree += 1;
  else if (ours === null) noSlot.push(`${name}: sheet says ${slot}, our description has no slot line`);
  else contradict.push(`${name}: sheet says ${slot}, we derive ${ours}`);
}

console.log(`agree ${agree} · no slot line here ${noSlot.length} · contradict ${contradict.length} · card not in our table ${absent}`);
for (const line of noSlot) console.log(`  · ${line}`);
for (const line of contradict) console.log(`  ! ${line}`);
if (contradict.length > 0) process.exit(1);

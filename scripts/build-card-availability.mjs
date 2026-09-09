// Works out which cards are actually in the game yet.
//
// Our items table holds every card the client ships, released or not, and the
// site has been listing all 315 of them as if a player could go and get one.
// 64 of them cannot be got: they belong to content that has not opened on the
// Global server.
//
// Two independent sources say so and this script only keeps what both of them
// support:
//
//   roz-global.info's card pages carry a "Disponibilité" column -- "Disponible"
//   or "Indisponible (JAN 2027)" (mirrored 8 Sep 2026, 267 cards).
//   rozerodb's card pages carry an "UPCOMING · JAN 2027" banner (crawled 31
//   Aug 2026, 262 cards).
//
// They overlap on 246 cards and disagree on none of them, which is what makes
// this worth publishing. Where only one source covers a card, that is recorded
// too, and the page says how many sources back the row.
//
// The dates are the patch a card arrives with, as each source prints it. They
// are plans, not promises, and the page says so.
//
// Run:  node scripts/build-card-availability.mjs

import fs from 'node:fs';
import path from 'node:path';

const GUIDE_TABLES = path.join(process.cwd(), 'docs', 'rozglobal-export', 'tables.json');
const ROZERODB_CARDS = path.join(process.cwd(), 'docs', 'rozerodb-export', 'data', 'cards.jsonl');
const DEST = path.join(process.cwd(), 'data', 'card-availability.json');

const squash = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '');

/** "OCT 2026" -> a sortable key, so the page can order by when a card lands. */
const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };

function guideRows() {
  const tables = JSON.parse(fs.readFileSync(GUIDE_TABLES, 'utf8'))['cartes-equipement.html'];
  const out = new Map();
  for (const table of tables) {
    for (const row of table.rows.slice(1)) {
      // "Bébé Orc (Orc Baby) ⭐" -- the English name is the one in brackets,
      // and it is the one our items table uses.
      const bracketed = /\(([^)]+)\)/.exec(row[0]);
      const name = (bracketed ? bracketed[1] : row[0]).replace('⭐', '').trim();
      const available = row[2].startsWith('Disponible');
      const when = /Indisponible \(([^)]+)\)/.exec(row[2]);
      out.set(squash(name), {
        available,
        when: available || !when || when[1] === 'date inconnue' ? null : when[1].toUpperCase(),
      });
    }
  }
  return out;
}

function rozerodbRows() {
  const out = new Map();
  for (const line of fs.readFileSync(ROZERODB_CARDS, 'utf8').split('\n').filter(Boolean)) {
    const row = JSON.parse(line);
    // Only per-card pages: the listing page carries the banner of whichever
    // card it happens to mention first.
    if (!/\/cards\/[a-z0-9-]+$/.test(row.url ?? '')) continue;
    const name = (row.title ?? '').split(' - ')[0].replace(/\bCard\b/, '').trim();
    const text = (row.text ?? '').split(/\s+/).join(' ');
    const upcoming = /UPCOMING\s*·\s*([A-Z]{3}\s*\d{4})/.exec(text);
    out.set(squash(name), { available: !upcoming, when: upcoming ? upcoming[1].replace(/\s+/, ' ') : null });
  }
  return out;
}

function main() {
  const guide = guideRows();
  const rozerodb = rozerodbRows();

  const names = new Set([...guide.keys(), ...rozerodb.keys()]);
  const cards = {};
  let conflicts = 0;
  let both = 0;

  for (const key of names) {
    const a = guide.get(key);
    const b = rozerodb.get(key);
    if (a && b) {
      both += 1;
      if (a.available !== b.available) {
        conflicts += 1;
        console.log(`  conflict on ${key}: guide ${a.available ? 'available' : 'not'}, rozerodb ${b.available ? 'available' : 'not'}`);
        // A card the sources disagree about is left out entirely: a wrong
        // "not in the game yet" is worse than saying nothing.
        continue;
      }
    }
    const merged = a ?? b;
    if (merged.available) continue; // Available is the default; only the gaps are stored.
    const when = a?.when ?? b?.when ?? null;
    const month = when ? MONTHS[when.slice(0, 3)] : null;
    const year = when ? Number(when.slice(-4)) : null;
    cards[key] = {
      when,
      sortKey: year && month ? year * 100 + month : 999999,
      sources: [a ? 'roz-global.info' : null, b ? 'rozerodb' : null].filter(Boolean),
    };
  }

  const sorted = Object.fromEntries(Object.keys(cards).sort().map((key) => [key, cards[key]]));
  fs.writeFileSync(
    DEST,
    `${JSON.stringify(
      {
        _meta: {
          builtBy: 'scripts/build-card-availability.mjs',
          guideCards: guide.size,
          rozerodbCards: rozerodb.size,
          coveredByBoth: both,
          conflicts,
          note: 'Only cards that are NOT in the game yet are listed. Keys are the English card name with everything but letters and digits removed.',
        },
        cards: sorted,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`${guide.size} cards from the guide, ${rozerodb.size} from rozerodb, ${both} covered by both`);
  console.log(`${conflicts} conflicts, ${Object.keys(sorted).length} cards recorded as not released yet`);
}

main();

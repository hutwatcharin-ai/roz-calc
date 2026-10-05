import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

// A number written into a sentence is a claim about the database, and the
// database changes. On 8 Sep 2026 an import of ten monsters left four
// published claims wrong at once -- the monsters page titled "349 ตัว" over a
// list of 359, and "524 ตัว" in three places for a table of 534 -- and a
// fifth, "อุปกรณ์กว่า 1,800 ชิ้น" on the home page, had been claiming double
// the real 876 for longer than that. Nothing threw and no test failed.
//
// So this test reads the pages the way a reader does: it strips the comments
// and looks for a bare number in front of a unit that names something we
// count. Anything it finds has to be listed below with a reason, which
// forces the question "is this a live count or a historical fact" to be
// answered in writing rather than by accident.

const UNITS = ['ตัว', 'ชิ้น', 'แถว', 'ใบ', 'แมพ'];
const CLAIM = new RegExp(String.raw`\d[\d,]{1,}\s*(?:${UNITS.join('|')})`, 'g');

/**
 * Numbers that are deliberately literal, each with the reason. A literal is
 * right only when the sentence is about something that happened once; if it
 * describes what is in the database now, it belongs in lib/counts.
 */
const ALLOWED: { file: string; text: string; why: string }[] = [
  { file: 'app/admin/prices/page.tsx', text: '50 ชิ้น', why: 'an example of the stack input (50 pieces for 150z), not a count of anything' },
  { file: 'app/news/events-2026-10/page.tsx', text: '66 ตัว', why: 'Baphomet Jr. kill count for the daily quest, from the NPC dialogue' },
  { file: 'app/news/events-2026-10/page.tsx', text: '30 ตัว', why: 'Ancient Mummy kill count for the Amon Ra daily quest, from the NPC dialogue' },
  { file: 'app/guides/memorial-dungeons/page.tsx', text: '50 ชิ้น', why: 'Jellopy cost of one headgear enchant, a game price quoted from the guide' },
  {
    file: 'app/guides/faq/page.tsx',
    text: '10 ใบ',
    why: 'the Gym card cap (10 cards, +2,000 weight) as the clip shows it; a game rule, not a count of anything this site holds',
  },
  {
    file: 'app/guides/social/page.tsx',
    text: '10 ใบ',
    why: 'the Gym card cap (10 cards, +2,000 weight) as the clip shows it; a game rule, not a count of anything this site holds',
  },
  {
    file: 'app/guides/social/page.tsx',
    text: '20 อัน',
    why: 'worked example: level 60 needs 20 Zelstar at one per level above 40; arithmetic on the stated rule, not a database count',
  },
  {
    file: 'app/guides/nordfeld-helm/page.tsx',
    text: '100 ชิ้น',
    why: 'the helm price one clip mentions in passing, quoted only to say the two on-screen clips show 300; not a count of anything this site holds',
  },
  {
    file: 'app/guides/guild/page.tsx',
    text: '20 ชิ้น',
    why: 'what one player got in a day of farming, quoted from the video named beside it -- an observation about drop rates, not a count of anything this site holds',
  },
  {
    file: 'app/guides/guild/page.tsx',
    text: '50 ตัว',
    why: 'the kill target of one daily guild quest as the video shows it (30+ bracket); a quest requirement, not a count of anything this site holds',
  },
  {
    file: 'app/guides/guild/page.tsx',
    text: '10 ชิ้น',
    why: 'the contents of the event participation reward as the video reports them; the reward is not in our data at all',
  },
  {
    file: 'app/about/page.tsx',
    text: '1,200 ชิ้น',
    why: 'what rozerodb contributed at import time, not a count of the items table now',
  },
  {
    file: 'app/about/page.tsx',
    text: '524 ตัว',
    why: 'the monsters that were cross-checked against ragnarokzero.net; the ten added on 8 Sep 2026 were checked against other sources, so a live count would claim a check that never happened',
  },
  {
    file: 'app/about/page.tsx',
    text: '410 แถว',
    why: 'unknown-rate drops contributed by midgardhub; verified against the table on 9 Sep 2026 and still exact',
  },
  {
    file: 'app/news/battle-pass-summer-2026/page.tsx',
    text: '30 ตัว',
    why: 'the kill count a Battle Pass daily mission asks for, quoted from the official event notice -- a rule of the event, not a count of anything in our tables',
  },
];

/** Everything a reader sees: comments removed, strings and JSX kept. */
function withoutComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // `//` only when it does not follow a colon, so a https:// URL survives.
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.tsx') && !entry.name.includes('.test.')) out.push(full);
  }
  return out;
}

describe('numbers written into page copy', () => {
  const files = [...walk('app'), ...walk('components')];

  it('reads enough files to be meaningful', () => {
    expect(files.length).toBeGreaterThan(30);
  });

  it('has no unexplained hardcoded total', () => {
    const found: string[] = [];
    for (const file of files) {
      const rel = file.split(path.sep).join('/');
      const text = withoutComments(fs.readFileSync(file, 'utf8'));
      for (const match of text.match(CLAIM) ?? []) {
        const claim = match.trim();
        const allowed = ALLOWED.some((a) => a.file === rel && claim.startsWith(a.text.split(' ')[0]));
        if (!allowed) found.push(`${rel}: "${claim}"`);
      }
    }
    // The message carries the fix, because whoever trips this will be someone
    // adding copy, not someone who has read this file.
    expect(found, `count these from the database (lib/counts) or add them to ALLOWED with a reason:\n${found.join('\n')}`).toEqual([]);
  });

  it('keeps the allowlist honest: every entry is still in the file it names', () => {
    for (const entry of ALLOWED) {
      const text = withoutComments(fs.readFileSync(entry.file, 'utf8'));
      expect(text, `${entry.file} no longer contains "${entry.text}" -- drop the allowlist entry`).toContain(entry.text);
      expect(entry.why.length).toBeGreaterThan(20);
    }
  });
});

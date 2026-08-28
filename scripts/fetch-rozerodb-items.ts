// Fetches the items our own source never had, from rozerodb.
//
// Why this exists: data/raw/items.json carries 1,300 items and stops there.
// Red Potion, id 501, is not in it, and neither are 312 other ids in the
// 501-1100 range -- the ordinary consumables and materials a player looks up
// most. ragnarokzero.net publishes exactly the same 1,300, because both trace
// to the same TWRoZ dump, so it could not fill the gap either.
//
// rozerodb publishes 1,649 items, 1,237 of which we do not have. Its robots.txt
// allows everything except /api/, and this reads the rendered pages rather than
// that API. One request at a time with a delay, and only for the ids we are
// missing -- 1,237 pages instead of 1,649.
//
// Fetching and importing are separate on purpose: this writes a file, which can
// be inspected and diffed before anything touches the database, and a re-run
// after a failure does not re-request what it already has.
//
// Run it with:
//   npx tsx scripts/fetch-rozerodb-items.ts [--limit N]
// Writes data/raw/rozerodb-items.json. Import with scripts/import-rozerodb-items.ts.

import * as fs from 'fs';
import * as path from 'path';

const SITEMAP = 'https://rozerodb.com/sitemap.xml';
const OUT = path.join(process.cwd(), 'data', 'raw', 'rozerodb-items.json');
const DELAY_MS = 300;

export interface FetchedItem {
  id: number;
  name: string;
  category: string;
  slotType: string | null;
  atk: number | null;
  def: number | null;
  slots: number | null;
  requiredLevel: number | null;
  weight: number | null;
  buy: number | null;
  sell: number | null;
  description: string | null;
}

function textOf(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

/** "55,000" -> 55000. An em dash means the page is saying there is no price. */
function money(raw: string | undefined): number | null {
  if (raw === undefined) return null;
  const cleaned = raw.replace(/,/g, '').trim();
  if (cleaned === '' || cleaned === '—' || cleaned === '-') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function parseItemPage(text: string): FetchedItem | null {
  // "← Item Red Potion # 501 Category Consumable Slot / type - ATK 0 ..."
  const head = /← Item (.+?) # (\d+) Category (.+?) Slot \/ type (.+?) ATK ([\d,-]+) DEF ([\d,-]+) Slots (\d+) Required level (\d+) Weight ([\d,]+) (?:NPC )?Buy (.+?) Sell (.+?) Description (.*)$/.exec(
    text,
  );
  if (!head) return null;

  // The description runs until the next section heading. Those headings are the
  // page's own words, so they are listed rather than guessed at with a cut-off
  // length that would truncate a long description or swallow a short one.
  const STOP = /(Dropped by \(|Crafting use|Z SOLD BY NPC|Equipped on :|✦ OB|RO ZERO DATABASE)/;
  const rest = head[12];
  const stop = STOP.exec(rest);
  const description = (stop ? rest.slice(0, stop.index) : rest).trim();

  const slotType = head[4].trim();

  return {
    id: Number(head[2]),
    name: head[1].trim(),
    category: head[3].trim(),
    slotType: slotType === '-' || slotType === '' ? null : slotType,
    atk: money(head[5]),
    def: money(head[6]),
    slots: Number(head[7]),
    requiredLevel: Number(head[8]),
    weight: money(head[9]),
    buy: money(head[10]),
    sell: money(head[11]),
    description: description === '' ? null : description,
  };
}

async function idsWeAreMissing(): Promise<number[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('export NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY first');

  const ours = new Set<number>();
  for (let offset = 0; ; offset += 1000) {
    const res = await fetch(`${url}/rest/v1/items?select=id&order=id&limit=1000&offset=${offset}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    const rows = (await res.json()) as { id: number }[];
    for (const row of rows) ours.add(row.id);
    if (rows.length < 1000) break;
  }

  const sitemap = await fetch(SITEMAP);
  if (!sitemap.ok) throw new Error(`sitemap: ${sitemap.status}`);
  const theirs = [...(await sitemap.text()).matchAll(/rozerodb\.com\/items\/(\d+)/g)].map((m) => Number(m[1]));

  const missing = [...new Set(theirs)].filter((id) => !ours.has(id)).sort((a, b) => a - b);
  console.log(`we have ${ours.size} items, they list ${new Set(theirs).size}, we are missing ${missing.length}`);
  return missing;
}

async function main(): Promise<void> {
  const limitArg = process.argv.indexOf('--limit');
  const limit = limitArg === -1 ? Infinity : Number(process.argv[limitArg + 1]);

  // Anything already fetched is kept, so a run interrupted at item 900 resumes
  // rather than asking their server for the same 900 pages again.
  const existing: Record<string, FetchedItem> = fs.existsSync(OUT)
    ? Object.fromEntries((JSON.parse(fs.readFileSync(OUT, 'utf8')) as FetchedItem[]).map((i) => [i.id, i]))
    : {};
  console.log(`${Object.keys(existing).length} already fetched`);

  const missing = (await idsWeAreMissing()).filter((id) => !existing[id]).slice(0, limit);
  console.log(`fetching ${missing.length} pages at one every ${DELAY_MS}ms`);

  let failed = 0;
  for (const [i, id] of missing.entries()) {
    try {
      const res = await fetch(`https://rozerodb.com/items/${id}`);
      if (res.ok) {
        const parsed = parseItemPage(textOf(await res.text()));
        if (parsed) existing[parsed.id] = parsed;
        else failed += 1;
      } else failed += 1;
    } catch {
      failed += 1;
    }
    if ((i + 1) % 100 === 0) {
      console.log(`  ${i + 1}/${missing.length} (${failed} unreadable)`);
      fs.writeFileSync(OUT, JSON.stringify(Object.values(existing), null, 1));
    }
    await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  fs.writeFileSync(OUT, JSON.stringify(Object.values(existing), null, 1));
  console.log(`wrote ${Object.keys(existing).length} items to ${OUT}`);
  console.log(`${failed} pages could not be read or parsed`);
  if (failed > missing.length * 0.05) {
    console.log('more than 5% failed -- check the page layout before importing');
    process.exitCode = 1;
  }
}

if (process.argv[1]?.includes('fetch-rozerodb-items')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

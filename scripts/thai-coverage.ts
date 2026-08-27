// Reports how much of the item-description corpus renders in Thai, and writes
// the untranslated lines to a file so the next batch has a work list.
//
// Three numbers, and they answer different questions -- confusing them is how a
// coverage claim ends up overstating the work by a factor of two:
//   thai         lines that render actual Thai
//   english      lines whose term is in the dictionary with NULL: deliberately
//                English, and finished
//   untranslated lines with no dictionary entry at all: the remaining work
//
// Run it with:  npx tsx scripts/thai-coverage.ts
// Needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the
// environment. In bash:  set -a && . ./.env.local && set +a

import * as fs from 'fs';
import { supabaseAdmin } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetch-all-rows';
import { composeThaiDescription } from '../lib/item-description-th';

const GAP_FILE = 'lines-gap.tsv';

async function main(): Promise<void> {
  const db = supabaseAdmin();

  const items = await fetchAllRows<{ id: number; description: string | null }>((from, to) =>
    db.from('items').select('id, description').order('id').range(from, to),
  );
  const terms = await fetchAllRows<{ source_term: string; thai_term: string | null }>((from, to) =>
    db.from('item_description_terms').select('source_term, thai_term').order('source_term').range(from, to),
  );
  const lines = await fetchAllRows<{ source_line: string; thai_line: string }>((from, to) =>
    db.from('item_description_lines').select('source_line, thai_line').order('source_line').range(from, to),
  );
  const failure = items.error ?? terms.error ?? lines.error;
  if (failure) throw new Error(`Failed to read the corpus: ${failure.message}`);

  const dict = {
    terms: new Map((terms.data ?? []).map((t) => [t.source_term, t.thai_term])),
    lines: new Map((lines.data ?? []).map((l) => [l.source_line, l.thai_line])),
  };

  let total = 0;
  let thai = 0;
  let english = 0;
  const gap = new Map<string, number>();

  for (const item of items.data ?? []) {
    for (const line of composeThaiDescription(item.description, dict)) {
      total += 1;
      if (line.thai === null) gap.set(line.source, (gap.get(line.source) ?? 0) + 1);
      else if (line.thai === line.source) english += 1;
      else thai += 1;
    }
  }

  const untranslated = [...gap.values()].reduce((n, c) => n + c, 0);
  const pct = ((thai / total) * 100).toFixed(1);
  console.log(`${total} lines across ${(items.data ?? []).length} items`);
  console.log(`  ${thai} render Thai (${pct}%)`);
  console.log(`  ${english} render English on purpose (a NULL dictionary entry)`);
  console.log(`  ${untranslated} untranslated, ${gap.size} of them distinct`);

  const sorted = [...gap].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  fs.writeFileSync(GAP_FILE, sorted.map(([line, n]) => `${n}\t${line}`).join('\n'), 'utf8');
  console.log(`wrote ${GAP_FILE}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });

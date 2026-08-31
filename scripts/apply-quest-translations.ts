// Applies a translation batch file: JSON {"<id>": {"n": name_th?, "o": objective_th?, "d": description_th?}}
// Null-only in spirit: it overwrites the *_th columns (they are ours to write),
// never the English source columns.
// Usage: npx tsx scripts/apply-quest-translations.ts data/quest-th/batch-1.json
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
async function main() {
  const file = process.argv[2];
  const batch = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, { n?: string; o?: string; d?: string }>;
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  let done = 0;
  for (const [id, t] of Object.entries(batch)) {
    const patch: Record<string, string> = {};
    if (t.n) patch.name_th = t.n;
    if (t.o) patch.objective_th = t.o;
    if (t.d) patch.description_th = t.d;
    if (Object.keys(patch).length === 0) continue;
    const { error } = await db.from('quests').update(patch).eq('id', Number(id));
    if (error) throw new Error(`${id}: ${error.message}`);
    done += 1;
  }
  console.log(`applied ${done} quests from ${file}`);
}
main();

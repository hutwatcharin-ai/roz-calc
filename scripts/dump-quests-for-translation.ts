// Prints untranslated quests compactly, for the translation batches.
// Usage: npx tsx scripts/dump-quests-for-translation.ts <offset> <limit>
import { createClient } from '@supabase/supabase-js';
async function main() {
  const offset = Number(process.argv[2] ?? 0);
  const limit = Number(process.argv[3] ?? 90);
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await db
    .from('quests')
    .select('id, name, objective, description')
    .is('name_th', null)
    .order('id')
    .range(offset, offset + limit - 1);
  if (error) throw error;
  for (const q of data ?? []) {
    console.log(`#${q.id}|${q.name}|${q.objective ?? ''}|${(q.description ?? '').replace(/\n/g, ' ')}`);
  }
  console.log(`-- ${data?.length} rows`);
}
main();

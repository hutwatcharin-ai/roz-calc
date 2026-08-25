// app/drop-finder/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import DropSearch from '@/components/DropSearch';

// Resolve the search text to exactly one item. An exact (case-insensitive)
// name wins outright; only if nothing matches exactly do we fall back to a
// substring match. The caller surfaces the resolved name so a fallback match
// is visible to the user instead of silently picking an arbitrary row.
async function resolveItem(db: ReturnType<typeof supabaseBrowser>, query: string) {
  const { data: exact, error: exactError } = await db
    .from('items')
    .select('id, name_en')
    .ilike('name_en', query)
    .limit(1);

  if (exactError) {
    console.error('item exact lookup failed', exactError);
    return null;
  }
  if (exact && exact.length > 0) return exact[0];

  const { data: partial, error: partialError } = await db
    .from('items')
    .select('id, name_en')
    .ilike('name_en', `%${query}%`)
    .order('name_en')
    .limit(1);

  if (partialError) {
    console.error('item substring lookup failed', partialError);
    return null;
  }
  if (!partial || partial.length === 0) return null;

  return partial[0];
}

async function findDrops(query: string) {
  if (!query) return { resolvedName: null, rows: [] };
  const db = supabaseBrowser();

  const item = await resolveItem(db, query);
  if (!item) return { resolvedName: null, rows: [] };

  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('monster_id, rate, monsters(name_en)')
    .eq('item_id', item.id)
    .order('rate', { ascending: false })
    .limit(10);

  if (dropsError || !drops) {
    if (dropsError) console.error('monster_drops query failed', dropsError);
    return { resolvedName: item.name_en, rows: [] };
  }

  return {
    resolvedName: item.name_en as string,
    rows: drops.map((d: any) => ({
      monster_id: d.monster_id,
      monster_name: d.monsters.name_en,
      rate: d.rate,
    })),
  };
}

export default async function DropFinderPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? '';
  const { resolvedName, rows } = await findDrops(query);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ค้นของดรอป</h1>
      <div className="panel" style={{ marginTop: 20 }}>
        <DropSearch query={query} resolvedName={resolvedName} rows={rows} />
      </div>
    </main>
  );
}

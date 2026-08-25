// app/drop-finder/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import DropSearch from '@/components/DropSearch';

async function findDrops(query: string) {
  if (!query) return [];
  const db = supabaseBrowser();
  const { data: items, error: itemsError } = await db
    .from('items')
    .select('id')
    .ilike('name_en', `%${query}%`)
    .limit(1);

  if (itemsError || !items || items.length === 0) return [];

  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('monster_id, rate, monsters(name_en)')
    .eq('item_id', items[0].id)
    .order('rate', { ascending: false })
    .limit(10);

  if (dropsError || !drops) return [];

  return drops.map((d: any) => ({
    monster_id: d.monster_id,
    monster_name: d.monsters.name_en,
    rate: d.rate,
  }));
}

export default async function DropFinderPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? '';
  const rows = await findDrops(query);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ค้นของดรอป</h1>
      <div className="panel" style={{ marginTop: 20 }}>
        <DropSearch query={query} rows={rows} />
      </div>
    </main>
  );
}

// app/drop-finder/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import DropSearch from '@/components/DropSearch';
import { escapeLikePattern } from '@/lib/like-escape';

export const metadata = {
  title: 'ค้นหาว่าของชิ้นนี้ดรอปจากมอนตัวไหน',
  description: 'พิมพ์ชื่อไอเทมแล้วดูว่ามอนสเตอร์ตัวไหนดรอป อัตราดรอปเท่าไร และเจอมอนตัวนั้นได้ที่แมพไหน',
};

// Resolve the search text to exactly one item. An exact (case-insensitive)
// name wins outright; only if nothing matches exactly do we fall back to a
// substring match. The caller surfaces the resolved name so a fallback match
// is visible to the user instead of silently picking an arbitrary row.
async function resolveItem(db: ReturnType<typeof supabaseBrowser>, query: string) {
  const needle = escapeLikePattern(query);
  const { data: exact, error: exactError } = await db
    .from('items')
    .select('id, name_en')
    .ilike('name_en', needle)
    .limit(1);

  if (exactError) {
    console.error('item exact lookup failed', exactError);
    return null;
  }
  if (exact && exact.length > 0) return exact[0];

  const { data: partial, error: partialError } = await db
    .from('items')
    .select('id, name_en')
    .ilike('name_en', `%${needle}%`)
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
  if (!query) return { resolvedName: null, resolvedId: null, rows: [] };
  const db = supabaseBrowser();

  const item = await resolveItem(db, query);
  if (!item) return { resolvedName: null, resolvedId: null, rows: [] };

  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('monster_id, rate, monsters(name_en, image_url, level, is_aggressive, atk_max)')
    .eq('item_id', item.id)
    .order('rate', { ascending: false })
    .limit(10);

  if (dropsError || !drops) {
    if (dropsError) console.error('monster_drops query failed', dropsError);
    return { resolvedName: item.name_en, resolvedId: item.id as number, rows: [] };
  }

  return {
    resolvedName: item.name_en as string,
    resolvedId: item.id as number,
    rows: drops.map((d: any) => ({
      monster_id: d.monster_id,
      monster_name: d.monsters.name_en,
      monster_image_url: d.monsters.image_url as string | null,
      monster_level: (d.monsters.level ?? null) as number | null,
      is_aggressive: (d.monsters.is_aggressive ?? null) as boolean | null,
      atk_max: (d.monsters.atk_max ?? null) as number | null,
      rate: d.rate,
    })),
  };
}

export default async function DropFinderPage({ searchParams }: { searchParams: { q?: string } }) {
  const query = searchParams.q ?? '';
  const { resolvedName, resolvedId, rows } = await findDrops(query);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ค้นของดรอป</h1>
      <div className="panel" style={{ marginTop: 20 }}>
        <DropSearch query={query} resolvedName={resolvedName} resolvedId={resolvedId} rows={rows} />
      </div>
    </main>
  );
}

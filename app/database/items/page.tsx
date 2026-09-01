// app/database/items/page.tsx
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import ItemIcon from '@/components/ItemIcon';
import FilterState, { EmptyState } from '@/components/FilterState';
import RecentlyViewed from '@/components/RecentlyViewed';
import Pagination from '@/components/Pagination';
import { escapeLikePattern } from '@/lib/like-escape';

export const metadata = {
  title: 'ฐานข้อมูลไอเทม',
  description: 'ไอเทมทั้งหมดในเกม Ragnarok Zero Global พร้อมค่าพลังโจมตี เลเวลที่ใช้ได้ อาชีพที่ใส่ได้ และมอนสเตอร์ที่ดรอป',
};

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

const PAGE_SIZE = 50;
// Every category present in the table. Enchantment, Enchant Stone and Special
// arrived with the 1,222 items rozerodb had and our own source never did; they
// are kept as their own options rather than folded into Other, because a
// category nobody can filter to is a category nobody finds.
// scripts/import-rozerodb-items.ts prints any category word it could not map,
// which is how these three were noticed.
// Consumables and materials only: equipment and cards moved to their own
// pages (/database/equipment, /database/cards), rozerodb-style. Legacy
// category params for those redirect below instead of 404-ing old links.
const CATEGORIES = [
  'Consumable / Recovery',
  'Enchant Stone',
  'Enchantment',
  'Other',
  'Pet',
  'Special',
];
const MOVED: Record<string, string> = {
  Weapon: '/database/equipment?category=Weapon',
  Armor: '/database/equipment?category=Armor',
  'Costume Equipment': '/database/equipment?category=Costume%20Equipment',
  Card: '/database/cards',
};

export default async function ItemListPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  // The default view is the wearable/usable catalog: costumes are a quarter
  // of the table and pure vanity, so they only appear when asked for --
  // via their own category or the explicit "all" option.
  const category = searchParams.category ?? '';
  if (MOVED[category]) redirect(MOVED[category]);
  const SORTS = {
    id: { label: 'รหัสไอเทม', column: 'id', ascending: true },
    name: { label: 'ชื่อ A-Z', column: 'name_en', ascending: true },
    buy: { label: 'ราคาซื้อสูงก่อน', column: 'buy_price', ascending: false },
  } as const;
  const sort = (searchParams.sort ?? 'id') in SORTS ? ((searchParams.sort ?? 'id') as keyof typeof SORTS) : 'id';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();
  let query = db.from('items').select('id, name_en, category, weapon_type, icon_url', { count: 'exact' });

  if (q) {
    const needle = escapeLikePattern(q);
    query = query.ilike('name_en', `%${needle}%`);
  }
  if (category) {
    query = query.eq('category', category);
  } else {
    // The default view is this section's whole scope: usable items, not gear.
    query = query.in('category', CATEGORIES);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data: items, count, error } = await query
    .order(SORTS[sort].column, { ascending: SORTS[sort].ascending, nullsFirst: false })
    .order('id')
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('items list query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort !== 'id') params.set('sort', sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/items${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลไอเทม Ragnarok Zero" />
      <RecentlyViewed />
      <FilterState
        count={count ?? 0}
        unit="ชิ้น"
        filters={[
          { label: 'คำค้น', value: q },
          { label: 'หมวด', value: category },
        ]}
        clearHref="/database/items"
      />

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อไอเทม..." />
        <select name="category" defaultValue={category}>
          <option value="">ทุกหมวด</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              เรียง: {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
        <Link href="/database/equipment" className="btn" style={{ textDecoration: 'none' }}>
          อุปกรณ์
        </Link>
        <Link href="/database/cards" className="btn" style={{ textDecoration: 'none' }}>
          การ์ด
        </Link>
      </form>

      {(items ?? []).length === 0 ? (
        <div className="card">
          <EmptyState what={q || undefined} clearHref="/database/items" />
        </div>
      ) : (
      <div className="card">
{/* A card grid, not a table: with sprites now mirrored for every item, the
            icon carries recognition -- players know items by sprite before name.
            Multi-column also makes 50 items shorter on a phone than the old
            three-column table stack was (UX audit: item list was 5.7 screens). */}
        <div className="itemgrid">
          {(items ?? []).map((it) => (
            <Link key={it.id} href={`/database/items/${it.id}`} className="itemcard">
              <ItemIcon iconUrl={it.icon_url} category={it.category} size={32} />
              <span className="itemcard__name">{it.name_en}</span>
              <span className="itemcard__meta">
                {it.category ?? '—'}
                {it.weapon_type ? ` · ${it.weapon_type}` : ''}
              </span>
            </Link>
          ))}
        </div>
      </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} total={count ?? 0} pageSize={PAGE_SIZE} />
    </main>
  );
}

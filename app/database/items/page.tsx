// app/database/items/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
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
const CATEGORIES = [
  'Armor',
  'Card',
  'Consumable / Recovery',
  'Costume Equipment',
  'Enchant Stone',
  'Enchantment',
  'Other',
  'Pet',
  'Special',
  'Weapon',
];

export default async function ItemListPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const category = searchParams.category ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();
  let query = db.from('items').select('id, name_en, category, weapon_type, icon_url', { count: 'exact' });

  if (q) {
    const needle = escapeLikePattern(q);
    query = query.ilike('name_en', `%${needle}%`);
  }
  if (category) query = query.eq('category', category);

  const from = (page - 1) * PAGE_SIZE;
  const { data: items, count, error } = await query.order('id').range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('items list query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/items${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลไอเทม" />
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
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>หมวด</th>
              <th>ประเภทอาวุธ</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it) => (
              <tr key={it.id}>
                <td data-label="">
                  <Link href={`/database/items/${it.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {it.icon_url && (
                      <img src={it.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {it.name_en}
                  </Link>
                </td>
                <td data-label="หมวด">{it.category ?? '—'}</td>
                <td data-label="ประเภทอาวุธ">{it.weapon_type ?? '—'}</td>
              </tr>
            ))}
            {(items ?? []).length === 0 && (
              <tr>
                <td colSpan={3} style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  ไม่พบไอเทมที่ตรงเงื่อนไข
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}

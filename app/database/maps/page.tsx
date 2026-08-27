// app/database/maps/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลแมพ',
  description:
    'แมพทั้งหมดในเกม Ragnarok Zero Global พร้อมจำนวนมอนสเตอร์ที่เกิดในแต่ละแมพ กดเข้าไปดูว่ามีมอนอะไรบ้าง',
};

const PAGE_SIZE = 50;

export default async function MapsPage({
  searchParams,
}: {
  searchParams: { q?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // map_stats is one row per map -- 497 of them, inside the 1,000-row cap --
  // so this pages in SQL with an exact count instead of pulling 3,032 spawn
  // rows across four requests and grouping them here.
  let query = db.from('map_stats').select('map_code, map_display_name, monster_count', { count: 'exact' });

  if (q) {
    // Escape the LIKE metacharacters so a literal % or _ matches itself
    // instead of acting as a wildcard. Backslash is Postgres's default LIKE
    // escape character, so it must be escaped first or it would consume the
    // escapes added after it.
    const needle = q.replace(/[\\%_]/g, (ch) => `\\${ch}`);
    query = query.ilike('search_text', `%${needle}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  // Ordered by monster_count then map_code. map_code is unique in this view,
  // so the sort is total and paging is stable -- the property the raw table
  // could not offer.
  const { data: maps, count, error } = await query
    .order('monster_count', { ascending: false })
    .order('map_code')
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('maps query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/maps${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 style={{ fontFamily: '"Chakra Petch", sans-serif', fontSize: 32 }}>ฐานข้อมูลแมพ</h1>
      {/* A query error and a genuine zero-result search must read differently --
          otherwise an outage looks identical to "there are no maps", which is
          false. */}
      <p style={{ color: 'var(--faint)', marginTop: 6 }}>
        {error ? 'โหลดจำนวนแมพไม่สำเร็จ' : `${count ?? 0} แมพ`}
      </p>
      <p style={{ color: 'var(--faint)', marginTop: 4, fontSize: 13 }}>
        แมพบางแห่งแสดงแค่รหัส เพราะไม่มีชื่อเรียกอื่นนอกจากรหัสแมพเอง ไม่ได้แปลว่าแมพนั้นไม่มีอยู่
      </p>

      <form style={{ display: 'flex', gap: 10, flexWrap: 'wrap', margin: '20px 0' }}>
        <input className="mono" type="text" name="q" defaultValue={q} placeholder="ค้นชื่อหรือรหัสแมพ..." />
        <button type="submit">ค้นหา</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>แมพ</th>
              <th>รหัส</th>
              <th className="num">จำนวนมอน</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={3} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง
                </td>
              </tr>
            ) : (
              <>
                {(maps ?? []).map((m) => (
                  <tr key={m.map_code}>
                    <td data-label="">
                      <Link href={`/database/maps/${encodeURIComponent(m.map_code)}`}>
                        {/* map_display_name is populated for every row today --
                            111 of 497 just repeat their own map_code, which is
                            handled above by showing the code either way. This
                            fallback guards a null the column's type still
                            allows, not a shape the current data exercises. */}
                        {m.map_display_name ?? m.map_code}
                      </Link>
                    </td>
                    <td data-label="รหัส" className="mono">{m.map_code}</td>
                    <td data-label="จำนวนมอน" className="num">{m.monster_count}</td>
                  </tr>
                ))}
                {(maps ?? []).length === 0 && (
                  <tr>
                    <td colSpan={3} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                      ไม่พบแมพที่ตรงเงื่อนไข
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}

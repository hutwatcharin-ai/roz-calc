// app/database/maps/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { escapeLikePattern } from '@/lib/like-escape';

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
  // rows across four requests and grouping them here. The other three list
  // pages fetch everything and paginate/clamp in memory, so an out-of-range
  // page never reaches Postgres; this page pages in SQL, so the requested
  // page must be clamped to what the search actually matches *before* the
  // ranged request is built, or an out-of-range page (e.g. ?page=11 when the
  // search only fills 10) hits Postgres as a 416 range-not-satisfiable error,
  // which supabase-js reports the same way as a real outage.
  //
  // That clamp needs a row count, and a count only comes back from a query --
  // so this runs the filter twice: once head-only (count, no rows) to learn
  // how many pages exist, then again with the clamped range for the actual
  // rows. The extra round trip is the price of never asking Postgres for a
  // range it cannot serve.
  function filtered(head: boolean) {
    let query = db
      .from('map_stats')
      .select('map_code, map_display_name, monster_count', { count: 'exact', head });
    if (q) {
      const needle = escapeLikePattern(q);
      query = query.ilike('search_text', `%${needle}%`);
    }
    return query;
  }

  const { count, error: countError } = await filtered(true);
  if (countError) {
    console.error('maps count query failed', countError);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const from = (safePage - 1) * PAGE_SIZE;

  // Ordered by monster_count then map_code. map_code is unique in this view,
  // so the sort is total and paging is stable -- the property the raw table
  // could not offer.
  const { data: maps, error: dataError } = await filtered(false)
    .order('monster_count', { ascending: false })
    .order('map_code')
    .range(from, from + PAGE_SIZE - 1);

  if (dataError) {
    console.error('maps query failed', dataError);
  }

  const error = Boolean(countError) || Boolean(dataError);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/maps${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลแมพ" />
      {/* A query error and a genuine zero-result search must read differently --
          otherwise an outage looks identical to "there are no maps", which is
          false. */}
      {error ? (
        <p className="filterstate">โหลดจำนวนแมพไม่สำเร็จ</p>
      ) : (
        <FilterState
          count={count ?? 0}
          unit="แมพ"
          filters={[{ label: 'คำค้น', value: q }]}
          clearHref="/database/maps"
        />
      )}
      <p style={{ color: 'var(--faint)', marginTop: 4, fontSize: 13 }}>
        แมพบางแห่งแสดงแค่รหัส เพราะไม่มีชื่อเรียกอื่นนอกจากรหัสแมพเอง ไม่ได้แปลว่าแมพนั้นไม่มีอยู่
        รายการนี้ครอบคลุมเฉพาะแมพที่มีมอนสเตอร์เกิด แมพที่ไม่มีมอนเกิดเลยจะไม่อยู่ในรายการนี้
      </p>

      {/* The interactive world map lives under this section now (merged from
          its own nav entry, 1 Sep) -- a banner, not an embed: the atlas is a
          heavy client bundle that map-list visitors should not pay for. */}
      <Link href="/database/world-map" className="qcard qcard--cyan" style={{ marginTop: 14, display: 'flex' }}>
        <strong>🗺 แผนที่โลกแบบกดได้</strong>
        <span>ดูทั้งทวีปเป็นภาพเดียว 102 โซน — ชี้เห็นมอนเด่น/ช่วงเลเวล กดเข้าแมพได้เลย</span>
        <em className="qcard__go">เปิดแผนที่โลก →</em>
      </Link>

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อหรือรหัสแมพ..." />
        <button type="submit" className="btn">ค้นหา</button>
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

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} total={count ?? 0} pageSize={PAGE_SIZE} />
    </main>
  );
}

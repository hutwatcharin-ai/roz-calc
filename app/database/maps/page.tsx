// app/database/maps/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getMapCanonical } from '@/lib/map-canonical';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
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

  // 497 rows, well inside the 1,000-row cap, so this fetches the set and pages
  // in memory like the other list pages. It used to page in SQL, which needed
  // a head-count round trip and a clamp to avoid asking Postgres for a range
  // it could not serve; folding channel copies out of the list made that
  // arithmetic wrong anyway, because the row count and the page count stopped
  // agreeing with what the reader sees.
  const { data: allMaps, error: dataError } = await fetchAllRows<{
    map_code: string;
    map_display_name: string | null;
    monster_count: number;
  }>((from, to) =>
    db
      .from('map_stats')
      .select('map_code, map_display_name, monster_count')
      .order('monster_count', { ascending: false })
      .order('map_code')
      .range(from, to),
  );

  if (dataError) {
    console.error('maps query failed', dataError);
  }

  // One row per place, not per channel: gef_fild10 stands for gef_f10_a and
  // gef_f10_b, which hold the same monsters. The count of folded channels
  // rides along so the row can say so.
  const canonical = await getMapCanonical();
  const needle = q.trim().toLowerCase();
  const rows = (allMaps ?? [])
    .filter((m) => !canonical.byCode[m.map_code])
    .filter(
      (m) =>
        !needle ||
        m.map_code.toLowerCase().includes(needle) ||
        (m.map_display_name ?? '').toLowerCase().includes(needle),
    );

  const count = rows.length;
  const countError = canonical.failed;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const maps = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

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
      <PageHeader title="ฐานข้อมูลแมพ Ragnarok Zero" />
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
        แสดงเฉพาะแมพที่มีมอนสเตอร์เกิด · แมพเดียวกันคนละช่อง (เช่น _a, _b) ยุบเป็นแถวเดียว · บางแมพขึ้นเป็นรหัสเพราะไม่มีชื่อเรียกอื่น
      </p>


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

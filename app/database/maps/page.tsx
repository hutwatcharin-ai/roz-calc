// app/database/maps/page.tsx
import './page.css';
import Link from 'next/link';
import FilterAutoSubmit from '@/components/FilterAutoSubmit';
import { mapImage } from '@/lib/map-image';
import { supabaseBrowser } from '@/lib/supabase';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { getMapCanonical } from '@/lib/map-canonical';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd, itemListJsonLd } from '@/lib/jsonld';
import { TOWNS } from '@/lib/towns';
import { mapWarps } from '@/lib/map-warps';

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
  searchParams: { q?: string; page?: string; sort?: string };
}) {
  const q = searchParams.q ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  const SORTS = {
    monsters: { label: 'มอนเยอะก่อน' },
    name: { label: 'ชื่อ A-Z' },
    code: { label: 'รหัสแมพ' },
  } as const;
  const sort = (searchParams.sort ?? 'monsters') in SORTS ? ((searchParams.sort ?? 'monsters') as keyof typeof SORTS) : 'monsters';

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

  if (sort === 'name') {
    rows.sort((a, b) => (a.map_display_name ?? a.map_code).localeCompare(b.map_display_name ?? b.map_code) || a.map_code.localeCompare(b.map_code));
  } else if (sort === 'code') {
    rows.sort((a, b) => a.map_code.localeCompare(b.map_code));
  }

  const count = rows.length;
  const countError = canonical.failed;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const maps = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const error = Boolean(countError) || Boolean(dataError);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sort !== 'monsters') params.set('sort', sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/maps${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ฐานข้อมูล', path: '/database/monsters' },
          { name: 'แมพ', path: '/database/maps' },
        ])}
      />
      {!error && maps.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/maps',
            rows: maps.map((m) => ({ id: m.map_code, name: m.map_display_name ?? m.map_code })),
            detailPath: (id) => `/database/maps/${encodeURIComponent(String(id))}`,
          })}
        />
      )}
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
        เมืองอยู่ด้านบน · รายการด้านล่างคือแมพที่มีมอนสเตอร์เกิด · แมพเดียวกันคนละช่อง (เช่น _a, _b) ยุบเป็นแถวเดียว · บางแมพขึ้นเป็นรหัสเพราะไม่มีชื่อเรียกอื่น
      </p>


      <form className="filterbar">
        <FilterAutoSubmit />
        <div className="filterbar__row filterbar__row--search">
          <label className="field field--grow">
            <span className="field__label">ค้นชื่อหรือรหัสแมพ</span>
            <input type="search" name="q" defaultValue={q} placeholder="เช่น Prontera, prt_fild08" />
          </label>
          <button type="submit" className="btn">ค้นหา</button>
        </div>
        <div className="filterbar__row">

        <label className="field">
          <span className="field__label">เรียงตาม</span>
          <select name="sort" defaultValue={sort}>
            {Object.entries(SORTS).map(([key, v]) => (
              <option key={key} value={key}>{v.label}</option>
            ))}
          </select>
        </label>
        </div>
      </form>

      {/* Towns first (owner, 6 Oct 2026): they have no monsters, so the
          list below -- maps with spawns -- never showed them. Hidden while
          searching or paging, where they would push the results down. */}
      {!q && safePage === 1 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h2 className="section-title">เมือง ({TOWNS.length})</h2>
          <ul className="mapgrid" style={{ marginTop: 10 }}>
            {TOWNS.map((town) => {
              const pic = mapImage(town.code);
              const src = pic?.src ?? mapWarps(town.code)?.picture ?? null;
              return (
                <li key={town.code}>
                  <Link href={`/database/maps/${encodeURIComponent(town.code)}`} className="maptile">
                    <span className="maptile__pic">
                      {src ? (
                        <img src={src} alt="" width={pic?.width ?? 512} height={pic?.height ?? 512} loading="lazy" decoding="async" />
                      ) : <span className="maptile__none" aria-hidden="true">NO MAP</span>}
                      <b className="maptile__count">เมือง</b>
                    </span>
                    <span className="maptile__name">{town.nameTh ?? town.nameEn}</span>
                    <code className="maptile__code">{town.code}</code>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Map cards (1 Oct 2026, arcade standard): the map picture is what
          tells two fields apart, so it leads, with the monster count as the
          badge. Was a three-column table with a 40px thumbnail. */}
      <div className="card">
        {error ? (
          <p className="muted" style={{ margin: 0 }}>เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง</p>
        ) : (maps ?? []).length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>ไม่พบแมพที่ตรงเงื่อนไข</p>
        ) : (
          <ul className="mapgrid">
            {(maps ?? []).map((m, index) => {
              const pic = mapImage(m.map_code);
              // The first row is on screen at load and the largest paint:
              // fetch it now, the rest when scrolled to (PSI 1 Oct 2026:
              // LCP 4.5 s with every tile lazy).
              const eager = index < 6;
              return (
                <li key={m.map_code}>
                  <Link href={`/database/maps/${encodeURIComponent(m.map_code)}`} className="maptile">
                    <span className="maptile__pic">
                      {pic ? (
                        <img src={pic.src} alt="" width={pic.width} height={pic.height} loading={eager ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : undefined} decoding="async" />
                      ) : <span className="maptile__none" aria-hidden="true">NO MAP</span>}
                      <b className="maptile__count">×{m.monster_count}</b>
                    </span>
                    <span className="maptile__name">{m.map_display_name ?? m.map_code}</span>
                    <code className="maptile__code">{m.map_code}</code>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} total={count ?? 0} pageSize={PAGE_SIZE} />
    </main>
  );
}

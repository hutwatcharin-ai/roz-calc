// app/database/equipment/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { canJobEquip, EQUIPMENT_CATEGORIES } from '@/lib/equip-filter';
import { ZERO_JOBS } from '@/lib/zero-jobs';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลอุปกรณ์',
  description:
    'อาวุธ เกราะ และคอสตูมทั้งหมดในเกม Ragnarok Zero Global กรองตามอาชีพที่ใส่ได้และเลเวลที่ต้องการ พร้อมค่าพลังโจมตี',
};

const PAGE_SIZE = 50;

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; job?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const category = searchParams.category ?? '';
  const job = searchParams.job ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // 490 rows, well under the 1,000-row cap. Fetched whole because the job
  // filter is an array-membership rule with group values that SQL would need
  // awkward gymnastics to express. Order by name_en, then id for stable
  // pagination (name_en is not unique, so ties must be broken).
  const { data: allItems, error } = await db
    .from('items')
    .select('id, name_en, icon_url, category, weapon_type, atk, required_level, equippable_classes')
    .in('category', [...EQUIPMENT_CATEGORIES])
    .order('name_en')
    .order('id');

  if (error) {
    console.error('equipment query failed', error);
  }

  const items = allItems ?? [];

  // Job dropdown lists all 20 canonical Zero jobs, not just the ones observed
  // directly in equippable_classes -- canJobEquip resolves class-2 jobs
  // through jobAncestry, so Knight and Wizard match gear even though no row
  // tags them by name. Matches app/database/skills/page.tsx, which already
  // uses ZERO_JOBS for the same reason.
  const jobs = ZERO_JOBS;

  const needle = q.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (category && it.category !== category) return false;
    if (job && !canJobEquip(it.equippable_classes, job)) return false;
    if (needle && !it.name_en.toLowerCase().includes(needle)) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (job) params.set('job', job);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/equipment${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลอุปกรณ์" />
      {/* A query error and a genuine zero-result search must read differently --
          otherwise an outage looks identical to "there are no equipment", which
          is false. */}
      {error ? (
        <p className="filterstate">โหลดจำนวนอุปกรณ์ไม่สำเร็จ</p>
      ) : (
        <FilterState
          count={filtered.length}
          unit="ชิ้น"
          filters={[
            { label: 'คำค้น', value: q },
            { label: 'หมวด', value: category },
            { label: 'อาชีพ', value: job },
          ]}
          clearHref="/database/equipment"
        />
      )}

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่ออุปกรณ์..." />
        <select name="category" defaultValue={category}>
          <option value="">ทุกหมวด</option>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select name="job" defaultValue={job}>
          <option value="">ทุกอาชีพ</option>
          {jobs.map((j) => (
            <option key={j} value={j}>{j}</option>
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
              <th>ชนิด</th>
              <th className="num">ATK</th>
              <th className="num">เลเวลที่ใช้ได้</th>
              <th>อาชีพที่ใส่ได้</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={6} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง
                </td>
              </tr>
            ) : (
              <>
                {rows.map((it) => (
                  <tr key={it.id}>
                    <td data-label="">
                      <Link href={`/database/items/${it.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {it.icon_url && (
                          <img loading="lazy" decoding="async" src={it.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                        )}
                        {it.name_en}
                      </Link>
                    </td>
                    <td data-label="หมวด">{it.category ?? '—'}</td>
                    <td data-label="ชนิด">{it.weapon_type ?? '—'}</td>
                    <td data-label="ATK" className="num">{it.atk ?? '—'}</td>
                    <td data-label="เลเวลที่ใช้ได้" className="num">{it.required_level ?? '—'}</td>
                    <td data-label="อาชีพที่ใส่ได้">{(it.equippable_classes ?? []).length > 0 ? (it.equippable_classes ?? []).join(', ') : '—'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                      ไม่พบอุปกรณ์ที่ตรงเงื่อนไข
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} total={filtered.length} pageSize={PAGE_SIZE} />
    </main>
  );
}

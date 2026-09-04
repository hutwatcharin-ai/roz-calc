// app/database/costumes/page.tsx
//
// Costumes were half the equipment list (940 of 1,815) and pushed real gear off
// every page, so they got their own section on 3 Sep 2026. The filter bar is
// deliberately smaller than the gear one: on these 940 rows the level, job and
// slot fields carry almost no information (884 require level 1, 905 have no
// slot, and equippable_classes is empty or "All Jobs" on every row), so the
// only two questions worth asking are the name and the slot it covers.
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { itemListJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { COSTUME_CATEGORY } from '@/lib/item-href';
import ItemIcon from '@/components/ItemIcon';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลคอสตูม',
  description:
    'คอสตูมทั้งหมดในเกม Ragnarok Zero Global แยกตามตำแหน่งที่สวม (หัวบน กลาง ล่าง ผ้าคลุม) พร้อมรูปและมอนสเตอร์ที่ดรอป',
};

const PAGE_SIZE = 50;

// Costume positions crawled from rozerodb item pages (2 Sep) -- these are the
// values items.weapon_type actually holds for Costume Equipment rows, ordered
// by how many rows carry each.
const POSITIONS = [
  'Upper Head',
  'Lower Head',
  'Mid Head',
  'Garment',
  'Upper/Mid Head',
  'Mid/Lower Head',
  'All Head Slots',
  'Upper/Lower Head',
] as const;

const POSITION_LABELS: Record<string, string> = {
  'Upper Head': 'หัวบน',
  'Mid Head': 'หัวกลาง',
  'Lower Head': 'หัวล่าง',
  'Upper/Mid Head': 'หัวบน+กลาง',
  'Mid/Lower Head': 'หัวกลาง+ล่าง',
  'Upper/Lower Head': 'หัวบน+ล่าง',
  'All Head Slots': 'ครบทุกช่องหัว',
  Garment: 'ผ้าคลุม',
};

export default async function CostumesPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; page?: string; sort?: string };
}) {
  const q = searchParams.q ?? '';
  // Only values from the fixed list pass -- the param goes into a comparison,
  // never into SQL.
  const type = (POSITIONS as readonly string[]).includes(searchParams.type ?? '') ? (searchParams.type as string) : '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  // Whitelist, never a passthrough: the value picks a comparison, and an
  // unknown one falls back to the default rather than sorting by nothing.
  const SORTS = {
    name: { label: 'ชื่อ A-Z' },
    slot: { label: 'ตำแหน่งสวม' },
  } as const;
  const sort = (searchParams.sort ?? 'name') in SORTS ? ((searchParams.sort ?? 'name') as keyof typeof SORTS) : 'name';

  const db = supabaseBrowser();

  // 940 rows today, under PostgREST's silent 1,000-row cap -- but it paginates
  // anyway, because a cap that truncates without an error is not something to
  // leave one cash-shop import away from biting.
  const { data: allItems, error } = await fetchAllRows<{
    id: number;
    name_en: string;
    icon_url: string | null;
    category: string | null;
    weapon_type: string | null;
    slots: number | null;
  }>((from, to) =>
    db
      .from('items')
      .select('id, name_en, icon_url, category, weapon_type, slots')
      .eq('category', COSTUME_CATEGORY)
      .order('name_en')
      .order('id')
      .range(from, to),
  );

  if (error) {
    console.error('costumes query failed', error);
  }

  const items = allItems ?? [];
  const needle = q.trim().toLowerCase();
  const filtered = items.filter((it) => {
    if (type && it.weapon_type !== type) return false;
    if (needle && !it.name_en.toLowerCase().includes(needle)) return false;
    return true;
  });

  if (sort === 'slot') {
    // Position first, then name inside it, so the order is total -- two
    // costumes on the same slot must not swap places between requests.
    filtered.sort(
      (a, b) =>
        (a.weapon_type ?? 'zzz').localeCompare(b.weapon_type ?? 'zzz') || a.name_en.localeCompare(b.name_en),
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (type) params.set('type', type);
    if (sort !== 'name') params.set('sort', sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/costumes${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      {rows.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/costumes',
            rows: rows.map((r) => ({ id: r.id, name: r.name_en })),
            detailPath: (id) => `/database/costumes/${id}`,
          })}
        />
      )}
      <PageHeader title="ฐานข้อมูลคอสตูม Ragnarok Zero" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
        คอสตูมใส่ทับของจริงได้ ไม่มีค่าพลัง · หาอาวุธกับเกราะไปที่{' '}
        <Link href="/database/equipment">ฐานข้อมูลอุปกรณ์</Link>
      </p>

      {/* A query error and a genuine zero-result search must read differently
          -- otherwise an outage looks identical to "there are no costumes". */}
      {error ? (
        <p className="filterstate">โหลดจำนวนคอสตูมไม่สำเร็จ</p>
      ) : (
        <FilterState
          count={filtered.length}
          unit="ชิ้น"
          filters={[
            { label: 'คำค้น', value: q },
            { label: 'ตำแหน่ง', value: type ? POSITION_LABELS[type] ?? type : '' },
          ]}
          clearHref="/database/costumes"
        />
      )}

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อคอสตูม..." />
        <select name="type" defaultValue={type} aria-label="ตำแหน่งที่สวม">
          <option value="">ทุกตำแหน่ง</option>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{POSITION_LABELS[p] ?? p}</option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, v]) => (
            <option key={key} value={key}>เรียง: {v.label}</option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      {error ? (
        <div className="card">
          <p style={{ color: 'var(--faint)', margin: 0 }}>เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState what={q || undefined} clearHref="/database/costumes" />
        </div>
      ) : (
        <div className="card">
          {/* Recognition-first: a costume is chosen by how it looks, so the
              sprite carries the row and the meta line only says where it sits. */}
          <div className="itemgrid">
            {rows.map((it) => (
              <Link key={it.id} href={`/database/costumes/${it.id}`} className="itemcard">
                <ItemIcon iconUrl={it.icon_url} category={it.category} size={32} />
                <span className="itemcard__name">{it.name_en}</span>
                <span className="itemcard__meta">
                  {it.weapon_type ? POSITION_LABELS[it.weapon_type] ?? it.weapon_type : 'ไม่ระบุตำแหน่ง'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} total={filtered.length} pageSize={PAGE_SIZE} />
    </main>
  );
}

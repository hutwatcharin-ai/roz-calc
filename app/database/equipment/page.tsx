// app/database/equipment/page.tsx
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { itemListJsonLd } from '@/lib/jsonld';
import EquipCategoryType from '@/components/EquipCategoryType';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { canJobEquip } from '@/lib/equip-filter';
import { GEAR_CATEGORIES } from '@/lib/item-href';
import { ZERO_JOBS } from '@/lib/zero-jobs';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import ItemIcon from '@/components/ItemIcon';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลอุปกรณ์',
  description:
    'อาวุธและเกราะทั้งหมดในเกม Ragnarok Zero Global กรองตามอาชีพที่ใส่ได้และเลเวลที่ต้องการ พร้อมค่าพลังโจมตี (คอสตูมแยกอยู่หน้าคอสตูม)',
};

const PAGE_SIZE = 50;

// Second-tier filter, rozerodb-style: pick Weapon or Armor first, then the
// concrete type. Values mirror what actually exists in items.weapon_type
// after the 2026-08-31 normalisation pass (case duplicates folded, bare
// "Sword"/"Spear" mapped to their one-handed forms).
const WEAPON_TYPES = ['Bow', 'Dagger', 'One-handed Sword', 'Two-handed Sword', 'One-handed Axe', 'Two-handed Axe', 'One-handed Spear', 'Two-handed Spear', 'One-handed Staff', 'Two-handed Staff', 'Mace', 'Book', 'Katar', 'Knuckle', 'Whip', 'Instrument', 'Huuma Shuriken', 'Arrow'];
const ARMOR_TYPES = ['Headgear', 'Armor', 'Garment', 'Shoes', 'Shield', 'Accessory'];
// Costumes are not listed here: they moved to /database/costumes on 3 Sep 2026,
// where 940 cosmetic rows stop crowding out the 875 pieces of real gear.
const TYPES_BY_CATEGORY: Record<string, readonly string[]> = {
  Weapon: WEAPON_TYPES,
  Armor: ARMOR_TYPES,
};
const TYPE_PLACEHOLDERS: Record<string, string> = {
  Weapon: 'ทุกชนิดอาวุธ',
  Armor: 'ทุกตำแหน่งสวม',
};
const CATEGORY_LABELS: Record<string, string> = {
  Weapon: 'อาวุธ',
  Armor: 'เกราะ/สวมใส่',
};

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; type?: string; job?: string; mylv?: string; slots?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const category = searchParams.category ?? '';
  // Subtype only applies with a kind chosen, and only values from the fixed
  // lists pass -- the param goes into a comparison, never into SQL.
  const subtypeOptions = TYPES_BY_CATEGORY[category] ?? [];
  const type = subtypeOptions.includes(searchParams.type ?? '') ? (searchParams.type as string) : '';
  const SORTS = {
    name: { label: 'ชื่อ A-Z' },
    atk: { label: 'ATK สูงก่อน' },
    level: { label: 'เลเวลน้อยก่อน' },
  } as const;
  const sort = (searchParams.sort ?? 'name') in SORTS ? ((searchParams.sort ?? 'name') as keyof typeof SORTS) : 'name';
  const job = searchParams.job ?? '';
  // One field: the player's own level. Gear has no upper bound -- anything
  // whose required level is at or below yours is wearable forever -- so the
  // filter is simply required_level <= mylv. Unknown required_level passes:
  // hiding gear we lack data for would read as "cannot wear", a claim the
  // data does not make.
  const mylv = Math.max(0, Number(searchParams.mylv ?? 0) || 0);
  // Slot filter: '' = any, '0'..'4' exact. Values outside that are ignored.
  const slotsParam = ['0', '1', '2', '3', '4'].includes(searchParams.slots ?? '') ? (searchParams.slots as string) : '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // 875 rows since costumes moved out, under PostgREST's silent 1,000-row cap
  // -- but it stays paginated (fetchAllRows), because a cap that truncates
  // without an error is not something to leave one import away from biting.
  // Fetched whole because the job
  // filter is an array-membership rule with group values that SQL would need
  // awkward gymnastics to express. Order by name_en, then id for stable
  // pagination (name_en is not unique, so ties must be broken).
  const { data: allItems, error } = await fetchAllRows<{
    id: number;
    name_en: string;
    icon_url: string | null;
    category: string | null;
    weapon_type: string | null;
    atk: number | null;
    required_level: number | null;
    equippable_classes: string[] | null;
    slots: number | null;
  }>((from, to) =>
    db
      .from('items')
      .select('id, name_en, icon_url, category, weapon_type, atk, required_level, equippable_classes, slots')
      .in('category', [...GEAR_CATEGORIES])
      .order('name_en')
      .order('id')
      .range(from, to),
  );

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
    if (type && it.weapon_type !== type) return false;
    if (slotsParam !== '' && it.slots !== Number(slotsParam)) return false;
    if (mylv > 0 && it.required_level != null && it.required_level > mylv) return false;
    if (job && !canJobEquip(it.equippable_classes, job)) return false;
    if (needle && !it.name_en.toLowerCase().includes(needle)) return false;
    return true;
  });
  if (sort === 'atk') {
    filtered.sort((a, b) => (b.atk ?? -1) - (a.atk ?? -1) || a.id - b.id);
  } else if (sort === 'level') {
    filtered.sort((a, b) => (a.required_level ?? 999) - (b.required_level ?? 999) || a.id - b.id);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (type) params.set('type', type);
    if (job) params.set('job', job);
    if (mylv > 0) params.set('mylv', String(mylv));
    if (slotsParam !== '') params.set('slots', slotsParam);
    if (sort !== 'name') params.set('sort', sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/equipment${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      {rows.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/equipment',
            rows: rows.map((r) => ({ id: r.id, name: r.name_en })),
            detailPath: (id) => `/database/equipment/${id}`,
          })}
        />
      )}
      <PageHeader title="ฐานข้อมูลอุปกรณ์ Ragnarok Zero" />
      {/* Costumes outnumbered real gear here 940 to 875 and buried it. They
          have their own page now, and this is the signpost for the player who
          came looking for them. */}
      <p className="muted" style={{ marginTop: -6, marginBottom: 12 }}>
        หน้านี้เฉพาะอาวุธกับเกราะ · หาคอสตูมไปที่ <Link href="/database/costumes">ฐานข้อมูลคอสตูม</Link>
      </p>
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
            { label: 'หมวด', value: CATEGORY_LABELS[category] ?? category },
            { label: 'ชนิด', value: type },
            { label: 'อาชีพ', value: job },
            { label: 'ใส่ได้ที่ Lv', value: mylv > 0 ? String(mylv) : '' },
            { label: 'Slot', value: slotsParam !== '' ? (slotsParam === '0' ? 'ไม่มี Slot' : `${slotsParam} Slot`) : '' },
          ]}
          clearHref="/database/equipment"
        />
      )}

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่ออุปกรณ์..." />
        <EquipCategoryType
          initialCategory={category}
          initialType={type}
          categories={GEAR_CATEGORIES}
          labels={CATEGORY_LABELS}
          typesByCategory={TYPES_BY_CATEGORY}
          placeholders={TYPE_PLACEHOLDERS}
        />
        <select name="job" defaultValue={job}>
          <option value="">ทุกอาชีพ</option>
          {jobs.map((j) => (
            <option key={j} value={j}>{j}</option>
          ))}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--dim)', font: '500 13px/1.4 var(--font-sarabun), sans-serif' }}>
          ใส่ได้ที่ Lv{' '}
          <input className="mono" type="number" name="mylv" defaultValue={mylv > 0 ? mylv : ''} placeholder="เลเวลของคุณ" inputMode="numeric" style={{ width: 104 }} aria-label="เลเวลตัวละครของคุณ" />
        </label>
        <select name="slots" defaultValue={slotsParam} aria-label="จำนวน Slot">
          <option value="">ทุก Slot</option>
          <option value="4">4 Slot</option>
          <option value="3">3 Slot</option>
          <option value="2">2 Slot</option>
          <option value="1">1 Slot</option>
          <option value="0">ไม่มี Slot</option>
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
          <EmptyState what={q || undefined} clearHref="/database/equipment" />
        </div>
      ) : (
        <div className="card">
          {/* Same recognition-first grid as the item list; the meta line carries
              what a player scans equipment by (type, ATK, level). */}
          <div className="itemgrid">
            {rows.map((it) => (
              <Link key={it.id} href={`/database/equipment/${it.id}`} className="itemcard">
                <ItemIcon iconUrl={it.icon_url} category={it.category} size={32} />
                <span className="itemcard__name">
                  {it.name_en}
                  {it.slots != null && it.slots > 0 && <span className="mono" style={{ color: 'var(--cyan)' }}> [{it.slots}]</span>}
                </span>
                <span className="itemcard__meta">
                  {it.weapon_type ?? CATEGORY_LABELS[it.category ?? ''] ?? '—'}
                  {it.atk != null && it.atk > 0 ? ` · ATK ${it.atk}` : ''}
                  {it.required_level != null && it.required_level > 1 ? ` · Lv ${it.required_level}` : ''}
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

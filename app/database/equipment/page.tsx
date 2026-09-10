// app/database/equipment/page.tsx
import Link from 'next/link';
import { matches } from '@/lib/smart-search';
import JsonLd from '@/components/JsonLd';
import { itemListJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { canJobEquip } from '@/lib/equip-filter';
import { COSTUME_CATEGORY, GEAR_CATEGORIES } from '@/lib/item-href';
import { redirect } from 'next/navigation';
import { ZERO_JOBS } from '@/lib/zero-jobs';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import ItemIcon from '@/components/ItemIcon';
import { CATEGORY_TH, TYPE_TH, gearCategory, gearType, typesFor } from '@/lib/gear-type';
import { ROLE_ORDER, ROLE_TH, gearRoles, isGearRole, type GearRole } from '@/lib/gear-roles';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลอุปกรณ์',
  description:
    'อาวุธและเกราะทั้งหมดในเกม Ragnarok Zero Global กรองตามอาชีพที่ใส่ได้และเลเวลที่ต้องการ พร้อมค่าพลังโจมตี (คอสตูมแยกอยู่หน้าคอสตูม)',
};

const PAGE_SIZE = 50;

// The type lists and their Thai labels live in lib/gear-type, next to the code
// that fills in the 248 rows whose type our own table does not carry.
// Costumes are not among them: they moved to /database/costumes on 3 Sep 2026,
// where 940 cosmetic rows stop crowding out the 875 pieces of real gear.

export default async function EquipmentPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; type?: string; use?: string; job?: string; mylv?: string; slots?: string; sort?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  // Anything still asking this list for costumes -- an old link, a bookmark,
  // the item list's legacy category map -- gets sent to the page that has
  // them, rather than a filter that now matches nothing.
  if ((searchParams.category ?? '') === COSTUME_CATEGORY) redirect('/database/costumes');
  const category = (GEAR_CATEGORIES as readonly string[]).includes(searchParams.category ?? '') ? (searchParams.category as string) : '';
  // Subtype only applies with a kind chosen, and only values from the fixed
  // lists pass -- the param goes into a comparison, never into SQL.
  const subtypeOptions = typesFor(category);
  const type = subtypeOptions.includes(searchParams.type ?? '') ? (searchParams.type as string) : '';
  const role: GearRole | '' = isGearRole(searchParams.use) ? searchParams.use : '';
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
    description: string | null;
    atk: number | null;
    required_level: number | null;
    equippable_classes: string[] | null;
    slots: number | null;
  }>((from, to) =>
    db
      .from('items')
      .select('id, name_en, icon_url, category, weapon_type, description, atk, required_level, equippable_classes, slots')
      .in('category', [...GEAR_CATEGORIES])
      .order('name_en')
      .order('id')
      .range(from, to),
  );

  if (error) {
    console.error('equipment query failed', error);
  }

  // Type, category and role are resolved once per row: the type column is
  // empty on 248 rows, and both the chips and the card meta line need the
  // filled-in answer, not the empty column.
  const items = (allItems ?? []).map((it) => ({
    ...it,
    kind: gearType(it),
    group: gearCategory(it),
    roles: gearRoles(it.description),
  }));

  // Job dropdown lists all 20 canonical Zero jobs, not just the ones observed
  // directly in equippable_classes -- canJobEquip resolves class-2 jobs
  // through jobAncestry, so Knight and Wizard match gear even though no row
  // tags them by name. Matches app/database/skills/page.tsx, which already
  // uses ZERO_JOBS for the same reason.
  const jobs = ZERO_JOBS;

  const needle = q.trim().toLowerCase();
  // Everything except the two chip dimensions. The chip counts are taken from
  // this, so a chip can never lead to an empty page.
  const base = items.filter((it) => {
    if (slotsParam !== '' && it.slots !== Number(slotsParam)) return false;
    if (mylv > 0 && it.required_level != null && it.required_level > mylv) return false;
    if (job && !canJobEquip(it.equippable_classes, job)) return false;
    if (needle && !matches(it.name_en, needle)) return false;
    return true;
  });

  const categoryCounts = new Map<string, number>();
  const typeCounts = new Map<string, number>();
  for (const it of base) {
    if (it.group) categoryCounts.set(it.group, (categoryCounts.get(it.group) ?? 0) + 1);
    if (it.kind) typeCounts.set(it.kind, (typeCounts.get(it.kind) ?? 0) + 1);
  }
  const roleCounts = new Map<GearRole, number>();
  for (const it of base) {
    if (category && it.group !== category) continue;
    if (type && it.kind !== type) continue;
    for (const r of it.roles) roleCounts.set(r, (roleCounts.get(r) ?? 0) + 1);
  }

  const filtered = base.filter((it) => {
    if (category && it.group !== category) return false;
    if (type && it.kind !== type) return false;
    if (role && !it.roles.includes(role)) return false;
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
    if (role) params.set('use', role);
    if (job) params.set('job', job);
    if (mylv > 0) params.set('mylv', String(mylv));
    if (slotsParam !== '') params.set('slots', slotsParam);
    if (sort !== 'name') params.set('sort', sort);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/equipment${qs ? `?${qs}` : ''}`;
  }

  /**
   * A chip link keeps every other filter and drops the page number, because
   * page 4 of the old filter is not page 4 of this one. Picking a kind clears
   * the type under it: a Bow filter must not survive a switch to armour.
   */
  function chipHref(next: { category?: string; type?: string; use?: GearRole | '' }) {
    const nextCategory = next.category ?? category;
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (nextCategory) params.set('category', nextCategory);
    const nextType = next.type ?? (nextCategory === category ? type : '');
    if (nextType) params.set('type', nextType);
    const nextRole = next.use ?? role;
    if (nextRole) params.set('use', nextRole);
    if (job) params.set('job', job);
    if (mylv > 0) params.set('mylv', String(mylv));
    if (slotsParam !== '') params.set('slots', slotsParam);
    if (sort !== 'name') params.set('sort', sort);
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
            { label: 'หมวด', value: CATEGORY_TH[category] ?? category },
            { label: 'ชนิด', value: type ? TYPE_TH[type] ?? type : '' },
            { label: 'เอาไว้', value: role ? ROLE_TH[role].title : '' },
            { label: 'อาชีพ', value: job },
            { label: 'ใส่ได้ที่ Lv', value: mylv > 0 ? String(mylv) : '' },
            { label: 'Slot', value: slotsParam !== '' ? (slotsParam === '0' ? 'ไม่มี Slot' : `${slotsParam} Slot`) : '' },
          ]}
          clearHref="/database/equipment"
        />
      )}

      {/* Chips rather than the pair of dropdowns this page used until now.
          Three reasons, in order of how much they matter: a dropdown renders no
          link, so Google never saw that this site has a page for spears --
          "หอกมือเดียว ro" was landing on the monster size table instead; the
          counts are visible before the click, so no chip leads to an empty
          page; and one control per dimension cannot disagree with itself the
          way a chip row plus a select would. The kind comes first and the
          types under it follow, so a phone shows at most 18 chips, not 24. */}
      <section className="rolepick">
        <h2 className="rolepick__label">ประเภท</h2>
        <div className="chips">
          <Link className={`chip${category === '' ? ' chip--on' : ''}`} href={chipHref({ category: '', type: '' })}>
            ทั้งหมด
          </Link>
          {GEAR_CATEGORIES.filter((c) => (categoryCounts.get(c) ?? 0) > 0).map((c) => (
            <Link key={c} className={`chip${category === c ? ' chip--on' : ''}`} href={chipHref({ category: c, type: '' })}>
              {CATEGORY_TH[c] ?? c} <span className="chip__count">{categoryCounts.get(c)}</span>
            </Link>
          ))}
        </div>
        {category && (
          <div className="chips" style={{ marginTop: 8 }}>
            <Link className={`chip${type === '' ? ' chip--on' : ''}`} href={chipHref({ type: '' })}>
              {category === 'Weapon' ? 'ทุกชนิดอาวุธ' : 'ทุกตำแหน่งสวม'}
            </Link>
            {subtypeOptions
              .filter((t) => (typeCounts.get(t) ?? 0) > 0)
              .map((t) => (
                <Link key={t} className={`chip${type === t ? ' chip--on' : ''}`} href={chipHref({ type: t })}>
                  {TYPE_TH[t] ?? t} <span className="chip__count">{typeCounts.get(t)}</span>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* The second dimension, the one the card and item lists already have:
          what the piece is FOR. Every group is a wording the client's own
          effect text uses (lib/gear-roles); a piece serves every group it
          truly serves, so the counts overlap. */}
      {roleCounts.size > 0 && (
        <section className="rolepick">
          <h2 className="rolepick__label">เอาไว้ทำอะไร</h2>
          <div className="chips">
            <Link className={`chip${role === '' ? ' chip--on' : ''}`} href={chipHref({ use: '' })}>
              ทั้งหมด
            </Link>
            {ROLE_ORDER.filter((r) => (roleCounts.get(r) ?? 0) > 0).map((r) => (
              <Link key={r} className={`chip${role === r ? ' chip--on' : ''}`} href={chipHref({ use: r })} title={ROLE_TH[r].asks}>
                {ROLE_TH[r].title} <span className="chip__count">{roleCounts.get(r)}</span>
              </Link>
            ))}
          </div>
          {role && <p className="rolepick__asks">{ROLE_TH[role].asks}</p>}
        </section>
      )}

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่ออุปกรณ์..." />
        {/* The chips own these two, and a GET form drops what it does not
            carry -- so they ride along hidden rather than being reset by a
            search. */}
        {category && <input type="hidden" name="category" value={category} />}
        {type && <input type="hidden" name="type" value={type} />}
        {role && <input type="hidden" name="use" value={role} />}
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
          <EmptyState kind="equipment" what={q || undefined} clearHref="/database/equipment" />
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
                  {(it.kind ? TYPE_TH[it.kind] ?? it.kind : null) ?? CATEGORY_TH[it.group ?? ''] ?? '—'}
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

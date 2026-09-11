// app/database/costumes/page.tsx
//
// Costumes were half the equipment list and pushed real gear off every page,
// so they got their own section on 3 Sep 2026. Level, job and card slot carry
// almost no information on these rows, so the questions worth asking are the
// name, the slot a costume covers, and where it comes from.
//
// Filters became chip rows on 11 Sep 2026 to match the cards and monsters
// lists (owner's request): each row counted against the other filters already
// on, a zero-count chip not drawn, and a chip that is on turns itself off.
import Link from 'next/link';
import { isBound } from '@/lib/bound-items';
import { matches } from '@/lib/smart-search';
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
    'คอสตูมทั้งหมดในเกม Ragnarok Zero Global แยกตามตำแหน่งที่สวม (หัวบน กลาง ล่าง ผ้าคลุม) และที่มา (ดรอปจากมอน หรือ Cash Shop) พร้อมรูปและมอนสเตอร์ที่ดรอป',
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

/** 281 costumes carry no position at all; they get a chip of their own rather than vanishing from every position. */
const NO_POSITION = 'none';

const POSITION_LABELS: Record<string, string> = {
  'Upper Head': 'หัวบน',
  'Mid Head': 'หัวกลาง',
  'Lower Head': 'หัวล่าง',
  'Upper/Mid Head': 'หัวบน+กลาง',
  'Mid/Lower Head': 'หัวกลาง+ล่าง',
  'Upper/Lower Head': 'หัวบน+ล่าง',
  'All Head Slots': 'ครบทุกช่องหัว',
  Garment: 'ผ้าคลุม',
  [NO_POSITION]: 'ไม่ระบุตำแหน่ง',
};

// Where a costume comes from, as far as the data can say. A costume can be
// both; one with neither is not "unobtainable", only unrecorded.
const SOURCES = { drop: 'ดรอปจากมอน', cash: 'Cash Shop' } as const;
type Source = keyof typeof SOURCES;

export default async function CostumesPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; src?: string; page?: string; sort?: string; bound?: string };
}) {
  const q = searchParams.q ?? '';
  // Only values from the fixed lists pass -- the params go into comparisons,
  // never into SQL.
  const type =
    (POSITIONS as readonly string[]).includes(searchParams.type ?? '') || searchParams.type === NO_POSITION
      ? (searchParams.type as string)
      : '';
  const src: Source | '' = searchParams.src === 'drop' || searchParams.src === 'cash' ? searchParams.src : '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  // Whitelist, never a passthrough: the value picks a comparison, and an
  // unknown one falls back to the default rather than sorting by nothing.
  const SORTS = {
    name: { label: 'ชื่อ A-Z' },
    slot: { label: 'ตำแหน่งสวม' },
  } as const;
  const sort = (searchParams.sort ?? 'name') in SORTS ? ((searchParams.sort ?? 'name') as keyof typeof SORTS) : 'name';
  const showBound = searchParams.bound === '1';

  const db = supabaseBrowser();

  // Paginated: 1,634 costume rows on 11 Sep 2026, past PostgREST's silent
  // 1,000-row cap.
  const [{ data: allItems, error }, drops, cash] = await Promise.all([
    fetchAllRows<{
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
    ),
    fetchAllRows<{ item_id: number }>((from, to) =>
      db.from('monster_drops').select('item_id').order('monster_id').order('item_id').range(from, to),
    ),
    db.from('cash_shop_items').select('item_id'),
  ]);

  if (error) console.error('costumes query failed', error);
  // A failed source read hides the source chips instead of showing every
  // costume as "not dropped by anything".
  const sourcesKnown = !drops.error && !cash.error;
  if (!sourcesKnown) console.error('costume source query failed', drops.error ?? cash.error);
  const dropIds = new Set((drops.data ?? []).map((row) => row.item_id));
  const cashIds = new Set((cash.data ?? []).map((row) => row.item_id));
  const hasSource = (id: number, source: Source) => (source === 'drop' ? dropIds.has(id) : cashIds.has(id));

  const items = allItems ?? [];
  // Most bound rows are the account-bound copy of a costume already in the
  // list, so they are hidden unless asked for (?bound=1). The count is shown
  // next to the checkbox: hiding rows silently is how the whole set came to
  // be deleted in August.
  const boundCount = items.filter((it) => isBound(it.name_en)).length;
  const needle = q.trim().toLowerCase();
  const positionOf = (it: { weapon_type: string | null }) => it.weapon_type ?? NO_POSITION;
  const keepBound = (it: { name_en: string }) => showBound || !isBound(it.name_en);
  const matchesQ = (it: { name_en: string }) => !needle || matches(it.name_en, needle);
  const matchesType = (it: { weapon_type: string | null }) => !type || positionOf(it) === type;
  const matchesSrc = (it: { id: number }) => !src || (sourcesKnown && hasSource(it.id, src));

  const filtered = items.filter((it) => keepBound(it) && matchesType(it) && matchesSrc(it) && matchesQ(it));

  // Each chip row counted against every other filter already on.
  const positionCounts = new Map<string, number>();
  const sourceCounts = new Map<Source, number>();
  for (const it of items) {
    if (!keepBound(it) || !matchesQ(it)) continue;
    if (matchesSrc(it)) positionCounts.set(positionOf(it), (positionCounts.get(positionOf(it)) ?? 0) + 1);
    if (matchesType(it) && sourcesKnown) {
      for (const source of Object.keys(SOURCES) as Source[]) {
        if (hasSource(it.id, source)) sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
      }
    }
  }

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

  /** This page's URL with some filters changed; any change goes back to page 1. */
  function hrefWith(next: { type?: string; src?: string; bound?: boolean; page?: number } = {}): string {
    const params = new URLSearchParams();
    const nextType = next.type ?? type;
    const nextSrc = next.src ?? src;
    const nextBound = next.bound ?? showBound;
    if (q) params.set('q', q);
    if (nextType) params.set('type', nextType);
    if (nextSrc) params.set('src', nextSrc);
    if (sort !== 'name') params.set('sort', sort);
    if (nextBound) params.set('bound', '1');
    if ((next.page ?? 1) > 1) params.set('page', String(next.page));
    const qs = params.toString();
    return `/database/costumes${qs ? `?${qs}` : ''}`;
  }

  const positionChips = [...POSITIONS, NO_POSITION].filter((p) => (positionCounts.get(p) ?? 0) > 0);
  const sourceChips = (Object.keys(SOURCES) as Source[]).filter((s) => (sourceCounts.get(s) ?? 0) > 0);

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
            { label: 'ที่มา', value: src ? SOURCES[src] : '' },
          ]}
          clearHref="/database/costumes"
        />
      )}

      {!error && (
        <section className="rolepick">
          <h2 className="rolepick__label">ตำแหน่งที่สวม</h2>
          <div className="chips">
            <Link className={`chip${type === '' ? ' chip--on' : ''}`} href={hrefWith({ type: '' })}>
              ทุกตำแหน่ง
            </Link>
            {positionChips.map((p) => (
              <Link key={p} className={`chip${type === p ? ' chip--on' : ''}`} href={hrefWith({ type: type === p ? '' : p })}>
                {POSITION_LABELS[p] ?? p} <span className="chip__count">{positionCounts.get(p)}</span>
              </Link>
            ))}
          </div>
          {sourcesKnown && (
            <>
              <h2 className="rolepick__label" style={{ marginTop: 12 }}>
                ได้จากไหน
              </h2>
              <div className="chips">
                <Link className={`chip${src === '' ? ' chip--on' : ''}`} href={hrefWith({ src: '' })}>
                  ทุกที่มา
                </Link>
                {sourceChips.map((s) => (
                  <Link key={s} className={`chip${src === s ? ' chip--on' : ''}`} href={hrefWith({ src: src === s ? '' : s })}>
                    {SOURCES[s]} <span className="chip__count">{sourceCounts.get(s)}</span>
                  </Link>
                ))}
              </div>
              <p className="rolepick__asks">ชิ้นที่ไม่อยู่ในสองกลุ่มนี้ ข้อมูลยังไม่บอกว่าได้จากไหน ไม่ได้แปลว่าหาไม่ได้</p>
            </>
          )}
        </section>
      )}

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อคอสตูม..." />
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, v]) => (
            <option key={key} value={key}>เรียง: {v.label}</option>
          ))}
        </select>
        {/* The chips' choices ride along so pressing search keeps them. */}
        {type && <input type="hidden" name="type" value={type} />}
        {src && <input type="hidden" name="src" value={src} />}
        {showBound && <input type="hidden" name="bound" value="1" />}
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <p className="filterbar" style={{ marginTop: 8 }}>
        <Link className="cvtoggle" href={hrefWith({ bound: !showBound })} scroll={false}>
          <input type="checkbox" checked={!showBound} readOnly tabIndex={-1} aria-hidden="true" />
          ซ่อนคอสตูมแบบผูกบัญชี (Bound) {boundCount.toLocaleString()} ชิ้น
        </Link>
      </p>

      {error ? (
        <div className="card">
          <p style={{ color: 'var(--faint)', margin: 0 }}>เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card">
          <EmptyState kind="costumes" what={q || undefined} clearHref="/database/costumes" />
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
                  {dropIds.has(it.id) && ' · ดรอป'}
                  {cashIds.has(it.id) && ' · Cash'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Pagination page={safePage} totalPages={totalPages} buildHref={(p) => hrefWith({ page: p })} total={filtered.length} pageSize={PAGE_SIZE} />
    </main>
  );
}

// app/database/monsters/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import RecentlyViewed from '@/components/RecentlyViewed';
import AggroBadge from '@/components/AggroBadge';
import { escapeLikePattern } from '@/lib/like-escape';
import CVariantToggle from '@/components/CVariantToggle';
import { C_VARIANT_SQL_NOT_LIKE } from '@/lib/c-variant';

export const metadata = {
  title: 'ฐานข้อมูลมอนสเตอร์',
  description: 'มอนสเตอร์ทั้งหมดในเกม Ragnarok Zero Global พร้อมเลเวล เผ่า ธาตุ ค่าสถานะ และของที่ดรอป',
};

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

const PAGE_SIZE = 50;
const RACES = ['Angel', 'Brute', 'Demi-Human', 'Demon', 'Dragon', 'Fish', 'Formless', 'Insect', 'Plant', 'Undead'];
const ELEMENTS = ['Earth', 'Fire', 'Ghost', 'Holy', 'Neutral', 'Poison', 'Shadow', 'Undead', 'Water', 'Wind'];

export default async function MonsterListPage({
  searchParams,
}: {
  searchParams: { q?: string; race?: string; element?: string; sort?: string; page?: string; c?: string };
}) {
  const q = searchParams.q ?? '';
  const race = searchParams.race ?? '';
  const element = searchParams.element ?? '';
  // Challenge clones are opt-in: absent param = hidden. Server-side so the
  // result count and pagination stay exact (unlike the CSS hide elsewhere).
  const showC = searchParams.c === '1';
  // A whitelist, not a passthrough: the sort key goes into the query.
  const SORTS = {
    level: { label: 'เลเวลน้อยก่อน', column: 'level', ascending: true },
    exp: { label: 'EXP มากก่อน', column: 'base_exp', ascending: false },
    name: { label: 'ชื่อ A-Z', column: 'name_en', ascending: true },
  } as const;
  const sort = (searchParams.sort ?? 'level') in SORTS ? ((searchParams.sort ?? 'level') as keyof typeof SORTS) : 'level';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();
  let query = db
    .from('monsters')
    .select('id, name_en, level, race, element, image_url, is_aggressive, atk_max, hp, base_exp', { count: 'exact' });

  if (q) {
    const needle = escapeLikePattern(q);
    query = query.ilike('name_en', `%${needle}%`);
  }
  if (race) query = query.eq('race', race);
  if (element) query = query.eq('element', element);
  if (!showC) query = query.not('name_en', 'like', C_VARIANT_SQL_NOT_LIKE);

  const from = (page - 1) * PAGE_SIZE;
  const { data: monsters, count, error } = await query
    .order(SORTS[sort].column, { ascending: SORTS[sort].ascending, nullsFirst: false })
    .order('id')
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('monsters list query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function buildHref(targetPage: number, showCOverride?: boolean) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (race) params.set('race', race);
    if (element) params.set('element', element);
    if (sort !== 'level') params.set('sort', sort);
    if (showCOverride ?? showC) params.set('c', '1');
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/monsters${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลมอนสเตอร์" />
      <RecentlyViewed />

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อมอนสเตอร์" aria-label="ค้นชื่อมอนสเตอร์" />
        <select name="race" defaultValue={race} aria-label="เผ่า">
          <option value="">ทุกเผ่า</option>
          {RACES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select name="element" defaultValue={element} aria-label="ธาตุ">
          <option value="">ทุกธาตุ</option>
          {ELEMENTS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>
              เรียง: {s.label}
            </option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
        {/* Toggling re-navigates (page reset to 1) so the server filter and
            count stay honest; the hidden form field keeps ?c=1 across a new
            text search too. */}
        {showC && <input type="hidden" name="c" value="1" />}
        <CVariantToggle mode="nav" navShow={showC} navHref={(show) => buildHref(1, show)} />
      </form>

      <FilterState
        count={count ?? 0}
        unit="ตัว"
        filters={[
          { label: 'คำค้น', value: q },
          { label: 'เผ่า', value: race },
          { label: 'ธาตุ', value: element },
        ]}
        clearHref="/database/monsters"
      />

      {(monsters ?? []).length === 0 ? (
        <div className="card">
          <EmptyState what={q || undefined} clearHref="/database/monsters" />
        </div>
      ) : (
      <div className="card">
        {/* Same recognition-first card grid as the item list, plus the numbers
            players scan for when picking a hunting spot (Lv/HP/EXP) and the
            aggro flag, which rides with the monster on every surface, not just
            the detail page (spec 3.15.1). */}
        <div className="mongrid">
          {(monsters ?? []).map((m) => (
            <Link key={m.id} href={`/database/monsters/${m.id}`} className="moncard">
              {m.image_url ? (
                <img className="moncard__sprite" loading="lazy" decoding="async" src={m.image_url} alt="" width={40} height={40} />
              ) : (
                <span className="moncard__sprite" aria-hidden="true" />
              )}
              <span className="moncard__body">
                <span className="moncard__top">
                  <span className="moncard__name">{m.name_en}</span>
                  <AggroBadge monster={{ is_aggressive: m.is_aggressive, atk_max: m.atk_max }} />
                </span>
                <span className="moncard__meta">
                  Lv {m.level ?? '—'} · {m.race ?? '—'} · {m.element ?? '—'}
                </span>
                <span className="moncard__meta">
                  HP {m.hp != null ? m.hp.toLocaleString('en-US') : '—'} · EXP {m.base_exp != null ? m.base_exp.toLocaleString('en-US') : '—'}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} total={count ?? 0} pageSize={PAGE_SIZE} />
    </main>
  );
}

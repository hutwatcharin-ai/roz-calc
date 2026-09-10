// app/database/items/page.tsx
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { itemListJsonLd } from '@/lib/jsonld';
import { redirect } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import ItemIcon from '@/components/ItemIcon';
import FilterState, { EmptyState } from '@/components/FilterState';
import { ROLE_ORDER, ROLE_TH, applyItemRole, isItemRole, type ItemRole } from '@/lib/item-roles';
import RecentlyViewed from '@/components/RecentlyViewed';
import Pagination from '@/components/Pagination';
import { escapeLikePattern } from '@/lib/like-escape';
import { searchWords } from '@/lib/smart-search';
import { nameOrIdsFilter } from '@/lib/name-search';
import { aliasIdsFor } from '@/lib/thai-aliases';

export const metadata = {
  title: 'ฐานข้อมูลไอเทม',
  description: 'ไอเทมทั้งหมดในเกม Ragnarok Zero Global พร้อมค่าพลังโจมตี เลเวลที่ใช้ได้ อาชีพที่ใส่ได้ และมอนสเตอร์ที่ดรอป',
};

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

const PAGE_SIZE = 50;
// Every category present in the table. Enchantment, Enchant Stone and Special
// arrived with the 1,222 items rozerodb had and our own source never did; they
// are kept as their own options rather than folded into Other, because a
// category nobody can filter to is a category nobody finds.
// scripts/import-rozerodb-items.ts prints any category word it could not map,
// which is how these three were noticed.
// Consumables and materials only: equipment and cards moved to their own
// pages (/database/equipment, /database/cards), rozerodb-style. Legacy
// category params for those redirect below instead of 404-ing old links.
const CATEGORIES = [
  // Ammo was missing until 10 Sep 2026, which left its 14 arrows and bullets
  // reachable by search but on no list at all.
  'Ammo',
  'Consumable / Recovery',
  'Enchant Stone',
  'Enchantment',
  'Other',
  'Pet',
  'Special',
];
const MOVED: Record<string, string> = {
  Weapon: '/database/equipment?category=Weapon',
  Armor: '/database/equipment?category=Armor',
  // Costumes left the equipment list on 3 Sep 2026 -- that page no longer has
  // a Costume option, so this param used to land on an empty filtered list.
  'Costume Equipment': '/database/costumes',
  Card: '/database/cards',
};

export default async function ItemListPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string; sort?: string; page?: string; use?: string };
}) {
  const q = searchParams.q ?? '';
  // The default view is the wearable/usable catalog: costumes are a quarter
  // of the table and pure vanity, so they only appear when asked for --
  // via their own category or the explicit "all" option.
  const category = searchParams.category ?? '';
  if (MOVED[category]) redirect(MOVED[category]);
  const SORTS = {
    id: { label: 'รหัสไอเทม', column: 'id', ascending: true },
    name: { label: 'ชื่อ A-Z', column: 'name_en', ascending: true },
    buy: { label: 'ราคาซื้อสูงก่อน', column: 'buy_price', ascending: false },
  } as const;
  const sort = (searchParams.sort ?? 'id') in SORTS ? ((searchParams.sort ?? 'id') as keyof typeof SORTS) : 'id';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);
  // "What is it for", the same question the card list answers with chips. Each
  // group has a source behind it (lib/item-roles); nothing is guessed from a
  // name.
  const role = isItemRole(searchParams.use) ? searchParams.use : '';

  const db = supabaseBrowser();
  let query = db.from('items').select('id, name_en, category, weapon_type, icon_url', { count: 'exact' });

  if (q) {
    // One condition per word, ANDed: "potion red" finds Red Potion, which
    // a single `%potion red%` never could. Words, not the raw string, is
    // the whole difference (7 Sep 2026).
    // A Thai search cannot match an English column, so the Thai names
    // players use are resolved to ids first and OR-ed in (lib/thai-aliases).
    const aliasIds = aliasIdsFor('items', q);
    if (aliasIds.length > 0) {
      // lib/name-search, because both copies of this were written with a
      // URL-encoded wildcard and matched nothing by name at all.
      const filter = nameOrIdsFilter('name_en', q, aliasIds);
      if (filter) query = query.or(filter);
    } else {
      for (const word of searchWords(q)) {
        query = query.ilike('name_en', `%${escapeLikePattern(word)}%`);
      }
    }
  }
  if (category) {
    query = query.eq('category', category);
  } else {
    // The default view is this section's whole scope: usable items, not gear.
    query = query.in('category', CATEGORIES);
  }
  if (role) query = applyItemRole(query, role);

  // One count per chip, head-only, so a chip never leads to an empty page and
  // the numbers come from the same rules the filter uses.
  const roleCounts = new Map<ItemRole, number>(
    await Promise.all(
      ROLE_ORDER.map(async (r) => {
        const counted = applyItemRole(
          db.from('items').select('id', { count: 'exact', head: true }).in('category', CATEGORIES),
          r,
        );
        const { count: n, error: countError } = await counted;
        if (countError) console.error('item role count failed', r, countError);
        return [r, n ?? 0] as [ItemRole, number];
      }),
    ),
  );
  const grouped = ROLE_ORDER.reduce((sum, r) => sum + (roleCounts.get(r) ?? 0), 0);

  const from = (page - 1) * PAGE_SIZE;
  const { data: items, count, error } = await query
    .order(SORTS[sort].column, { ascending: SORTS[sort].ascending, nullsFirst: false })
    .order('id')
    .range(from, from + PAGE_SIZE - 1);

  if (error) {
    console.error('items list query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // A chip keeps the search and the category the reader already set, and drops
  // the page number: page 4 of the old filter is not page 4 of this one.
  function roleHref(target: ItemRole | ''): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort !== 'id') params.set('sort', sort);
    if (target) params.set('use', target);
    const qs = params.toString();
    return `/database/items${qs ? `?${qs}` : ''}`;
  }

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (sort !== 'id') params.set('sort', sort);
    if (role) params.set('use', role);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/items${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      {items && items.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/items',
            rows: items.map((i) => ({ id: i.id, name: i.name_en })),
            detailPath: (id) => `/database/items/${id}`,
          })}
        />
      )}
      <PageHeader title="ฐานข้อมูลไอเทม Ragnarok Zero" />
      <RecentlyViewed />
      <FilterState
        count={count ?? 0}
        unit="ชิ้น"
        filters={[
          { label: 'คำค้น', value: q },
          { label: 'หมวด', value: category },
          { label: 'เอาไว้', value: role ? ROLE_TH[role].title : '' },
        ]}
        clearHref="/database/items"
      />

      {/* Chips, not another dropdown: the list of uses is itself the thing worth
          reading. Unlike the card page, where the group is read off the card's
          own effect, every group here points at a source -- a recipe, the
          game's category, or a phrase in the game's own description. Items
          with no such source are not filed anywhere, and the line below says
          how many that is. */}
      <section className="rolepick">
        <h2 className="rolepick__label">เอาไว้ทำอะไร</h2>
        <div className="chips">
          <Link className={`chip${role === '' ? ' chip--on' : ''}`} href={roleHref('')}>
            ทั้งหมด
          </Link>
          {ROLE_ORDER.filter((r) => (roleCounts.get(r) ?? 0) > 0).map((r) => (
            <Link
              key={r}
              className={`chip${role === r ? ' chip--on' : ''}`}
              href={roleHref(r)}
              title={ROLE_TH[r].asks}
            >
              {ROLE_TH[r].title} {roleCounts.get(r)}
            </Link>
          ))}
        </div>
        {role ? (
          <p className="rolepick__asks">{ROLE_TH[role].asks}</p>
        ) : (
          <p className="rolepick__asks">
            กลุ่มพวกนี้มาจากสูตรคราฟต์ หมวดในเกม และคำอธิบายในเกมเท่านั้น — ของที่ไม่มีหลักฐานว่าใช้ทำอะไรจะไม่ถูกจัดกลุ่ม
            (ตอนนี้จัดได้ {grouped} ชิ้นจากทั้งหมด {count ?? 0} ชิ้น นับซ้ำได้ถ้าชิ้นเดียวใช้ได้หลายอย่าง)
          </p>
        )}
      </section>

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อไอเทม..." />
        <select name="category" defaultValue={category}>
          <option value="">ทุกหมวด</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
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
        {role && <input type="hidden" name="use" value={role} />}
        <button type="submit" className="btn">ค้นหา</button>
        <Link href="/database/equipment" className="btn" style={{ textDecoration: 'none' }}>
          อุปกรณ์
        </Link>
        <Link href="/database/cards" className="btn" style={{ textDecoration: 'none' }}>
          การ์ด
        </Link>
      </form>

      {(items ?? []).length === 0 ? (
        <div className="card">
          <EmptyState kind="items" what={q || undefined} clearHref="/database/items" />
        </div>
      ) : (
      <div className="card">
{/* A card grid, not a table: with sprites now mirrored for every item, the
            icon carries recognition -- players know items by sprite before name.
            Multi-column also makes 50 items shorter on a phone than the old
            three-column table stack was (UX audit: item list was 5.7 screens). */}
        <div className="itemgrid">
          {(items ?? []).map((it) => (
            <Link key={it.id} href={`/database/items/${it.id}`} className="itemcard">
              <ItemIcon iconUrl={it.icon_url} category={it.category} size={32} />
              <span className="itemcard__name">{it.name_en}</span>
              <span className="itemcard__meta">
                {it.category ?? '—'}
                {it.weapon_type ? ` · ${it.weapon_type}` : ''}
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

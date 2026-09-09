// app/database/monsters/page.tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import JsonLd from '@/components/JsonLd';
import { itemListJsonLd } from '@/lib/jsonld';
import { supabaseBrowser } from '@/lib/supabase';
import { unknownIfZero } from '@/lib/unknown-stat';
import Pagination from '@/components/Pagination';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import RecentlyViewed from '@/components/RecentlyViewed';
import AggroBadge from '@/components/AggroBadge';
import { escapeLikePattern } from '@/lib/like-escape';
import { searchWords } from '@/lib/smart-search';
import { aliasIdsFor } from '@/lib/thai-aliases';
import { formerNameIdsFor } from '@/lib/former-names';
import { cardNameMonsterIds } from '@/lib/card-name-aliases';
import CVariantToggle from '@/components/CVariantToggle';
import { C_VARIANT_SQL_NOT_LIKE, INSTANCE_VARIANT_SQL_NOT_LIKE } from '@/lib/c-variant';
import { monsterCounts } from '@/lib/counts';

// The site's most-visited page and its worst-converting entry from search:
// "ข้อมูลมอนสเตอร์ ro zero" put us at position 4.7 for 82 impressions and
// three clicks -- 3.7% where the site averages 9-11% (Search Console, 90
// days to 7 Sep 2026). The old title said "ฐานข้อมูลมอนสเตอร์" and nothing
// else: no game name, no size, nothing telling the searcher this is the
// thing they asked for.
//
// The count in the title is read from the table, not written here. It said
// "349 ตัว" until 8 Sep 2026, when importing ten monsters made the page list
// 359 and the title keep claiming 349 -- nothing errored, the title simply
// became untrue (lib/counts).
export async function generateMetadata(): Promise<Metadata> {
  const { listed } = await monsterCounts();
  // No number at all beats a wrong one: if the count did not come back, the
  // title says what the page is without claiming a size.
  const size = listed === null ? '' : ` — ${listed.toLocaleString('en-US')} ตัว`;
  return {
    title: `ข้อมูลมอนสเตอร์ RO Zero${size} ดรอป จุดเกิด ค่าสถานะ`,
    description:
      'มอนสเตอร์ทุกตัวใน Ragnarok Zero Global ภาษาไทย — ค้นชื่อ กรองตามเผ่า ธาตุ ช่วงเลเวล ดูของที่ดรอป แมพที่เจอ HP EXP และ HIT/FLEE ที่ต้องมี',
  };
}

// Daily ISR (spec §5). Note: this does NOT move the page off the build-time
// prerender path — Next.js still prerenders it once at build, so Supabase
// env vars must still be present as build-time variables in Coolify.
export const revalidate = 86400;

const PAGE_SIZE = 50;
const RACES = ['Angel', 'Brute', 'Demi-Human', 'Demon', 'Dragon', 'Fish', 'Formless', 'Insect', 'Plant', 'Undead'];
const ELEMENTS = ['Earth', 'Fire', 'Ghost', 'Holy', 'Neutral', 'Poison', 'Shadow', 'Undead', 'Water', 'Wind'];
const SIZES = ['Small', 'Medium', 'Large'];

// The value stays English -- it is what the column holds and what the game
// shows -- but the dropdown says it in Thai as well. Someone searched
// "เผ่า plant" on Google and landed here (Search Console, 90 days), which is
// a person reading the word in Thai and the list only offering it in English.
const RACE_TH: Record<string, string> = {
  Angel: 'เทวดา', Brute: 'สัตว์', 'Demi-Human': 'กึ่งมนุษย์', Demon: 'ปีศาจ', Dragon: 'มังกร',
  Fish: 'ปลา', Formless: 'ไร้รูปร่าง', Insect: 'แมลง', Plant: 'พืช', Undead: 'อันเดด',
};
const ELEMENT_TH: Record<string, string> = {
  Earth: 'ดิน', Fire: 'ไฟ', Ghost: 'ผี', Holy: 'ศักดิ์สิทธิ์', Neutral: 'ไร้ธาตุ',
  Poison: 'พิษ', Shadow: 'มืด', Undead: 'อันเดด', Water: 'น้ำ', Wind: 'ลม',
};
const SIZE_TH: Record<string, string> = { Small: 'เล็ก', Medium: 'กลาง', Large: 'ใหญ่' };

export default async function MonsterListPage({
  searchParams,
}: {
  searchParams: {
    q?: string; race?: string; element?: string; size?: string; aggro?: string;
    lvmin?: string; lvmax?: string; sort?: string; page?: string; c?: string; mj?: string; mvp?: string;
  };
}) {
  const q = searchParams.q ?? '';
  const race = searchParams.race ?? '';
  const element = searchParams.element ?? '';
  const size = SIZES.includes(searchParams.size ?? '') ? (searchParams.size as string) : '';
  // The card has carried this badge since the start; now it can be filtered
  // on, which is the question behind it ("can I stand here AFK").
  const aggro = searchParams.aggro === '1' ? '1' : searchParams.aggro === '0' ? '0' : '';
  // Challenge clones are opt-in: absent param = hidden. Server-side so the
  // result count and pagination stay exact (unlike the CSS hide elsewhere).
  const showC = searchParams.c === '1';
  // Instance, event and memorial-dungeon monsters, hidden the same way and for
  // the same reason: "Orc Warrior" and "Orc Warrior Mj" next to each other is
  // one entry the reader wants and one they have to read past. The Mq, Ztw and
  // B families are worse than that -- no source has a single stat for any of
  // them, so their rows read "HP — · EXP —".
  const showMj = searchParams.mj === '1';
  // Somebody typed "mvp" into the search box, twice: the flag was in the
  // table and nowhere on the page. 24 monsters carry it.
  const mvpOnly = searchParams.mvp === '1';
  // Level bounds: hunting is level-band shopping, and the sort alone cannot
  // answer "what is around my level". Empty stays empty; junk becomes empty.
  const lvmin = Math.max(0, Number(searchParams.lvmin ?? 0) || 0);
  const lvmax = Math.max(0, Number(searchParams.lvmax ?? 0) || 0);
  // A whitelist, not a passthrough: the sort key goes into the query.
  const SORTS = {
    level: { label: 'เลเวลน้อยก่อน', column: 'level', ascending: true },
    exp: { label: 'EXP มากก่อน', column: 'base_exp', ascending: false },
    name: { label: 'ชื่อ A-Z', column: 'name_en', ascending: true },
  } as const;
  const sort = (searchParams.sort ?? 'level') in SORTS ? ((searchParams.sort ?? 'level') as keyof typeof SORTS) : 'level';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();
  const counts = await monsterCounts();
  let query = db
    .from('monsters')
    .select('id, name_en, level, race, element, image_url, is_aggressive, atk_max, hp, base_exp', { count: 'exact' });

  if (q) {
    // One condition per word, ANDed: "potion red" finds Red Potion, which
    // a single `%potion red%` never could. Words, not the raw string, is
    // the whole difference (7 Sep 2026).
    // A Thai search cannot match an English column, so the Thai names
    // players use are resolved to ids first and OR-ed in (lib/thai-aliases).
    // Same treatment for a name this table used to carry: thirty monsters
    // were renamed on 7-8 Sep 2026, and "Pecopeco" or "Wootan Fighter" must
    // still land on the row that now says Peco Peco or Utan Fighter.
    // And the name on a card this monster drops: 39 cards are named after
    // something the monster is not, so "Zealotus" has to reach Zherlthsh
    // (lib/card-name-aliases).
    const aliasIds = [...new Set([...aliasIdsFor('monsters', q), ...formerNameIdsFor(q), ...cardNameMonsterIds(q)])];
    if (aliasIds.length > 0) {
      const like = searchWords(q).map((w) => `name_en.ilike.%25${escapeLikePattern(w)}%25`);
      query = query.or([...like, `id.in.(${aliasIds.join(',')})`].join(','));
    } else {
      for (const word of searchWords(q)) {
        query = query.ilike('name_en', `%${escapeLikePattern(word)}%`);
      }
    }
  }
  if (race) query = query.eq('race', race);
  if (element) query = query.eq('element', element);
  if (size) query = query.eq('size', size);
  if (aggro) query = query.eq('is_aggressive', aggro === '1');
  if (!showC) query = query.not('name_en', 'like', C_VARIANT_SQL_NOT_LIKE);
  if (!showMj) for (const pattern of INSTANCE_VARIANT_SQL_NOT_LIKE) query = query.not('name_en', 'like', pattern);
  if (mvpOnly) query = query.eq('is_mvp', true);
  if (lvmin > 0) query = query.gte('level', lvmin);
  if (lvmax > 0) query = query.lte('level', lvmax);

  const from = (page - 1) * PAGE_SIZE;
  const { data: monsters, count, error } = await query
    .order(SORTS[sort].column, { ascending: SORTS[sort].ascending, nullsFirst: false })
    .order('id')
    .range(from, from + PAGE_SIZE - 1);

  // The drop people came for, on the card. Reading a monster up is nearly
  // always "what does it give me", and the grid was a list of names with
  // stats -- the search log for this page is 100% monster names typed into
  // the box, because the cards themselves answered nothing worth stopping
  // for. One query for the whole page, best rate first.
  const ids = (monsters ?? []).map((m) => m.id);
  const topDrops = new Map<number, { name: string; rate: number | null; id: number }[]>();
  if (ids.length > 0) {
    const { data: drops, error: dropsError } = await db
      .from('monster_drops')
      .select('monster_id, rate, items(id, name_en)')
      .in('monster_id', ids)
      .order('rate', { ascending: false, nullsFirst: false })
      .range(0, 1999);
    // No drops is a plainer card, not a broken page.
    if (dropsError) console.error('monster list drops query failed', dropsError);
    for (const d of (drops ?? []) as unknown as {
      monster_id: number;
      rate: number | null;
      items: { id: number; name_en: string } | null;
    }[]) {
      if (!d.items) continue;
      const list = topDrops.get(d.monster_id) ?? [];
      if (list.length >= 2) continue;
      list.push({ id: d.items.id, name: d.items.name_en, rate: d.rate });
      topDrops.set(d.monster_id, list);
    }
  }

  if (error) {
    console.error('monsters list query failed', error);
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Same URL with the Mj switch flipped, always back to page 1: the row
  // count changes, so the page number would stop meaning the same thing.
  function mjHref(next: boolean): string {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (race) params.set('race', race);
    if (element) params.set('element', element);
    if (size) params.set('size', size);
    if (aggro) params.set('aggro', aggro);
    if (lvmin > 0) params.set('lvmin', String(lvmin));
    if (lvmax > 0) params.set('lvmax', String(lvmax));
    if (sort !== 'level') params.set('sort', sort);
    if (showC) params.set('c', '1');
    if (next) params.set('mj', '1');
    if (mvpOnly) params.set('mvp', '1');
    const qs = params.toString();
    return `/database/monsters${qs ? `?${qs}` : ''}`;
  }

  function buildHref(targetPage: number, showCOverride?: boolean) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (race) params.set('race', race);
    if (element) params.set('element', element);
    if (size) params.set('size', size);
    if (aggro) params.set('aggro', aggro);
    if (lvmin > 0) params.set('lvmin', String(lvmin));
    if (lvmax > 0) params.set('lvmax', String(lvmax));
    if (sort !== 'level') params.set('sort', sort);
    if (showCOverride ?? showC) params.set('c', '1');
    if (showMj) params.set('mj', '1');
    if (mvpOnly) params.set('mvp', '1');
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/monsters${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      {monsters && monsters.length > 0 && (
        <JsonLd
          data={itemListJsonLd({
            path: '/database/monsters',
            rows: monsters.map((m) => ({ id: m.id, name: m.name_en })),
            detailPath: (id) => `/database/monsters/${id}`,
          })}
        />
      )}
      <PageHeader title="ฐานข้อมูลมอนสเตอร์ Ragnarok Zero" />
      <RecentlyViewed />

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อมอนสเตอร์" aria-label="ค้นชื่อมอนสเตอร์" />
        <select name="race" defaultValue={race} aria-label="เผ่า">
          <option value="">ทุกเผ่า</option>
          {RACES.map((r) => (
            <option key={r} value={r}>
              {r} · {RACE_TH[r]}
            </option>
          ))}
        </select>
        <select name="element" defaultValue={element} aria-label="ธาตุ">
          <option value="">ทุกธาตุ</option>
          {ELEMENTS.map((e) => (
            <option key={e} value={e}>
              {e} · {ELEMENT_TH[e]}
            </option>
          ))}
        </select>
        <select name="size" defaultValue={size} aria-label="ขนาด">
          <option value="">ทุกขนาด</option>
          {SIZES.map((z) => (
            <option key={z} value={z}>
              {z} · {SIZE_TH[z]}
            </option>
          ))}
        </select>
        <select name="aggro" defaultValue={aggro} aria-label="โจมตีก่อนหรือไม่">
          <option value="">โจมตีก่อน/ไม่ ก็ได้</option>
          <option value="0">ไม่โจมตีก่อน</option>
          <option value="1">โจมตีก่อน</option>
        </select>
        <select name="mvp" defaultValue={mvpOnly ? '1' : ''} aria-label="เฉพาะบอส MVP">
          <option value="">ทุกตัว</option>
          <option value="1">เฉพาะบอส MVP</option>
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--dim)', font: '500 13px/1.4 var(--font-sarabun), sans-serif' }}>
          Lv{' '}
          <input className="mono" type="number" name="lvmin" defaultValue={lvmin > 0 ? lvmin : ''} placeholder="ต่ำสุด" inputMode="numeric" style={{ width: 74 }} aria-label="เลเวลต่ำสุด" />
          –
          <input className="mono" type="number" name="lvmax" defaultValue={lvmax > 0 ? lvmax : ''} placeholder="สูงสุด" inputMode="numeric" style={{ width: 74 }} aria-label="เลเวลสูงสุด" />
        </label>
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
        {showMj && <input type="hidden" name="mj" value="1" />}
        <CVariantToggle mode="nav" navShow={showC} navHrefShow={buildHref(1, true)} navHrefHide={buildHref(1, false)} />
        {/* Plain link, not the C toggle's remembered checkbox: this one has
            no reason to follow the reader onto other pages, and the count is
            named so nothing disappears silently. */}
        <Link className="cvtoggle" href={mjHref(!showMj)} scroll={false}>
          <input type="checkbox" checked={!showMj} readOnly tabIndex={-1} aria-hidden="true" />
          ซ่อนมอนดันเจี้ยน/อีเวนต์ (Mj Md Mq Ztw B) {counts.mjVariants === null ? '' : `${counts.mjVariants} ตัว`}
        </Link>
      </form>

      <FilterState
        count={count ?? 0}
        unit="ตัว"
        filters={[
          { label: 'คำค้น', value: q },
          { label: 'เผ่า', value: race },
          { label: 'ธาตุ', value: element },
          // Every filter that is on has to appear here: a filter applied and
          // not named is the reason a reader thinks the database is missing
          // rows.
          { label: 'ขนาด', value: size ? `${size} · ${SIZE_TH[size]}` : '' },
          { label: 'พฤติกรรม', value: aggro === '1' ? 'โจมตีก่อน' : aggro === '0' ? 'ไม่โจมตีก่อน' : '' },
          { label: 'บอส', value: mvpOnly ? 'เฉพาะ MVP' : '' },
          { label: 'เลเวล', value: lvmin > 0 || lvmax > 0 ? `${lvmin > 0 ? lvmin : '1'}–${lvmax > 0 ? lvmax : 'สูงสุด'}` : '' },
        ]}
        clearHref="/database/monsters"
      />

      {(monsters ?? []).length === 0 ? (
        <div className="card">
          <EmptyState kind="monsters" what={q || undefined} clearHref="/database/monsters" />
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
                  {/* 0 is this table's unknown marker for these two columns,
                      not a monster with no hit points -- see lib/unknown-stat. */}
                  HP {unknownIfZero(m.hp)} · EXP {unknownIfZero(m.base_exp)}
                </span>
                {(topDrops.get(m.id) ?? []).length > 0 && (
                  <span className="moncard__drops">
                    ดรอป:{' '}
                    {(topDrops.get(m.id) ?? []).map((d, i) => (
                      <span key={d.id}>
                        {i > 0 && ' · '}
                        {d.name}
                        {d.rate != null && <span className="moncard__rate"> {d.rate}%</span>}
                      </span>
                    ))}
                  </span>
                )}
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

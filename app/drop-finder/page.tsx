// app/drop-finder/page.tsx
import { isAbsentFromGame } from '@/lib/game-absent';
import { supabaseBrowser } from '@/lib/supabase';
import DropSearch from '@/components/DropSearch';
import { escapeLikePattern } from '@/lib/like-escape';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import Pagination from '@/components/Pagination';
import { rankDrops } from '@/lib/drop-rank';
import { mapRelease } from '@/lib/map-availability';

export const metadata = {
  title: 'ค้นของดรอป Ragnarok Zero',
  description: 'พิมพ์ชื่อไอเทมแล้วดูว่ามอนสเตอร์ตัวไหนดรอป อัตราดรอปเท่าไร และเจอมอนตัวนั้นได้ที่แมพไหน',
};

// Resolve the search text to exactly one item. An exact (case-insensitive)
// name wins outright; only if nothing matches exactly do we fall back to a
// substring match. The caller surfaces the resolved name so a fallback match
// is visible to the user instead of silently picking an arbitrary row.
// Several game items share one name across ids ("Shield" is 460060 and
// 460071; only one drops). On a drop-finder, the candidate that has drops is
// always the one the player means, so ties resolve toward it.
async function pickDroppable(
  db: ReturnType<typeof supabaseBrowser>,
  candidates: { id: number; name_en: string; slots?: number | null }[],
) {
  if (candidates.length === 1) return candidates[0];
  const { data, error } = await db
    .from('monster_drops')
    .select('item_id')
    .in('item_id', candidates.map((c) => c.id));
  if (error) {
    console.error('droppable tiebreak failed', error);
    return candidates[0];
  }
  const withDrops = new Set((data ?? []).map((d) => d.item_id));
  return candidates.find((c) => withDrops.has(c.id)) ?? candidates[0];
}

async function resolveItem(db: ReturnType<typeof supabaseBrowser>, query: string) {
  const needle = escapeLikePattern(query);
  const { data: exact, error: exactError } = await db
    .from('items')
    .select('id, name_en, slots')
    .ilike('name_en', needle)
    .limit(10);

  if (exactError) {
    console.error('item exact lookup failed', exactError);
    return null;
  }
  if (exact && exact.length > 0) return pickDroppable(db, exact);

  const { data: partial, error: partialError } = await db
    .from('items')
    .select('id, name_en, slots, icon_url')
    .ilike('name_en', `%${needle}%`)
    .order('name_en')
    .limit(40);

  if (partialError) {
    console.error('item substring lookup failed', partialError);
    return null;
  }
  if (!partial || partial.length === 0) return null;

  // A part of a name ("arc", "cross") used to pick one item for the player.
  // When several items that drop match, the page lists them to choose from
  // instead (owner, 6 Oct 2026).
  const { data: dropRows } = await db.from('monster_drops').select('item_id').in('item_id', partial.map((c) => c.id));
  const dropping = new Set((dropRows ?? []).map((d) => d.item_id));
  const choices = partial.filter((c) => dropping.has(c.id) && !isAbsentFromGame(c.id));
  if (choices.length > 1) return { choices };
  return pickDroppable(db, choices.length ? choices : partial);
}

interface Choice {
  id: number;
  name_en: string;
  slots?: number | null;
  icon_url?: string | null;
}

async function findDrops(query: string, itemId: number | null) {
  const none = { resolvedName: null, resolvedInputName: null, resolvedId: null, rows: [], choices: [] as Choice[] };
  if (!query && !itemId) return none;
  const db = supabaseBrowser();

  // An explicit id (starter-table links) skips name resolution entirely:
  // same-name items make a name round-trip ambiguous.
  let item: { id: number; name_en: string; slots?: number | null } | null = null;
  if (itemId) {
    const { data, error } = await db.from('items').select('id, name_en, slots').eq('id', itemId).limit(1);
    if (error) console.error('item id lookup failed', error);
    item = data?.[0] ?? null;
  } else {
    const found = await resolveItem(db, query);
    if (found && 'choices' in found) return { ...none, choices: found.choices as Choice[] };
    item = found;
  }
  if (!item) return none;

  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('monster_id, rate, monsters(name_en, image_url, level, is_aggressive, atk_max)')
    .eq('item_id', item.id)
    .order('rate', { ascending: false })
    // 80: Challenge clones are hidden by default on the client, and a popular
    // item's top rows can be mostly C rows.
    .limit(80);

  const resolvedName = (item.slots ?? 0) > 0 ? `${item.name_en} [${item.slots}]` : (item.name_en as string);
  if (dropsError || !drops) {
    if (dropsError) console.error('monster_drops query failed', dropsError);
    return { ...none, resolvedName, resolvedInputName: item.name_en, resolvedId: item.id as number };
  }

  // Where each monster stands and how many of it: the ranking wants the open
  // map with the most of it (lib/drop-rank, owner 6 Oct 2026).
  const ids = [...new Set(drops.map((d: any) => d.monster_id as number))];
  const { data: spawns, error: spawnsError } = ids.length
    ? await db.from('monster_spawns').select('monster_id, map_code, map_display_name, amount').in('monster_id', ids)
    : { data: [], error: null };
  if (spawnsError) console.error('drop finder spawns failed', spawnsError);

  const base = drops.map((d: any) => ({
    monster_id: d.monster_id as number,
    monster_name: d.monsters.name_en as string,
    monster_image_url: d.monsters.image_url as string | null,
    monster_level: (d.monsters.level ?? null) as number | null,
    is_aggressive: (d.monsters.is_aggressive ?? null) as boolean | null,
    atk_max: (d.monsters.atk_max ?? null) as number | null,
    rate: d.rate as number | null,
  }));
  const ranked = rankDrops(
    base,
    (spawns ?? []).map((s: any) => ({ monster_id: s.monster_id, map_code: s.map_code, map_name: s.map_display_name, amount: s.amount })),
    (code) => Boolean(mapRelease(code)),
  );
  return {
    resolvedName,
    resolvedInputName: item.name_en as string,
    resolvedId: item.id as number,
    rows: ranked.map((r) => ({ ...r.row, best: r.best, perClear: r.perClear, killsPerItem: r.killsPerItem, closed: r.closed })),
    choices: [] as Choice[],
  };
}

// Example searches for the empty state. Hand-picked common farm targets, not
// data-derived: they are prompts that show what the page does, so they should
// stay recognizable names rather than whatever tops a price sort.
const SAMPLE_SEARCHES = ['Steel', 'Elunium Ore', 'Rough Oridecon', 'Evil Horn', 'Jellopy', 'Emperium', 'Witherless Rose'];
// The plain weapons with a ★ version that people search here most.
const STAR_BASES = ['Ring Pommel Saber', 'Chain', 'Book', 'Cross Bow', 'Jur', 'Stiletto', 'Wand', 'Slayer', 'Guisarme'];

// Fills the page before the first search: every NPC-sellable item that drops
// from a monster, best price first, 40 a page (user, 7 Sep 2026: the top-12
// list was too short -- "bring up a lot more, with pages"). Both tables are
// over PostgREST's 1,000-row cut, so each is read in full with fetchAllRows
// and joined here; ~1,100 sellables x ~3,700 drop rows is a few kB.
const STARTER_PAGE_SIZE = 40;

function starterHref(sort: string, page: number): string {
  const params = new URLSearchParams();
  if (sort !== 'price') params.set('sort', sort);
  if (page > 1) params.set('page', String(page));
  const qs = params.toString();
  return qs ? `/drop-finder?${qs}` : '/drop-finder';
}

interface StarterItem {
  id: number;
  name_en: string;
  name_th: string | null;
  sell_price: number;
  icon_url: string | null;
  slots: number | null;
  dropCount: number;
}

async function starterList(): Promise<StarterItem[]> {
  const db = supabaseBrowser();
  const { data: items, error } = await fetchAllRows<{
    id: number;
    name_en: string;
    name_th: string | null;
    sell_price: number;
    icon_url: string | null;
    slots: number | null;
  }>((from, to) =>
    db
      .from('items')
      .select('id, name_en, name_th, sell_price, icon_url, slots')
      // Equipment excluded (user call, 2 Sep): equipment NPC-sell prices swing
      // with the market/patches and several were plain wrong before the
      // rozerodb sync — the starter list stays on goods with stable prices.
      .not('category', 'in', '("Armor","Weapon","Costume Equipment")')
      .gt('sell_price', 0)
      .order('id')
      .range(from, to),
  );
  if (error || !items || items.length === 0) {
    if (error) console.error('starter items query failed', error);
    return [];
  }
  const { data: drops, error: dropsError } = await fetchAllRows<{ id: number; item_id: number }>((from, to) =>
    db.from('monster_drops').select('id, item_id').order('id').range(from, to),
  );
  if (dropsError || !drops) {
    if (dropsError) console.error('starter drops query failed', dropsError);
    return [];
  }
  const count = new Map<number, number>();
  for (const d of drops) count.set(d.item_id, (count.get(d.item_id) ?? 0) + 1);
  return items
    .filter((i) => count.has(i.id) && !isAbsentFromGame(i.id))
    .map((i) => ({ ...i, dropCount: count.get(i.id) as number }))
    .sort((a, b) => b.sell_price - a.sell_price || a.name_en.localeCompare(b.name_en));
}

export default async function DropFinderPage({ searchParams }: { searchParams: { q?: string; id?: string; page?: string; sort?: string } }) {
  // Some links reach here as ?q=steel?q=steel (about 200 views in the 28 days
  // to 6 Oct 2026, source not found); the first value is what was meant.
  const query = (searchParams.q ?? '').split('?')[0].trim();
  const itemId = Number(searchParams.id) || null;
  const { resolvedName, resolvedInputName, resolvedId, rows, choices } = await findDrops(query, itemId);
  const searched = Boolean(query || itemId);
  const sort = searchParams.sort === 'drops' || searchParams.sort === 'name' ? searchParams.sort : 'price';
  const allStarters = searched ? [] : await starterList();
  // Server-rendered and paged, so the sort rides in the URL like the list
  // pages do. Price is the table's premise, so it is the default and ties
  // under the other keys fall back to it.
  if (sort === 'drops') allStarters.sort((a, b) => b.dropCount - a.dropCount || b.sell_price - a.sell_price);
  else if (sort === 'name') allStarters.sort((a, b) => a.name_en.localeCompare(b.name_en));
  const totalPages = Math.max(1, Math.ceil(allStarters.length / STARTER_PAGE_SIZE));
  const page = Math.min(totalPages, Math.max(1, Number(searchParams.page ?? 1) || 1));
  const starters = allStarters.slice((page - 1) * STARTER_PAGE_SIZE, page * STARTER_PAGE_SIZE);

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <p className="arckicker">DROP FINDER · ค้นของดรอป</p>
      <h1 className="pagehead__title arcname">
        <span className="nobr">ไอเทมนี้ดรอป</span> <span className="nobr">จากมอนตัวไหน</span>
      </h1>
      <div className="panel" style={{ marginTop: 14 }}>
        <DropSearch query={query || resolvedInputName || ''} resolvedName={resolvedName} resolvedId={resolvedId} rows={rows} choices={choices} />
      </div>
      {/* Shortcuts from what people search here (GA4, 28 days to 6 Oct 2026):
          materials, and the dropped weapons people stock up for star tokens. */}
      {!searched && (
        <div className="dropfind__quick">
          <p>
            <strong><b>SELECT</b> วัตถุดิบที่ค้นบ่อย</strong>
            {SAMPLE_SEARCHES.map((name) => (
              <a key={name} className="chiplink" href={`/drop-finder?q=${encodeURIComponent(name)}`}>
                {name}
              </a>
            ))}
          </p>
          <p>
            <strong><b>★ BONUS</b> เก็บของดรอปไว้ทำโทเคนของติดดาว</strong>
            {STAR_BASES.map((name) => (
              <a key={name} className="chiplink" href={`/drop-finder?q=${encodeURIComponent(name)}`}>
                {name}
              </a>
            ))}
            <a className="chiplink" href="/guides/star-gear">ไกด์ของติดดาว →</a>
          </p>
        </div>
      )}
      {starters.length > 0 && (
        <section className="card" style={{ marginTop: 20 }}>
          <p className="arckicker" style={{ color: 'var(--yellow)', textShadow: '0 0 8px var(--glow-yellow)' }}>TREASURE LIST</p>
          <h2 style={{ font: '700 16px/1.6 var(--font-sarabun), sans-serif' }}>ของขายได้ราคาที่ฟาร์มได้</h2>
          <p className="muted" style={{ marginTop: 2 }}>เรียงตามราคาขายร้าน NPC · กดชื่อเพื่อดูว่าตัวไหนดรอป</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th><a className="thsort" href={starterHref('name', 1)}>ไอเทม {sort === 'name' ? '↑' : '↕'}</a></th>
                  <th style={{ textAlign: 'right' }}><a className="thsort" href={starterHref('price', 1)}>ขายร้าน (Zeny) {sort === 'price' ? '↓' : '↕'}</a></th>
                  <th style={{ textAlign: 'right' }}><a className="thsort" href={starterHref('drops', 1)}>มอนที่ดรอป {sort === 'drops' ? '↓' : '↕'}</a></th>
                </tr>
              </thead>
              <tbody>
                {starters.map((it) => (
                  <tr key={it.id}>
                    <td>
                      <a href={`/drop-finder?id=${it.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {it.icon_url && <img src={it.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />}
                        {it.name_en}
                        {(it.slots ?? 0) > 0 && <span className="mono" style={{ color: 'var(--cyan)' }}>[{it.slots}]</span>}
                        {it.name_th && <span className="muted">{it.name_th}</span>}
                      </a>
                    </td>
                    <td className="mono" style={{ textAlign: 'right' }}>{it.sell_price.toLocaleString()}</td>
                    <td className="mono" style={{ textAlign: 'right' }}>{it.dropCount} ตัว</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            buildHref={(p) => starterHref(sort, p)}
            total={allStarters.length}
            pageSize={STARTER_PAGE_SIZE}
          />
        </section>
      )}
      {!searched && (
        <p className="muted" style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          เครื่องมือใกล้กัน:
          <a className="chiplink" href="/">หาจุดฟาร์ม</a>
          <a className="chiplink" href="/tools/leveling-spots?mode=afk">หาจุด AFK</a>
          <a className="chiplink" href="/tools/damage">ตีตัวนี้ด้วยอะไรดี</a>
        </p>
      )}
    </main>
  );
}

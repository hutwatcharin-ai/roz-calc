// app/drop-finder/page.tsx
import { supabaseBrowser } from '@/lib/supabase';
import DropSearch from '@/components/DropSearch';
import { escapeLikePattern } from '@/lib/like-escape';

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
    .select('id, name_en, slots')
    .ilike('name_en', `%${needle}%`)
    .order('name_en')
    .limit(10);

  if (partialError) {
    console.error('item substring lookup failed', partialError);
    return null;
  }
  if (!partial || partial.length === 0) return null;

  return pickDroppable(db, partial);
}

async function findDrops(query: string, itemId: number | null) {
  if (!query && !itemId) return { resolvedName: null, resolvedInputName: null, resolvedId: null, rows: [] };
  const db = supabaseBrowser();

  // An explicit id (starter-table links) skips name resolution entirely:
  // same-name items make a name round-trip ambiguous.
  let item: { id: number; name_en: string; slots?: number | null } | null = null;
  if (itemId) {
    const { data, error } = await db.from('items').select('id, name_en, slots').eq('id', itemId).limit(1);
    if (error) console.error('item id lookup failed', error);
    item = data?.[0] ?? null;
  } else {
    item = await resolveItem(db, query);
  }
  if (!item) return { resolvedName: null, resolvedInputName: null, resolvedId: null, rows: [] };

  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('monster_id, rate, monsters(name_en, image_url, level, is_aggressive, atk_max)')
    .eq('item_id', item.id)
    .order('rate', { ascending: false })
    // 40 not 10: Challenge clones are hidden by default on the client, and a
    // popular item's top-10 can be mostly C rows -- the visible list would
    // shrink to two or three real monsters.
    .limit(40);

  if (dropsError || !drops) {
    if (dropsError) console.error('monster_drops query failed', dropsError);
    return { resolvedName: (item.slots ?? 0) > 0 ? `${item.name_en} [${item.slots}]` : item.name_en, resolvedInputName: item.name_en, resolvedId: item.id as number, rows: [] };
  }

  return {
    resolvedName: (item.slots ?? 0) > 0 ? `${item.name_en} [${item.slots}]` : (item.name_en as string),
    resolvedInputName: item.name_en as string,
    resolvedId: item.id as number,
    rows: drops.map((d: any) => ({
      monster_id: d.monster_id,
      monster_name: d.monsters.name_en,
      monster_image_url: d.monsters.image_url as string | null,
      monster_level: (d.monsters.level ?? null) as number | null,
      is_aggressive: (d.monsters.is_aggressive ?? null) as boolean | null,
      atk_max: (d.monsters.atk_max ?? null) as number | null,
      rate: d.rate,
    })),
  };
}

// Example searches for the empty state. Hand-picked common farm targets, not
// data-derived: they are prompts that show what the page does, so they should
// stay recognizable names rather than whatever tops a price sort.
const SAMPLE_SEARCHES = ['Jellopy', 'Elunium Ore', 'Steel', 'Emperium', 'Fluff', 'Witherless Rose'];

// Fills the page before the first search: the highest NPC-sell-price items
// that actually drop from a monster. Top-60 by price then filtered to
// droppable keeps it two light queries instead of an aggregate over the whole
// drops table.
async function starterList() {
  const db = supabaseBrowser();
  const { data: items, error } = await db
    .from('items')
    .select('id, name_en, name_th, sell_price, icon_url, slots')
    // Equipment excluded (user call, 2 Sep): equipment NPC-sell prices swing
    // with the market/patches and several were plain wrong before the
    // rozerodb sync — the starter list stays on goods with stable prices.
    .not('category', 'in', '("Armor","Weapon","Costume Equipment")')
    .gt('sell_price', 0)
    .order('sell_price', { ascending: false })
    .limit(60);
  if (error || !items || items.length === 0) {
    if (error) console.error('starter items query failed', error);
    return [];
  }
  const { data: drops, error: dropsError } = await db
    .from('monster_drops')
    .select('item_id')
    .in('item_id', items.map((i) => i.id));
  if (dropsError || !drops) {
    if (dropsError) console.error('starter drops query failed', dropsError);
    return [];
  }
  const count = new Map<number, number>();
  for (const d of drops) count.set(d.item_id, (count.get(d.item_id) ?? 0) + 1);
  return items
    .filter((i) => count.has(i.id))
    .slice(0, 12)
    .map((i) => ({ ...i, dropCount: count.get(i.id) as number }));
}

export default async function DropFinderPage({ searchParams }: { searchParams: { q?: string; id?: string } }) {
  const query = searchParams.q ?? '';
  const itemId = Number(searchParams.id) || null;
  const { resolvedName, resolvedInputName, resolvedId, rows } = await findDrops(query, itemId);
  const searched = Boolean(query || itemId);
  const starters = searched ? [] : await starterList();

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ค้นของดรอป — ไอเทมดรอปจากมอนตัวไหน</h1>
      {!searched && (
        <p className="muted" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          ลองค้น:
          {SAMPLE_SEARCHES.map((name) => (
            <a key={name} className="chiplink" href={`/drop-finder?q=${encodeURIComponent(name)}`}>
              {name}
            </a>
          ))}
        </p>
      )}
      <div className="panel" style={{ marginTop: 20 }}>
        <DropSearch query={query || resolvedInputName || ''} resolvedName={resolvedName} resolvedId={resolvedId} rows={rows} />
      </div>
      {starters.length > 0 && (
        <section className="card" style={{ marginTop: 20 }}>
          <h2 style={{ font: '700 16px/1.6 var(--font-sarabun), sans-serif' }}>ของขายได้ราคาที่ฟาร์มได้</h2>
          <p className="muted" style={{ marginTop: 2 }}>เรียงตามราคาขายร้าน NPC · กดชื่อเพื่อดูว่าตัวไหนดรอป</p>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>ไอเทม</th>
                  <th style={{ textAlign: 'right' }}>ขายร้าน (Zeny)</th>
                  <th style={{ textAlign: 'right' }}>มอนที่ดรอป</th>
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

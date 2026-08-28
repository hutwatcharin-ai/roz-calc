// app/database/cards/page.tsx
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import FilterState, { EmptyState } from '@/components/FilterState';
import Pagination from '@/components/Pagination';
import { parseCardSlot } from '@/lib/card-slot';

export const revalidate = 86400;

export const metadata = {
  title: 'ฐานข้อมูลการ์ด',
  description:
    'การ์ดทั้งหมดในเกม Ragnarok Zero Global พร้อมเอฟเฟกต์และช่องที่ใส่ได้ ค้นจากเอฟเฟกต์ได้ เช่นพิมพ์ LUK เพื่อหาการ์ดที่เพิ่ม LUK',
};

const PAGE_SIZE = 50;

// Type, Equipped on and Weight are structure, not effect. Repeating them in
// every row would bury the one line a player is actually scanning for.
const BOILERPLATE = /^(Type|Equipped on|Weight)\s*:/;

function cardEffect(description: string | null): string | null {
  if (!description) return null;
  const lines = description
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !BOILERPLATE.test(l));
  return lines.length > 0 ? lines.join(' ') : null;
}

export default async function CardsPage({
  searchParams,
}: {
  searchParams: { q?: string; slot?: string; page?: string };
}) {
  const q = searchParams.q ?? '';
  const slot = searchParams.slot ?? '';
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1);

  const db = supabaseBrowser();

  // Slot lives inside description text, so it cannot be filtered in SQL. 289
  // rows is far under the 1,000-row cap, so the whole set is fetched once and
  // filtered in memory -- simpler and always correct, unlike a LIKE filter,
  // which would silently drop the row whose description is null.
  const { data: allCards, error } = await db
    .from('items')
    .select('id, name_en, icon_url, description')
    .eq('category', 'Card')
    .order('name_en');

  if (error) {
    console.error('cards query failed', error);
  }

  const cards = (allCards ?? []).map((c) => ({
    ...c,
    slot: parseCardSlot(c.description),
    effect: cardEffect(c.description),
  }));

  // The filter list is derived from the data rather than hardcoded, so a value
  // that exists is never hidden -- synonym pairs and the upstream typo alike.
  const slotCounts = new Map<string, number>();
  for (const c of cards) {
    if (c.slot) slotCounts.set(c.slot, (slotCounts.get(c.slot) ?? 0) + 1);
  }
  const slots = [...slotCounts.entries()].sort((a, b) => b[1] - a[1]);

  const needle = q.trim().toLowerCase();
  const filtered = cards.filter((c) => {
    if (slot && c.slot !== slot) return false;
    if (!needle) return true;
    // Searching effect text is the point: a player looks for "cards that add
    // LUK", not for a card whose name they already know.
    return (
      c.name_en.toLowerCase().includes(needle) ||
      (c.effect ?? '').toLowerCase().includes(needle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (slot) params.set('slot', slot);
    if (targetPage > 1) params.set('page', String(targetPage));
    const qs = params.toString();
    return `/database/cards${qs ? `?${qs}` : ''}`;
  }

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฐานข้อมูลการ์ด" />
      {/* A query error and a genuine zero-result search must read differently --
          otherwise an outage looks identical to "there are no cards", which is
          false. */}
      {error ? (
        <p className="filterstate">โหลดจำนวนการ์ดไม่สำเร็จ</p>
      ) : (
        <FilterState
          count={filtered.length}
          unit="ใบ"
          filters={[
            { label: 'คำค้น', value: q },
            { label: 'ช่อง', value: slot },
          ]}
          clearHref="/database/cards"
        />
      )}

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ชื่อการ์ด หรือเอฟเฟกต์ เช่น LUK" />
        <select name="slot" defaultValue={slot}>
          <option value="">ทุกช่อง</option>
          {slots.map(([s, n]) => (
            <option key={s} value={s}>
              {s} ({n})
            </option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ชื่อ</th>
              <th>ช่องที่ใส่</th>
              <th>เอฟเฟกต์</th>
            </tr>
          </thead>
          <tbody>
            {error ? (
              <tr>
                <td colSpan={3} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                  เกิดข้อผิดพลาดในการโหลดข้อมูล ลองใหม่อีกครั้ง
                </td>
              </tr>
            ) : (
              <>
                {rows.map((c) => (
                  <tr key={c.id}>
                    <td data-label="">
                      <Link href={`/database/items/${c.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {c.icon_url && (
                          <img src={c.icon_url} alt="" width={24} height={24} style={{ imageRendering: 'pixelated' }} />
                        )}
                        {c.name_en}
                      </Link>
                    </td>
                    <td data-label="ช่องที่ใส่">{c.slot ?? '—'}</td>
                    <td data-label="เอฟเฟกต์" className="effect">{c.effect ?? '—'}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} data-label="" style={{ color: 'var(--faint)', padding: '16px 0' }}>
                      ไม่พบการ์ดที่ตรงเงื่อนไข
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} totalPages={totalPages} buildHref={buildHref} />
    </main>
  );
}

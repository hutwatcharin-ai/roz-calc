// app/database/cash-shop/page.tsx
//
// The one rozerodb section we lacked. 77 items captured 2026-08-31 -- cash
// shop prices move with events and nothing updates them automatically, so the
// capture date is stated on the page, not buried in a footnote.
import Link from 'next/link';
import { supabaseBrowser } from '@/lib/supabase';
import PageHeader from '@/components/PageHeader';
import ItemIcon from '@/components/ItemIcon';
import FilterState, { EmptyState } from '@/components/FilterState';
import { escapeLikePattern } from '@/lib/like-escape';

export const metadata = {
  title: 'ฐานข้อมูล Cash Shop',
  description:
    'ไอเทม Cash Shop ทั้งหมดใน Ragnarok Zero Global พร้อมราคา KP เทียบเงินยูโร และเงื่อนไขจำกัดจำนวนซื้อ',
};

export const revalidate = 86400;

export default async function CashShopPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string };
}) {
  const q = searchParams.q ?? '';
  const SORTS = {
    name: { label: 'ชื่อ A-Z', column: 'name_en', ascending: true },
    cheap: { label: 'ถูกก่อน', column: 'kp_price', ascending: true },
    expensive: { label: 'แพงก่อน', column: 'kp_price', ascending: false },
  } as const;
  const sort = (searchParams.sort ?? 'name') in SORTS ? ((searchParams.sort ?? 'name') as keyof typeof SORTS) : 'name';

  const db = supabaseBrowser();
  let query = db.from('cash_shop_items').select('*', { count: 'exact' });
  if (q) query = query.ilike('name_en', `%${escapeLikePattern(q)}%`);
  const { data: rows, count, error } = await query
    .order(SORTS[sort].column, { ascending: SORTS[sort].ascending })
    .order('item_id');
  if (error) console.error('cash shop query failed', error);

  // Which of these ids have a real item page to link to. 77 ids, one lookup.
  const ids = (rows ?? []).map((r) => r.item_id);
  const { data: known } = ids.length
    ? await db.from('items').select('id').in('id', ids)
    : { data: [] };
  const linkable = new Set((known ?? []).map((k) => k.id));

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="Cash Shop"
        lead={`${count ?? 0} รายการ · ราคา ณ 31 ส.ค. 2026 — ราคาจริงเปลี่ยนตามอีเวนต์ เช็คในเกมก่อนซื้อเสมอ`}
      />

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อไอเทม..." />
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>เรียง: {s.label}</option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <FilterState
        count={count ?? 0}
        unit="รายการ"
        filters={[{ label: 'คำค้น', value: q }]}
        clearHref="/database/cash-shop"
      />

      {(rows ?? []).length === 0 ? (
        <div className="card">
          <EmptyState what={q || undefined} clearHref="/database/cash-shop" />
        </div>
      ) : (
        <div className="card">
          <div className="cashlist">
            {(rows ?? []).map((r) => {
              const body = (
                <>
                  <ItemIcon iconUrl={`/images/items/${r.item_id}.png`} category="Other" size={32} />
                  <span className="cashlist__body">
                    <span className="cashlist__name">
                      {r.name_en}
                      {r.purchase_limit && (
                        <span className="tag tag--risk" style={{ marginLeft: 6 }}>จำกัด {r.purchase_limit}</span>
                      )}
                    </span>
                    <span className="cashlist__desc">{r.description_th ?? r.description}</span>
                  </span>
                  <span className="cashlist__price">
                    <b className="mono">{r.kp_price.toLocaleString('en-US')} KP</b>
                    {r.eur_approx != null && <span className="mono">≈ €{Number(r.eur_approx).toFixed(2)}</span>}
                  </span>
                </>
              );
              return linkable.has(r.item_id) ? (
                <Link key={r.item_id} href={`/database/items/${r.item_id}`} className="cashlist__row">
                  {body}
                </Link>
              ) : (
                <div key={r.item_id} className="cashlist__row">
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="source-note" style={{ marginTop: 14 }}>
        <strong>ที่มา:</strong> รวบรวมจากรายการ Cash Shop สาธารณะ ณ 31 ส.ค. 2026 · KP คือเงินสดในเกม
        ราคายูโรเป็นค่าประมาณจากอัตราแลก ณ วันเก็บข้อมูล · รูปไอเทมจาก Divine-Pride
      </p>
    </main>
  );
}

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
import { CashPlanBar, CashPlanButton, CashPlanProvider } from '@/components/CashPlan';
import { escapeLikePattern } from '@/lib/like-escape';
import {
  CATEGORY_LABELS,
  THB_PER_KP,
  categorize,
  durationDays,
  pairBaseName,
  thbPerDay,
  type CashCategory,
} from '@/lib/cash-shop-analysis';

export const metadata = {
  title: 'ฐานข้อมูล Cash Shop',
  description:
    'ไอเทม Cash Shop ทั้งหมดใน Ragnarok Zero Global พร้อมราคา KP เทียบเงินบาท ราคาต่อวัน และตัวช่วยคำนวณว่าต้องเติมเงินเท่าไร',
};

export const revalidate = 86400;

export default async function CashShopPage({
  searchParams,
}: {
  searchParams: { q?: string; sort?: string; cat?: string };
}) {
  const q = searchParams.q ?? '';
  const SORTS = {
    name: { label: 'ชื่อ A-Z' },
    cheap: { label: 'ถูกก่อน' },
    expensive: { label: 'แพงก่อน' },
    perday: { label: 'คุ้มสุดต่อวัน' },
  } as const;
  const sort = (searchParams.sort ?? 'name') in SORTS ? ((searchParams.sort ?? 'name') as keyof typeof SORTS) : 'name';
  const cat = (searchParams.cat ?? '') in CATEGORY_LABELS ? (searchParams.cat as CashCategory) : '';

  const db = supabaseBrowser();
  let query = db.from('cash_shop_items').select('*');
  if (q) query = query.ilike('name_en', `%${escapeLikePattern(q)}%`);
  const { data, error } = await query.order('name_en').order('item_id');
  if (error) console.error('cash shop query failed', error);

  // Category + duration facts are derived in JS (77 rows), so filtering and
  // the per-day sort happen here rather than in the query.
  const all = (data ?? []).map((r) => ({
    ...r,
    category: categorize(r),
    days: durationDays(r),
    perDay: thbPerDay(r.kp_price, r),
  }));

  // 7-vs-30-day pairing: for every base name with both variants, the cheaper
  // per-day one gets the "saves X%" badge.
  const pairs = new Map<string, { d7?: (typeof all)[number]; d30?: (typeof all)[number] }>();
  for (const r of all) {
    if (r.perDay == null) continue;
    const base = pairBaseName(r.name_en);
    const slot = pairs.get(base) ?? {};
    if (r.days === 7) slot.d7 = r;
    else if (r.days === 30) slot.d30 = r;
    pairs.set(base, slot);
  }
  const savesPct = new Map<number, number>();
  for (const { d7, d30 } of pairs.values()) {
    if (!d7 || !d30 || d7.perDay == null || d30.perDay == null) continue;
    const [cheap, dear] = d30.perDay <= d7.perDay ? [d30, d7] : [d7, d30];
    savesPct.set(cheap.item_id, Math.round((1 - (cheap.perDay as number) / (dear.perDay as number)) * 100));
  }

  let rows = cat ? all.filter((r) => r.category === cat) : all;
  if (sort === 'cheap') rows = [...rows].sort((a, b) => a.kp_price - b.kp_price);
  else if (sort === 'expensive') rows = [...rows].sort((a, b) => b.kp_price - a.kp_price);
  else if (sort === 'perday') rows = [...rows].sort((a, b) => (a.perDay ?? Infinity) - (b.perDay ?? Infinity));

  const ids = rows.map((r) => r.item_id);
  const { data: known } = ids.length
    ? await db.from('items').select('id').in('id', ids)
    : { data: [] };
  const linkable = new Set((known ?? []).map((k) => k.id));

  const catHref = (c: string) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (sort !== 'name') params.set('sort', sort);
    if (c) params.set('cat', c);
    const s = params.toString();
    return `/database/cash-shop${s ? `?${s}` : ''}`;
  };

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader
        title="Cash Shop Ragnarok Zero — ราคาและของในร้าน"
        lead={`${all.length} รายการ · ราคา ณ 31 ส.ค. 2026 — ราคาจริงเปลี่ยนตามอีเวนต์ เช็คในเกมก่อนซื้อเสมอ · กด + ท้ายรายการเพื่อรวมแผนเติมเงิน`}
      />

      <form className="filterbar">
        <input type="search" name="q" defaultValue={q} placeholder="ค้นชื่อไอเทม..." />
        {cat && <input type="hidden" name="cat" value={cat} />}
        <select name="sort" defaultValue={sort} aria-label="เรียงตาม">
          {Object.entries(SORTS).map(([key, s]) => (
            <option key={key} value={key}>เรียง: {s.label}</option>
          ))}
        </select>
        <button type="submit" className="btn">ค้นหา</button>
      </form>

      <nav className="explorerow" aria-label="กรองตามหมวด" style={{ marginTop: 12 }}>
        <Link href={catHref('')} className="chiplink" aria-current={cat === '' ? 'true' : undefined} style={cat === '' ? { borderColor: 'var(--cyan)', color: 'var(--text)' } : undefined}>
          ทุกหมวด
        </Link>
        {(Object.entries(CATEGORY_LABELS) as [CashCategory, string][]).map(([key, label]) => (
          <Link key={key} href={catHref(key)} className="chiplink" aria-current={cat === key ? 'true' : undefined} style={cat === key ? { borderColor: 'var(--cyan)', color: 'var(--text)' } : undefined}>
            {label}
          </Link>
        ))}
      </nav>

      <FilterState
        count={rows.length}
        unit="รายการ"
        filters={[
          { label: 'คำค้น', value: q },
          { label: 'หมวด', value: cat ? CATEGORY_LABELS[cat] : '' },
        ]}
        clearHref="/database/cash-shop"
      />

      <CashPlanProvider>
        {rows.length === 0 ? (
          <div className="card">
            <EmptyState what={q || undefined} clearHref="/database/cash-shop" />
          </div>
        ) : (
          <div className="card">
            <div className="cashlist">
              {rows.map((r) => {
                const saves = savesPct.get(r.item_id);
                const body = (
                  <>
                    <ItemIcon iconUrl={`/images/items/${r.item_id}.png`} category="Other" size={32} />
                    <span className="cashlist__body">
                      <span className="cashlist__name">
                        {r.name_en}
                        {r.purchase_limit && (
                          <span className="tag tag--risk" style={{ marginLeft: 6 }}>จำกัด {r.purchase_limit}</span>
                        )}
                        {saves != null && saves > 0 && (
                          <span className="tag" style={{ marginLeft: 6, background: 'var(--status-safe)', color: 'var(--status-safe-ink)' }}>
                            คุ้มกว่าแบบสั้น {saves}%/วัน
                          </span>
                        )}
                      </span>
                      <span className="cashlist__desc">{r.description_th ?? r.description}</span>
                    </span>
                    <span className="cashlist__price">
                      <b className="mono">{r.kp_price.toLocaleString('en-US')} KP</b>
                      <span className="mono">≈ ฿{(r.kp_price * THB_PER_KP).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                      {r.perDay != null && (
                        <span className="mono muted">฿{r.perDay.toFixed(1)}/วัน</span>
                      )}
                    </span>
                  </>
                );
                return (
                  <div key={r.item_id} className="cashlist__rowwrap">
                    {linkable.has(r.item_id) ? (
                      <Link href={`/database/items/${r.item_id}`} className="cashlist__row">
                        {body}
                      </Link>
                    ) : (
                      <div className="cashlist__row">{body}</div>
                    )}
                    <CashPlanButton id={r.item_id} name={r.name_en} kp={r.kp_price} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <CashPlanBar />
      </CashPlanProvider>

      <p className="source-note" style={{ marginTop: 14 }}>
        <strong>ที่มา:</strong> รวบรวมจากรายการ Cash Shop สาธารณะ ณ 31 ส.ค. 2026 · KP คือเงินสดในเกม
        ราคาบาทคิดจากอัตราเติมจริงของ gnjoy TH (1,000 KP = 32 บาท, 2 ก.ย. 2569) · รูปไอเทมจาก Divine-Pride
      </p>
    </main>
  );
}

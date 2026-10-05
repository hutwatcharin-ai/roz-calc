// /admin/prices -- the owner's tool for entering NPC sell prices while playing
// (5 Oct 2026). Local only: 404 unless ENABLE_ADMIN=1 (lib/admin), never
// indexed. The list is every item the live client has, with its buy price,
// current sell price, Thai and former names for the search, and whether the
// owner has already checked it (.price-log.jsonl).

import './page.css';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import PriceTool, { type PriceRow } from '@/components/PriceTool';
import { adminEnabled } from '@/lib/admin';
import { classicTwinIds } from '@/lib/classic-twins';
import { fetchAllRows } from '@/lib/fetch-all-rows';
import { isAbsentFromGame } from '@/lib/game-absent';
import { itemFormerNames } from '@/lib/item-former-names';
import { readPriceLog } from '@/lib/price-log';
import { supabaseAdmin } from '@/lib/supabase';
import { thaiAliasNames } from '@/lib/thai-aliases';

export const dynamic = 'force-dynamic';
// Never serve a cached read: the page showed Black Hair at 10z for an hour
// after the owner had saved 109 (5 Oct 2026), because Next's data cache kept
// supabase's GET. Every read here must be the database as it is now.
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'ใส่ราคาขาย NPC',
  robots: { index: false, follow: false },
};

export default async function PricesAdminPage() {
  if (!adminEnabled()) notFound();

  const db = supabaseAdmin();
  const { data, error } = await fetchAllRows<{
    id: number;
    name_en: string;
    category: string | null;
    icon_url: string | null;
    buy_price: number | null;
    sell_price: number | null;
    slots: number | null;
  }>((from, to) =>
    db.from('items').select('id, name_en, category, icon_url, buy_price, sell_price, slots').order('id').range(from, to),
  );
  if (error) throw new Error(`items query failed: ${error.message}`);

  // Classic leftovers (lib/classic-twins) never win a same-icon pick.
  const { data: drops, error: dropError } = await fetchAllRows<{ item_id: number }>((from, to) =>
    db.from('monster_drops').select('item_id').order('item_id').range(from, to),
  );
  if (dropError) throw new Error(`drops query failed: ${dropError.message}`);
  const twins = classicTwinIds(
    (data ?? []).filter((it) => !isAbsentFromGame(it.id)).map((it) => ({ id: it.id, name: it.name_en, category: it.category })),
    new Set((drops ?? []).map((d) => d.item_id)),
  );

  const checked = new Map<number, string>();
  for (const edit of readPriceLog()) if (edit.field !== 'buy') checked.set(edit.id, edit.at);

  const rows: PriceRow[] = (data ?? [])
    .filter((it) => !isAbsentFromGame(it.id))
    .map((it) => ({
      id: it.id,
      name: it.name_en,
      aka: [...thaiAliasNames('items', it.id), ...itemFormerNames(it.id)],
      category: it.category ?? 'Other',
      icon: it.icon_url,
      buy: it.buy_price,
      sell: it.sell_price,
      slots: it.slots ?? 0,
      checkedAt: checked.get(it.id) ?? null,
      classicTwin: twins.has(it.id),
    }));

  return (
    <main className="shell" style={{ paddingBlock: 24 }}>
      <p className="arckicker">ADMIN · เครื่องนี้เท่านั้น</p>
      <h1 className="pagehead__title arcname">ใส่ราคาขาย NPC</h1>
      <p className="muted" style={{ maxWidth: '72ch' }}>
        พิมพ์ชื่อของ → Enter → พิมพ์ราคา → Enter บันทึกแล้วกลับมาช่องค้นหาเอง · ใส่ <span className="mono">150/50</span> ได้
        ถ้าหน้าต่างขายโชว์ยอดรวม (ขาย 50 ชิ้นได้ 150z) · ราคาขึ้นเว็บจริงเองภายใน 1 วัน หรือกด &ldquo;อัปเดตเว็บตอนนี้&rdquo; · <a href="/admin/monsters">ใส่ข้อมูลมอนตีก่อน →</a>
      </p>
      <PriceTool rows={rows} />
    </main>
  );
}

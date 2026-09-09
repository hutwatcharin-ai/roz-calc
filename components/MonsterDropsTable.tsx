'use client';

// The "ของที่ดรอป" table on a monster page, sortable by rate and NPC sell
// price (user, 7 Sep 2026: every table a player scans should sort). The sell
// price column is new: the question behind sorting drops is "which of these
// is worth picking up", and rate alone does not answer it. Equipment prices
// are shown as-is; they are the rozerodb-synced NPC price.

import Link from 'next/link';
import { itemHref } from '@/lib/item-href';
import CardLink from '@/components/CardLink';
import { cardSlot, SLOT_TH } from '@/lib/card-slot';
import { cardEffect } from '@/lib/card-roles';
import { bySorted, useTableSort } from '@/lib/use-table-sort';

export interface MonsterDropRow {
  rate: number | null;
  items: {
    id: number;
    name_en: string | null;
    sell_price: number | null;
    icon_url: string | null;
    slots: number | null;
    category: string | null;
    description: string | null;
    description_th: string | null;
  } | null;
}

/** Thai effect when we have it, the client's English otherwise. */
function cardEffectText(th: string | null, en: string | null): string | null {
  const text = cardEffect(th) || cardEffect(en);
  return text ? text.split('\n').filter(Boolean).join(' · ') : null;
}

function cardSlotTh(description: string | null): string | null {
  const slot = cardSlot(description);
  return slot ? SLOT_TH[slot] : null;
}

export default function MonsterDropsTable({ drops, failed }: { drops: MonsterDropRow[]; failed: boolean }) {
  const { sort, toggle, indicator } = useTableSort();
  // Postgres puts NULL first under ORDER BY rate DESC, so untouched the
  // table opened on "ไม่ทราบอัตรา" rows; bySorted sinks nulls, so the default
  // view is the rate sort applied explicitly.
  const rows = bySorted(drops, sort.key ? sort : { key: 'rate', desc: true }, (d, key) =>
    key === 'item' ? d.items?.name_en ?? null
    : key === 'rate' ? d.rate
    : key === 'price' ? (d.items?.sell_price && d.items.sell_price > 0 ? d.items.sell_price : null)
    : null,
  );

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th><button type="button" className="thsort" onClick={() => toggle('item', false)}>ไอเทม {indicator('item')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('rate')}>อัตราดรอป {indicator('rate')}</button></th>
          <th className="num"><button type="button" className="thsort" onClick={() => toggle('price')}>ขายร้าน {indicator('price')}</button></th>
        </tr>
      </thead>
      <tbody>
        {failed ? (
          <tr><td colSpan={3} data-label="" style={{ color: 'var(--faint)' }}>โหลดข้อมูลของที่ดรอปไม่สำเร็จ ลองใหม่อีกครั้ง</td></tr>
        ) : rows.length === 0 ? (
          <tr><td colSpan={3} data-label="" style={{ color: 'var(--faint)' }}>ไม่มีข้อมูลของที่ดรอป</td></tr>
        ) : (
          rows.map((d, i) => (
            <tr key={d.items?.id ?? i}>
              <td data-label="">
                {/* A card in a drop list is a name and nothing else -- the
                    reader has to open it to learn whether it is worth the
                    hunt. Hovering answers that without leaving the page. */}
                {d.items?.id && d.items.category === 'Card' ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {d.items.icon_url && (
                      <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                    )}
                    <CardLink
                      id={d.items.id}
                      name={d.items.name_en ?? '—'}
                      effect={cardEffectText(d.items.description_th, d.items.description)}
                      slot={cardSlotTh(d.items.description)}
                    />
                  </span>
                ) : d.items?.id ? (
                  <Link href={itemHref(d.items.id, d.items.category)} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {d.items.icon_url && (
                      <img src={d.items.icon_url} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} />
                    )}
                    {d.items.name_en ?? '—'}
                    {(d.items.slots ?? 0) > 0 && <span className="mono" style={{ color: 'var(--cyan)' }}> [{d.items.slots}]</span>}
                  </Link>
                ) : (
                  <span>{d.items?.name_en ?? '—'}</span>
                )}
              </td>
              <td data-label="อัตราดรอป" className="num">{d.rate != null ? `${d.rate}%` : 'ไม่ทราบอัตรา'}</td>
              <td data-label="ขายร้าน" className="num mono">
                {d.items?.sell_price && d.items.sell_price > 0 ? `${d.items.sell_price.toLocaleString('en-US')}z` : '—'}
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

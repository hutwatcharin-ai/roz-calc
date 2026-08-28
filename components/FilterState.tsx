// components/FilterState.tsx
//
// What the filter did, said out loud.
//
// The list pages filtered silently: the heading kept reading "524 ตัวทั้งหมด"
// whether or not a filter was in force, there was nothing on screen naming the
// filters that were applied, and no way back to the full list except editing
// the URL or clearing three controls by hand. A reader who arrived from a
// bookmarked filtered URL had no way to tell they were seeing a slice.
//
// Required by the UX standard's filter rules: show active filters, show result
// impact, allow Clear All.

import Link from 'next/link';

export interface ActiveFilter {
  /** What the filter is, in the reader's words: "เผ่า", "ธาตุ", "คำค้น". */
  label: string;
  /** What it is set to. */
  value: string;
}

export default function FilterState({
  count,
  unit,
  filters,
  clearHref,
}: {
  /** Rows matching the filters. Already the filtered count, not the table total. */
  count: number;
  /** The thing being counted: "ตัว", "ชิ้น", "ใบ". */
  unit: string;
  filters: ActiveFilter[];
  /** The same page with no filters. */
  clearHref: string;
}) {
  const active = filters.filter((f) => f.value !== '');

  // No filters: the count is the whole table, and saying so is the honest
  // wording. With filters it is a subset, and the wording has to change or the
  // number reads as the total.
  if (active.length === 0) {
    return (
      <p className="filterstate" role="status" aria-live="polite">
        <span className="filterstate__count">{count.toLocaleString('en-US')}</span> {unit}ทั้งหมด
      </p>
    );
  }

  return (
    <p className="filterstate" role="status" aria-live="polite">
      <span className="filterstate__count">
        พบ {count.toLocaleString('en-US')} {unit}
      </span>
      {active.map((f) => (
        <span key={f.label} className="filterchip">
          {f.label}: <strong>{f.value}</strong>
        </span>
      ))}
      <Link className="filterclear" href={clearHref}>
        ล้างตัวกรอง
      </Link>
    </p>
  );
}

/**
 * Nothing matched. Names what was searched so the reader can see the typo, and
 * offers the way back rather than leaving them on a blank page.
 */
export function EmptyState({
  what,
  clearHref,
}: {
  /** What was searched for, quoted back. */
  what?: string;
  clearHref: string;
}) {
  return (
    <div className="emptystate">
      <p>
        {what ? (
          <>
            ไม่เจออะไรที่ตรงกับ <strong>{what}</strong>
          </>
        ) : (
          'ไม่เจออะไรที่ตรงกับตัวกรองนี้'
        )}
      </p>
      <p>ลองพิมพ์สั้นลง หรือใช้ชื่อภาษาอังกฤษ — ฐานข้อมูลเก็บชื่อไอเทมกับมอนเป็นภาษาอังกฤษ</p>
      <Link className="btn" href={clearHref}>
        ดูทั้งหมด
      </Link>
    </div>
  );
}

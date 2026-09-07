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
import SearchMiss from '@/components/SearchMiss';
import { loadCatalog, searchMiss, type SearchKind } from '@/lib/search-catalog';
import TrackSearch from '@/components/TrackSearch';

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
  // Every list page names its text search "คำค้น"; that one filter is the
  // search event, with this count as its result.
  const term = filters.find((f) => f.label === 'คำค้น')?.value ?? '';
  const tracker = term ? <TrackSearch term={term} count={count} /> : null;

  // No filters: the count is the whole table, and saying so is the honest
  // wording. With filters it is a subset, and the wording has to change or the
  // number reads as the total.
  if (active.length === 0) {
    return (
      <>
        {tracker}
        <p className="filterstate" role="status" aria-live="polite">
          <span className="filterstate__count">{count.toLocaleString('en-US')}</span> {unit}ทั้งหมด
        </p>
      </>
    );
  }

  return (
    <>
      {tracker}
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
    </>
  );
}

/**
 * Nothing matched. Names what was searched so the reader can see the typo, and
 * offers the way back rather than leaving them on a blank page.
 */
export async function EmptyState({
  what,
  clearHref,
  kind,
}: {
  /** What was searched for, quoted back. */
  what?: string;
  clearHref: string;
  /**
   * The section this page lists. Given it, a search that found nothing
   * gets the catalogue treatment: the same word in another section, or the
   * nearest spellings here. Omit it on pages with no section of their own
   * (cash shop, quests) and the block is skipped.
   */
  kind?: SearchKind;
}) {
  // Only on a real miss, so the catalogue read never touches a normal page.
  const miss = what && kind ? searchMiss(await loadCatalog(), what, kind) : null;
  return (
    <div className="emptystate">
      {what && miss ? (
        // The miss block already names the query and what to try; repeating
        // "nothing matched X" under it says it twice.
        <SearchMiss query={what} miss={miss} />
      ) : (
        <>
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
        </>
      )}
      <Link className="btn" href={clearHref}>
        ดูทั้งหมด
      </Link>
    </div>
  );
}

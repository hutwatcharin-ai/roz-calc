import Link from 'next/link';
import { Fragment } from 'react';

/**
 * Which page numbers to show: first, last, and a window around the current
 * page, with null marking a gap. Exported so the ellipsis logic is testable
 * without rendering -- it is exactly the kind of arithmetic that is wrong at
 * the edges.
 */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);

  const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < totalPages);
  const out: (number | null)[] = [1];
  if (around[0] !== undefined && around[0] > 2) out.push(null);
  out.push(...around);
  if (around[around.length - 1] !== undefined && around[around.length - 1] < totalPages - 1) out.push(null);
  out.push(totalPages);
  return out;
}

export default function Pagination({
  page,
  totalPages,
  buildHref,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
  /** Row count across all pages. With pageSize it turns "หน้า 3/11" into "แสดง 101-150 จาก 524". */
  total?: number;
  pageSize?: number;
}) {
  if (totalPages <= 1) return null;

  // "หน้า 3/11" made the reader do the arithmetic; the range is the answer.
  const range =
    total !== undefined && pageSize !== undefined
      ? `แสดง ${((page - 1) * pageSize + 1).toLocaleString('en-US')}–${Math.min(page * pageSize, total).toLocaleString('en-US')} จาก ${total.toLocaleString('en-US')}`
      : `หน้า ${page} / ${totalPages}`;

  return (
    <nav className="pager" aria-label="แบ่งหน้า">
      <p className="pager__range">{range}</p>
      <div className="pager__row">
        {page > 1 ? (
          <Link href={buildHref(page - 1)} className="pager__btn" rel="prev">
            ←<span className="pager__word"> ก่อนหน้า</span>
          </Link>
        ) : (
          <span className="pager__btn pager__btn--off" aria-hidden="true">
            ←<span className="pager__word"> ก่อนหน้า</span>
          </span>
        )}

        {pageWindow(page, totalPages).map((n, i) =>
          n === null ? (
            <span key={`gap-${i}`} className="pager__gap" aria-hidden="true">
              …
            </span>
          ) : n === page ? (
            <span key={n} className="pager__btn pager__btn--now" aria-current="page">
              {n}
            </span>
          ) : (
            <Fragment key={n}>
              <Link href={buildHref(n)} className="pager__btn">
                {n}
              </Link>
            </Fragment>
          ),
        )}

        {page < totalPages ? (
          <Link href={buildHref(page + 1)} className="pager__btn" rel="next">
            <span className="pager__word">ถัดไป </span>→
          </Link>
        ) : (
          <span className="pager__btn pager__btn--off" aria-hidden="true">
            <span className="pager__word">ถัดไป </span>→
          </span>
        )}
      </div>
    </nav>
  );
}

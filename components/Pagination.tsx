import Link from 'next/link';

export default function Pagination({
  page,
  totalPages,
  buildHref,
}: {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 20, justifyContent: 'center' }}>
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="mono">← ก่อนหน้า</Link>
      ) : (
        <span className="mono" style={{ color: 'var(--faint)' }}>← ก่อนหน้า</span>
      )}
      <span className="mono" style={{ color: 'var(--dim)' }}>
        หน้า {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={buildHref(page + 1)} className="mono">ถัดไป →</Link>
      ) : (
        <span className="mono" style={{ color: 'var(--faint)' }}>ถัดไป →</span>
      )}
    </div>
  );
}

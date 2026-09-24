// Backlink to the guide page(s) that feature this item -- see
// lib/item-guide-refs.ts for why this is a static lookup, not a query.

import Link from 'next/link';
import { guideRefsFor } from '@/lib/item-guide-refs';

export default function ItemGuideRefs({ itemId }: { itemId: number }) {
  const refs = guideRefsFor(itemId);
  if (refs.length === 0) return null;

  return (
    <p className="muted" style={{ marginTop: 16 }}>
      {refs.map((ref, i) => (
        <span key={ref.href}>
          {i > 0 && ' · '}
          อยู่ในไกด์ <Link href={ref.href}>{ref.label}</Link>
        </span>
      ))}
    </p>
  );
}

// "อยู่ในชุด" on an item, gear or card page: the other pieces of every set
// this item belongs to, and what the full set gives. Renders nothing for an
// item in no set.

import Link from 'next/link';
import ItemSetCard from '@/components/ItemSetCard';
import { setsOf } from '@/lib/item-sets';

export default function InSetBox({ itemId }: { itemId: number }) {
  const sets = setsOf(itemId);
  if (sets.length === 0) return null;
  return (
    <section className="card card--yellow" style={{ marginTop: 20 }}>
      <h2 className="section-title">อยู่ในชุด{sets.length > 1 ? ` (${sets.length} ชุด)` : ''}</h2>
      {sets.map((s) => <ItemSetCard key={s.name} set={s} current={itemId} />)}
      <p className="muted" style={{ marginTop: 8, marginBottom: 0, fontSize: 13 }}>
        <Link href="/guides/item-sets">ดูชุดทั้งหมด</Link>
      </p>
    </section>
  );
}

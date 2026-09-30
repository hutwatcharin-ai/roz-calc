// "ไอเทมเซ็ต" on an item, gear or card page: the other pieces of every set
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
      <h2 className="section-title">ไอเทมเซ็ต{sets.length > 1 ? ` (${sets.length} เซ็ต)` : ''}</h2>
      <p className="muted" style={{ marginTop: 2, marginBottom: 10, fontSize: 13 }}>ชิ้นนี้ใส่คู่กับชิ้นอื่นในเซ็ตแล้วได้โบนัสเพิ่ม</p>
      <div className="isetgrid isetgrid--box">
        {sets.map((s) => <ItemSetCard key={s.name} set={s} current={itemId} />)}
      </div>
      <p className="muted" style={{ marginTop: 10, marginBottom: 0, fontSize: 13 }}>
        <Link href="/guides/item-sets">ดูไอเทมเซ็ตทั้งหมด</Link>
      </p>
    </section>
  );
}

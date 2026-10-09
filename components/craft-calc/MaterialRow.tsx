// One material line in a calculator's totals: what, how many, and where to
// get it (best open-map dropper, or a listed NPC shop). Server-safe: no hooks.

import Link from 'next/link';
import ItemIcon from '@/components/ItemIcon';
import { itemHref } from '@/lib/item-href';
import type { MaterialSource } from '@/lib/material-sources';

const pct = (n: number) => `${Number.isInteger(n) ? n : n.toFixed(1)}%`;

export default function MaterialRow({
  id,
  name,
  icon,
  category,
  amount,
  source,
}: {
  id: number;
  name: string;
  icon?: string | null;
  category?: string | null;
  amount: number;
  source?: MaterialSource;
}) {
  const kills = source?.rate ? Math.ceil((amount * 100) / source.rate) : null;
  return (
    <li className="mrow">
      <Link className="mrow__item" href={itemHref(id, category ?? null)}>
        <ItemIcon iconUrl={icon ?? null} category={category ?? null} size={24} />
        <span className="mrow__name">{name}</span>
        <b className="mrow__n">×{amount.toLocaleString('en-US')}</b>
      </Link>
      <span className="mrow__src">
        {source?.monster ? (
          <>
            <Link href={`/database/monsters/${source.monster.id}`}>
              {source.monster.name}
              {source.monster.level != null && <small> Lv {source.monster.level}</small>}
            </Link>
            {source.map && (
              <Link href={`/database/maps/${encodeURIComponent(source.map.code)}`} className="mrow__map">
                {source.map.name}
              </Link>
            )}
            <small>
              {source.rate != null && `ดรอป ${pct(source.rate)}`}
              {kills != null && ` · ตีราว ${kills.toLocaleString('en-US')} ตัว`}
            </small>
          </>
        ) : source?.shop ? (
          <small>ไม่มีมอนดรอปในแมพที่เปิด · มีในรายชื่อร้าน NPC</small>
        ) : (
          <small>ไม่รู้แหล่ง</small>
        )}
        {source?.monster && source.shop && <small className="mrow__shop">มีในรายชื่อร้าน NPC ด้วย</small>}
        <Link className="mrow__find" href={`/drop-finder?id=${id}`}>
          ดรอปทั้งหมด ›
        </Link>
      </span>
    </li>
  );
}

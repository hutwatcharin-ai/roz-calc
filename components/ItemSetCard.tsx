// One item set: its pieces as linked sprites and the bonus for wearing them
// all. Used by /guides/item-sets and the "อยู่ในชุด" box on item pages.

import Link from 'next/link';
import { itemHref } from '@/lib/item-href';
import { setAnchor, type ItemSet } from '@/lib/item-sets';

export default function ItemSetCard({ set, current }: { set: ItemSet; current?: number }) {
  return (
    <div className="iset" id={setAnchor(set)} data-q={[set.name, ...set.pieces.map((p) => p.name), set.bonus].join(' ').toLowerCase()}>
      <p className="iset__name">{set.name}</p>
      <div className="recipe__list">
        {set.pieces.map((p) =>
          p.id === current ? (
            <span key={p.id} className="recipe__item iset__here">
              <img src={p.icon} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} loading="lazy" />
              <span>{p.name} (ชิ้นนี้)</span>
            </span>
          ) : (
            <Link key={p.id} className="recipe__item" href={itemHref(p.id, p.category)}>
              <img src={p.icon} alt="" width={20} height={20} style={{ imageRendering: 'pixelated' }} loading="lazy" />
              <span>{p.name}</span>
            </Link>
          ),
        )}
      </div>
      <p className="iset__bonus">ใส่ครบ {set.pieces.length} ชิ้น: <strong>{set.bonus}</strong></p>
    </div>
  );
}

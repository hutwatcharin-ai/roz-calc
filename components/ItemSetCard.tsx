// One item set, laid out for the question a player brings: "what do I get
// for wearing these together?" -- so the bonus leads, big, and the pieces
// follow one per line with their sprites (owner, 30 Sep 2026: the first
// version buried the bonus under a wrapped row of names). Used by
// /guides/item-sets and the ไอเทมเซ็ต box on item pages.

import Link from 'next/link';
import { itemHref } from '@/lib/item-href';
import { setAnchor, type ItemSet } from '@/lib/item-sets';

export default function ItemSetCard({ set, current }: { set: ItemSet; current?: number }) {
  return (
    <article
      className="iset"
      id={setAnchor(set)}
      data-kind={set.kind}
      data-q={[set.name, ...set.pieces.map((p) => p.name), set.bonus].join(' ').toLowerCase()}
    >
      <p className="iset__count">ใส่ครบ {set.pieces.length} ชิ้น ได้</p>
      <p className="iset__bonus">{set.bonus}</p>
      <ul className="iset__pieces">
        {set.pieces.map((p) => (
          <li key={p.id}>
            {p.id === current ? (
              <span className="iset__piece iset__piece--here">
                <img src={p.icon} alt="" width={28} height={28} loading="lazy" />
                <span>{p.name}</span>
                <span className="iset__heretag">ชิ้นนี้</span>
              </span>
            ) : (
              <Link className="iset__piece" href={itemHref(p.id, p.category)}>
                <img src={p.icon} alt="" width={28} height={28} loading="lazy" />
                <span>{p.name}</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
    </article>
  );
}

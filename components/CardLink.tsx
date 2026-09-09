// A card name that shows the card while the pointer rests on it.
//
// Asked for as "hover the card name and show the card" (user, 8 Sep 2026).
// It showed the effect only, because at the time the only card image this
// site had was the item icon -- 313 files that are 8 distinct pictures, two of
// which cover 294 cards, so a picture beside the name would have been the
// same picture beside every name.
//
// The card's own artwork exists and is different for every card, and the site
// now serves it (lib/card-art, 290 of 315 cards). So the popup shows the
// picture, the slot and the effect together. Cards without artwork keep the
// text-only popup rather than showing a card back inside a tooltip, where
// there is no room to explain that it is not the card.
//
// Still CSS-only, like MonsterLink: nothing renders until hover, the image is
// lazy so a drop table of twenty cards fetches nothing until one is pointed
// at, and a touch screen gets a plain link.

import Link from 'next/link';
import { itemHref } from '@/lib/item-href';
import { cardArtThumbUrl, hasCardArt } from '@/lib/card-art';

export default function CardLink({
  id,
  name,
  effect,
  slot,
}: {
  id: number;
  name: string;
  /** The card's effect, Thai preferred, already stripped of the type block. */
  effect: string | null;
  /** Thai slot name, when known. */
  slot?: string | null;
}) {
  const art = hasCardArt(id);
  return (
    <Link href={itemHref(id, 'Card')} className="cardlink">
      {name}
      {(effect || art) && (
        <span className={art ? 'cardlink__pop cardlink__pop--art' : 'cardlink__pop'} aria-hidden="true">
          {art && (
            <img className="cardlink__art" src={cardArtThumbUrl(id)} alt="" width={60} height={80} loading="lazy" decoding="async" />
          )}
          <span className="cardlink__text">
            {slot && <span className="cardlink__slot">ใส่ช่อง{slot}</span>}
            {effect && <span className="cardlink__effect">{effect}</span>}
          </span>
        </span>
      )}
    </Link>
  );
}

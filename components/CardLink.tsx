// A card name that shows what the card does while the pointer rests on it.
//
// Asked for as "hover the card name and show the card" (user, 8 Sep 2026).
// What it shows is the effect, not a picture, and that is a finding rather
// than a shortcut: the 313 card icons we hold are only 8 distinct images, two
// of which cover 294 cards, and prontera's are the same. There is no per-card
// artwork in the game to show. The effect is the part that differs, and it is
// the thing a reader wants when they meet "Alice Card" in a drop list.
//
// Same CSS-only popup as MonsterLink: nothing is fetched, nothing renders
// until hover, and touch screens get a plain link.

import Link from 'next/link';
import { itemHref } from '@/lib/item-href';

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
  return (
    <Link href={itemHref(id, 'Card')} className="cardlink">
      {name}
      {effect && (
        <span className="cardlink__pop" aria-hidden="true">
          {slot && <span className="cardlink__slot">ใส่ช่อง{slot}</span>}
          <span className="cardlink__effect">{effect}</span>
        </span>
      )}
    </Link>
  );
}

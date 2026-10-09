// The recipe list as cards (owner, 8 Oct 2026: the guides should look like
// the newer pages, not a long table). Each card is the product, what it
// does, what goes in and what has to stay in the bag. Server-rendered so
// every recipe is in the HTML; RecipeFilter only hides cards in place.
//
// Tags and the search text ride on data attributes, the same way the item
// set page's filter works (components/SetFilter).

import Link from 'next/link';
import ItemIcon from '@/components/ItemIcon';
import { itemHref } from '@/lib/item-href';
import { foodById, foodText } from '@/lib/food-buffs';
import type { CraftMaterial, Recipe } from '@/lib/crafting';
import { RecipeQty } from '@/components/craft-calc/CraftCalc';

function Mat({ m, showAmount = true }: { m: CraftMaterial; showAmount?: boolean }) {
  return (
    <Link className="rcard__mat" href={itemHref(m.id, m.category ?? null)}>
      <ItemIcon iconUrl={m.icon ?? null} category={m.category ?? null} size={22} />
      <span>{m.name}</span>
      {showAmount && m.amount > 1 && <b className="mono">×{m.amount}</b>}
    </Link>
  );
}

export default function RecipeCards({
  rows,
  tagsOf,
  badgeOf,
  group,
  calc = false,
}: {
  rows: Recipe[];
  /** Filter values this recipe belongs to (see RecipeFilter's facets). */
  tagsOf?: (r: Recipe) => string[];
  /** A short label in the card's corner, e.g. "Lv.3 Cookbook" or "อาวุธ Lv 2". */
  badgeOf?: (r: Recipe) => string | null;
  /** Which RecipeFilter drives these cards. */
  group: string;
  /** Inside a CraftCalc: give each card a quantity control. */
  calc?: boolean;
}) {
  return (
    <div className="rcards" data-rgroup={group}>
      {rows.map((r) => {
        const spent = r.materials.filter((m) => !m.held);
        const held = r.materials.filter((m) => m.held);
        const food = foodById(r.product.id);
        const effect = food ? foodText(food) : null;
        const badge = badgeOf?.(r) ?? null;
        const q = [r.product.name, effect, ...r.materials.map((m) => m.name)].filter(Boolean).join(' ').toLowerCase();
        return (
          <article
            key={r.id}
            className={'rcard' + (r.confidence === 'both' ? '' : ' is-unsure')}
            data-tags={(tagsOf?.(r) ?? []).join(' ')}
            data-q={q}
            data-unsure={r.confidence === 'both' ? undefined : '1'}
            hidden={r.confidence !== 'both'}
          >
            <header className="rcard__head">
              <Link className="rcard__product" href={itemHref(r.product.id, r.product.category ?? null)}>
                <span className="rcard__icon">
                  <ItemIcon iconUrl={r.product.icon ?? null} category={r.product.category ?? null} size={32} />
                </span>
                <span className="rcard__name">
                  {r.product.name}
                  {r.product.amount > 1 && <b className="mono"> ×{r.product.amount}</b>}
                </span>
              </Link>
              {badge && <span className="rcard__badge mono">{badge}</span>}
            </header>
            {effect && <p className="rcard__effect">{effect}</p>}
            <div className="rcard__mats">
              {spent.map((m) => (
                <Mat key={m.id} m={m} />
              ))}
            </div>
            {held.length > 0 && (
              <p className="rcard__held">
                <span>ต้องมีติดตัว</span>
                {held.map((m) => (
                  <Mat key={m.id} m={m} showAmount={false} />
                ))}
              </p>
            )}
            {r.confidence !== 'both' && <p className="rcard__unsure">ยังไม่ยืนยันกับ Zero · มีในแหล่งเดียว</p>}
            {calc && <RecipeQty id={r.id} name={r.product.name} />}
          </article>
        );
      })}
    </div>
  );
}

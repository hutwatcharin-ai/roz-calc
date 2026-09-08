// The recipe table every crafting guide and item page shows.
//
// Shaped after the column set players already know from ratemyserver's
// creation database: what you get, what it costs, what has to be in the bag.
//
// No "how trustworthy is this row" column (user, 7 Sep 2026: it confused
// more than it explained). The distinction is still made -- and made more
// visibly -- by the two sections a guide splits into, so every row inside
// one table carries the same standing and does not need to say so.
//
// Every item is a sprite and a link. The point of holding 4,921 items is
// that a recipe can say "10 Iron" and the reader can go and find out where
// Iron comes from.

import Link from 'next/link';
import ItemIcon from '@/components/ItemIcon';
import { itemHref } from '@/lib/item-href';
import type { CraftMaterial, Recipe } from '@/lib/crafting';

function ItemCell({ item, amount }: { item: CraftMaterial; amount?: number }) {
  return (
    <Link className="recipe__item" href={itemHref(item.id, item.category ?? null)}>
      <ItemIcon iconUrl={item.icon ?? null} category={item.category ?? null} size={22} />
      <span>{item.name}</span>
      {amount !== undefined && amount > 1 && <span className="recipe__amount">×{amount}</span>}
    </Link>
  );
}

export default function RecipeTable({
  rows,
  materialFirst = false,
}: {
  rows: Recipe[];
  /** Arrow crafting reads "this item makes that": material column first. */
  materialFirst?: boolean;
}) {
  if (rows.length === 0) return null;
  const anyHeld = rows.some((r) => r.materials.some((m) => m.held));

  return (
    <div className="recipe__scroll">
      <table className="data-table recipe">
        <thead>
          <tr>
            <th>{materialFirst ? 'เอาของนี้' : 'ของที่ได้'}</th>
            <th>{materialFirst ? 'ได้เป็น' : 'วัตถุดิบ'}</th>
            {anyHeld && <th>ต้องมีติดตัว</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const spent = r.materials.filter((m) => !m.held);
            const held = r.materials.filter((m) => m.held);
            const productCell = (
              <td data-label={materialFirst ? 'ได้เป็น' : 'ของที่ได้'} key="p">
                <ItemCell item={r.product as CraftMaterial} amount={r.product.amount} />
              </td>
            );
            const materialCell = (
              <td data-label={materialFirst ? 'เอาของนี้' : 'วัตถุดิบ'} key="m">
                <span className="recipe__list">
                  {spent.map((m) => (
                    <ItemCell key={m.id} item={m} amount={m.amount} />
                  ))}
                </span>
              </td>
            );
            return (
              <tr key={r.id}>
                {materialFirst ? [materialCell, productCell] : [productCell, materialCell]}
                {anyHeld && (
                  <td data-label="ต้องมีติดตัว">
                    {held.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      <span className="recipe__list">
                        {held.map((m) => (
                          <ItemCell key={m.id} item={m} />
                        ))}
                      </span>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

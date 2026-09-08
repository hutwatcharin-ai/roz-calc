// The recipe table every crafting guide shows.
//
// Shaped after the column set players already know from ratemyserver's
// creation database -- what you get, what it costs, what you need to have --
// with one column those tables do not have: how far the row can be trusted.
// Half of what is published about Zero crafting comes from other regions,
// and a table that hides that is the kind of page this site exists not to be.
//
// Every item is a link: the point of having 4,921 items in the database is
// that a recipe can say "10 Iron" and the reader can go and find out where
// Iron comes from.

import Link from 'next/link';
import { itemHref } from '@/lib/item-href';
import { CONFIDENCE_LABELS, CONFIDENCE_WHY, type Recipe } from '@/lib/crafting';

function ItemLink({ id, name }: { id: number; name: string }) {
  // Category is unknown here, so itemHref routes by id alone; the item page
  // 308s to /equipment when the row turns out to be gear.
  return <Link href={itemHref(id, null)}>{name}</Link>;
}

export default function RecipeTable({
  rows,
  showConfidence = true,
  materialFirst = false,
}: {
  rows: Recipe[];
  /** Arrow crafting reads "this item makes that": material column first. */
  materialFirst?: boolean;
  /** Off inside the "not confirmed" disclosure, where every row is the same. */
  showConfidence?: boolean;
}) {
  if (rows.length === 0) return null;
  const anyHeld = rows.some((r) => r.materials.some((m) => m.held));

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>{materialFirst ? 'เอาของนี้' : 'ของที่ได้'}</th>
            <th>{materialFirst ? 'ได้เป็น' : 'วัตถุดิบ'}</th>
            {anyHeld && <th>ต้องมีติดตัว</th>}
            {showConfidence && <th>ความน่าเชื่อถือ</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const spent = r.materials.filter((m) => !m.held);
            const held = r.materials.filter((m) => m.held);
            return (
              <tr key={r.id}>
                {(() => {
                  const productCell = (
                    <td data-label={materialFirst ? 'ได้เป็น' : 'ของที่ได้'} key="p">
                      <ItemLink id={r.product.id} name={r.product.name} />
                      {r.product.amount > 1 && (
                        <span className="mono" style={{ color: 'var(--faint)' }}> ×{r.product.amount}</span>
                      )}
                    </td>
                  );
                  const materialCell = (
                    <td data-label={materialFirst ? 'เอาของนี้' : 'วัตถุดิบ'} key="m">
                      {spent.map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && ' + '}
                          <ItemLink id={m.id} name={m.name} />
                          <span className="mono" style={{ color: 'var(--faint)' }}> ×{m.amount}</span>
                        </span>
                      ))}
                    </td>
                  );
                  return materialFirst ? [materialCell, productCell] : [productCell, materialCell];
                })()}
                {anyHeld && (
                  <td data-label="ต้องมีติดตัว">
                    {held.length === 0 ? (
                      <span className="muted">—</span>
                    ) : (
                      held.map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && ' · '}
                          <ItemLink id={m.id} name={m.name} />
                        </span>
                      ))
                    )}
                  </td>
                )}
                {showConfidence && (
                  <td data-label="ความน่าเชื่อถือ">
                    <span
                      className={`tag tag--${r.confidence === 'both' ? 'none' : 'risk'}`}
                      title={CONFIDENCE_WHY[r.confidence]}
                    >
                      {CONFIDENCE_LABELS[r.confidence]}
                    </span>
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

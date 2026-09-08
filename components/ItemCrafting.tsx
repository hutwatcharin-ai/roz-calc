// "ทำเองได้จาก" and "เอาไปทำอะไรได้" on an item page.
//
// The recipe data already links both ways (lib/crafting); this puts it where
// someone actually stands when the question comes up. Looking at Iron, the
// useful facts are that Iron Ore becomes it and that most forging recipes
// eat it -- neither of which the item page could say before.
//
// Renders nothing when no recipe touches the item, which is most of them.

import Link from 'next/link';
import RecipeTable from '@/components/RecipeTable';
import { KIND_TITLES, recipesMaking, recipesUsing, type CraftKind } from '@/lib/crafting';

const GUIDE_OF: Partial<Record<CraftKind, string>> = {
  forge: '/guides/forging',
  arrow: '/guides/arrow-crafting',
  brew: '/guides/potion-crafting',
  cook: '/guides/cooking',
  ore: '/guides/ore-refining',
};

export default function ItemCrafting({ itemId }: { itemId: number }) {
  const making = recipesMaking(itemId);
  const using = recipesUsing(itemId);
  if (making.length === 0 && using.length === 0) return null;

  // The guides these recipes live on, so the reader can see the whole set.
  const guides = [...new Set([...making, ...using].map((r) => r.kind))]
    .map((kind) => ({ kind, href: GUIDE_OF[kind] }))
    .filter((g): g is { kind: CraftKind; href: string } => Boolean(g.href));

  return (
    <>
      {making.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">ทำเองได้จาก</h2>
          <RecipeTable rows={making} />
        </div>
      )}

      {using.length > 0 && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="section-title">เอาไปทำอะไรได้ ({using.length})</h2>
          {/* Capped: Iron feeds 40-odd forging recipes, and a wall of them
              buries everything under it. The guide holds the full list. */}
          <RecipeTable rows={using.slice(0, 12)} />
          {using.length > 12 && (
            <p className="muted" style={{ marginTop: 8 }}>
              แสดง 12 จาก {using.length} สูตร · ดูครบที่ไกด์ด้านล่าง
            </p>
          )}
        </div>
      )}

      {guides.length > 0 && (
        <p className="muted" style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          ไกด์ที่เกี่ยวข้อง:
          {guides.map((g) => (
            <Link key={g.href} className="chiplink" href={g.href}>
              {KIND_TITLES[g.kind]}
            </Link>
          ))}
        </p>
      )}
    </>
  );
}

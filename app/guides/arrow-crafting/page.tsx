// app/guides/arrow-crafting/page.tsx
//
// Redesigned 8 Oct 2026 (owner: "easier to use"): the two questions players
// bring -- which arrow, and what does this item make -- answered by
// components/ArrowCrafter, with the full recipe table kept underneath,
// server-rendered, for search and for reading everything at once.

import './page.css';
import Link from 'next/link';
import CraftGuide from '@/components/CraftGuide';
import ArrowCrafter, { type ArrowRecipe } from '@/components/ArrowCrafter';
import { craftCounts, recipesOfKind } from '@/lib/crafting';
import { itemEffects } from '@/lib/item-effects';
import { itemHref } from '@/lib/item-href';

export const revalidate = 86400;

export const metadata = {
  title: 'ทำลูกศร Ragnarok Zero — อยากได้ลูกศรธาตุไหน ใช้ของอะไรทำ',
  description:
    'Making Arrow ของ Archer ใน Ragnarok Zero Global — เลือกลูกศรที่อยากได้ (ไฟ น้ำ ลม ดิน ศักดิ์สิทธิ์ ติดสถานะ) แล้วดูว่าของชิ้นไหนทำได้ลูกศรเยอะสุด หรือพิมพ์ชื่อของในกระเป๋าดูว่าทำอะไรได้ ครบทุกสูตร',
};

export default function ArrowCraftingPage() {
  const counts = craftCounts();
  const recipes: ArrowRecipe[] = recipesOfKind('arrow').map((r) => {
    const m = r.materials[0];
    return {
      arrow: { id: r.product.id, name: r.product.name, icon: r.product.icon ?? `/images/items/${r.product.id}.gif`, element: itemEffects(r.product.id)?.el ?? null },
      material: { id: m.id, name: m.name, icon: m.icon ?? `/images/items/${m.id}.gif`, href: itemHref(m.id, m.category) },
      amount: r.product.amount,
      confirmed: r.confidence === 'both',
    };
  });

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <h1 className="pagehead__title">ทำลูกศร — อยากได้ลูกศรแบบไหน ใช้ของอะไรทำ</h1>
      <p className="muted" style={{ marginTop: 8, maxWidth: '68ch' }}>
        สกิล <strong>Making Arrow</strong> ของ Archer แปลงของ 1 ชิ้นเป็นลูกศรได้ทีละหลายดอก มี {counts.arrow?.total ?? 0} สูตร
        · ของบางชิ้นให้ลูกศรทีละหลายร้อยดอก คุ้มกว่าซื้อ และเคลียร์ของในกระเป๋าไปในตัว
      </p>

      <ArrowCrafter recipes={recipes} />

      <h2 className="section-title" style={{ marginTop: 28 }}>ตารางทุกสูตร</h2>
      <CraftGuide
        kind="arrow"
        sortBy="material"
        view="table"
        extra={
          <p className="muted" style={{ marginTop: 16 }}>
            อยากรู้ว่ามอนตัวไหนดรอปของที่เอามาทำลูกศรได้ ลองที่{' '}
            <Link href="/drop-finder">ค้นของดรอป</Link> · ลูกศรธาตุไหนตีมอนธาตุไหนแรง ดู <Link href="/guides/elements">ตารางธาตุ</Link>
          </p>
        }
      >
        <></>
      </CraftGuide>
    </main>
  );
}

// app/guides/craft-basket/page.tsx
//
// The shared crafting basket (owner, 9 Oct 2026): everything picked with
// "+ คำนวณวัตถุดิบ" on any recipe guide, added up in one list. Same calculator
// as the guides (components/craft-calc/CraftCalc, `inline`), fed every recipe
// those guides offer, so the same browser key shows here in full.

import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import CraftCalc, { RecipeFinder } from '@/components/craft-calc/CraftCalc';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import { recipesOfKind, type CraftKind } from '@/lib/crafting';
import { craftCalcConfig, oreSkillRates } from '@/lib/craft-calc-config';

export const revalidate = 86400;

export const metadata = {
  title: 'ตะกร้าวัตถุดิบรวม — คำนวณของที่ต้องฟาม Ragnarok Zero',
  description:
    'รวมยอดวัตถุดิบจากทุกหน้าสูตรในที่เดียว ทำอาหาร ทำยา ตีอาวุธ หลอมแร่ วัตถุดิบซ้ำบวกรวมให้ บอกมอนที่ดรอปในแมพที่เปิดแล้ว และเผื่อหลอมแร่ไม่ติดตามเลเวลสกิล',
  robots: { index: false },
};

const PAGES: { kind: CraftKind; href: string; label: string }[] = [
  { kind: 'cook', href: '/guides/cooking', label: 'ทำอาหาร' },
  { kind: 'brew', href: '/guides/potion-crafting', label: 'ทำยา' },
  { kind: 'forge', href: '/guides/forging', label: 'ตีอาวุธ' },
  { kind: 'ore', href: '/guides/ore-refining', label: 'หลอมแร่' },
];

export default async function CraftBasketPage() {
  const byKind = PAGES.map((p) => ({ ...p, recipes: recipesOfKind(p.kind) }));
  const all = byKind.flatMap((p) => p.recipes);
  const pageOf = Object.fromEntries(byKind.flatMap((p) => p.recipes.map((r) => [r.id, { href: p.href, label: p.label }])));
  const brew = byKind.find((p) => p.kind === 'brew')!.recipes;
  const config = await craftCalcConfig({
    id: 'basket',
    recipes: all,
    chain: recipesOfKind('ore').filter((r) => r.confidence === 'both'),
    expandLabel: 'หลอม Iron, Steel และหินธาตุเอง (นับเป็นแร่ดิบแทน)',
    expandDefault: false,
    skillRates: oreSkillRates(),
    perTry: [{ id: 7134, name: 'Medicine Bowl (Mortar Bowl)', icon: '/images/items/7134.gif', category: 'Other', amount: 1 }],
    perTryIds: brew.map((r) => r.id),
    pageOf,
    unknownRateNote: 'อาหาร ยา และอาวุธยังไม่รู้โอกาสทำสำเร็จ ยอดพวกนี้คิดแบบทำติดทุกครั้ง ถ้าทำไม่ติดวัตถุดิบหายด้วย ควรเผื่อไว้อีก',
  });
  const finder = all
    .filter((r) => r.confidence === 'both')
    .map((r) => ({ id: r.id, name: r.product.name, icon: r.product.icon ?? null, category: r.product.category ?? null, where: pageOf[r.id].label }));

  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
          { name: 'ตะกร้าวัตถุดิบรวม', path: '/guides/craft-basket' },
        ])}
      />
      <p className="arckicker">CRAFT · BASKET</p>
      <PageHeader
        title="ตะกร้าวัตถุดิบรวม"
        lead={
          <>
            ของที่กด <strong>+ คำนวณวัตถุดิบ</strong> จากทุกหน้าสูตรมารวมกันที่นี่ วัตถุดิบที่ซ้ำกันบวกเป็นบรรทัดเดียว ·
            เว็บจำไว้ในเครื่องนี้ ปิดแล้วเปิดใหม่ยังอยู่
          </>
        }
      />

      <nav className="gtiles" aria-label="หน้าสูตร">
        {PAGES.map((p) => (
          <Link key={p.kind} className="gtile" href={p.href}>
            <span className="gtile__k">{p.kind.toUpperCase()}</span>
            <span className="gtile__v">{p.label}</span>
            <span className="gtile__s">ไปเลือกสูตร ›</span>
          </Link>
        ))}
      </nav>

      <CraftCalc config={config} inline>
        <section className="card card--yellow" style={{ marginTop: 16 }}>
          <h2 className="section-title">เพิ่มของจากที่นี่เลย</h2>
          <RecipeFinder recipes={finder} />
        </section>
      </CraftCalc>
    </main>
  );
}

// app/database/costumes/[id]/page.tsx
//
// Costumes are cosmetic: no ATK, no refine, no random options, and 940 of them
// against 875 pieces of real gear. Sharing the equipment list meant a player
// looking for armour paged through hats, so they got their own section on
// 3 Sep 2026. Same body as gear (the tiles a costume has no value for simply
// do not render), different section.
import GearDetail, { type GearSection } from '@/components/GearDetail';
import { getGearItem, loadGearExtras } from '@/lib/gear-detail';
import { isCostumeCategory, itemHref } from '@/lib/item-href';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

const SECTION: GearSection = {
  basePath: '/database/costumes',
  label: 'คอสตูม',
  recentKind: 'costume',
  feedbackPageType: 'costume',
  // The costume list has one kind, so its subtype filter takes `type` alone.
  subtypeHref: (item) => `/database/costumes?type=${encodeURIComponent(item.weapon_type ?? '')}`,
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: item, error } = await getGearItem(Number(params.id));

  if (error) {
    console.error('costume detail query failed (metadata)', error);
    return {};
  }

  if (!item) return { title: 'ไม่พบคอสตูมชิ้นนี้' };

  return {
    title: `${item.name_en} — คอสตูม ใส่ตำแหน่งไหน`,
    description: `${item.name_en}${item.weapon_type ? ` คอสตูมตำแหน่ง ${item.weapon_type}` : ''} — อาชีพที่ใส่ได้ ราคาขาย และมอนสเตอร์ที่ดรอปใน RO Zero Thai`,
  };
}

export default async function CostumeDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { data: item, error } = await getGearItem(id);

  if (error) {
    console.error('costume detail query failed', error);
    return <main className="shell" style={{ paddingBlock: 32 }}>เกิดข้อผิดพลาด ลองใหม่อีกครั้ง</main>;
  }

  if (!item) {
    notFound();
  }

  if (!isCostumeCategory(item.category)) {
    permanentRedirect(itemHref(id, item.category));
  }

  const extras = await loadGearExtras(id);

  return <GearDetail item={item} extras={extras} section={SECTION} />;
}

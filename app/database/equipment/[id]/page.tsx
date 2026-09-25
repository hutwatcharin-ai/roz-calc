// app/database/equipment/[id]/page.tsx
//
// Weapons and armour. Split off /database/items/[id] on 3 Sep 2026 (gear was
// rendering through the same template as potions and crafting junk), and
// costumes split off this route the same day -- they were 940 of the 1,815
// wearable rows and buried everything a player fights in. lib/item-href.ts
// holds the rule all three routes key off; a row landing on the wrong one is
// redirected, so it keeps exactly one canonical URL.
import { isAbsentFromGame } from '@/lib/game-absent';
import GearDetail, { CATEGORY_LABELS, type GearSection } from '@/components/GearDetail';
import { getGearItem, loadGearExtras } from '@/lib/gear-detail';
import { isGearCategory, itemHref } from '@/lib/item-href';
import { thaiAliasNames } from '@/lib/thai-aliases';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';

export const revalidate = 86400;

export async function generateStaticParams() {
  return [];
}

const SECTION: GearSection = {
  basePath: '/database/equipment',
  label: 'อุปกรณ์',
  recentKind: 'equipment',
  feedbackPageType: 'equipment',
  // The gear list ignores `type` unless `category` comes with it.
  subtypeHref: (item) =>
    `/database/equipment?category=${encodeURIComponent(item.category ?? '')}&type=${encodeURIComponent(item.weapon_type ?? '')}`,
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { data: item, error } = await getGearItem(Number(params.id));

  // A failed query says nothing about whether the row exists, so it makes no
  // title claim either way rather than telling a crawler a live page is dead.
  if (error) {
    console.error('equipment detail query failed (metadata)', error);
    return {};
  }

  if (!item) return { title: 'ไม่พบอุปกรณ์ชิ้นนี้' };

  const parts: string[] = [];
  if (item.weapon_type) parts.push(item.weapon_type);
  if (item.atk !== null) parts.push(`ATK ${item.atk}`);
  if (item.required_level !== null) parts.push(`ใช้ได้ที่เลเวล ${item.required_level}`);

  // The Thai name players search under. Without it the title is English only,
  // and "รองเท้าแก้ว ro" sat at position 6 for 22 impressions and no click
  // (Search Console, 90 days to 23 Sep 2026).
  const thai = thaiAliasNames('items', item.id);
  const thaiPart = thai.length > 0 ? ` (${thai.join(' / ')})` : '';

  return {
    // Not in the live client: the page stays, search engines are asked to skip it.
    ...(isAbsentFromGame(item.id) ? { robots: { index: false, follow: true } } : {}),
    title: `${item.name_en}${item.slots > 0 ? ` [${item.slots}]` : ''}${thaiPart} — ค่าพลังและออปชั่นสุ่ม`,
    description: `${item.name_en}${thai.length > 0 ? ` หรือที่เรียกกันว่า ${thai.join(' / ')}` : ''}${parts.length ? ` ${parts.join(' ')}` : ''} — ${CATEGORY_LABELS[item.category ?? ''] ?? 'อุปกรณ์'} อาชีพที่ใส่ได้ ออปชั่นสุ่มที่ทอยได้ และมอนสเตอร์ที่ดรอปใน RO Zero Thai`,
  };
}

export default async function EquipmentDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  const { data: item, error } = await getGearItem(id);

  if (error) {
    console.error('equipment detail query failed', error);
    // Thrown, not rendered: these pages are ISR (revalidate 86400), and a
    // rendered "error, try again" is a successful render that gets cached for
    // a day. Seen 7 Sep 2026 on a transient Supabase timeout. A throw goes to
    // app/error.tsx and is never cached.
    throw new Error(`equipment detail query failed: ${error.message}`);
  }

  if (!item) {
    notFound();
  }

  // A costume or a plain item has its canonical home elsewhere. Redirect
  // rather than render, so one row is never served (and indexed) at two URLs.
  if (!isGearCategory(item.category)) {
    permanentRedirect(itemHref(id, item.category));
  }

  const extras = await loadGearExtras(id, item.name_en);

  return <GearDetail item={item} extras={extras} section={SECTION} />;
}

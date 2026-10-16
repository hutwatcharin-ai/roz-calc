// The sentence under an item's name: what this item is for and where it comes
// from, in the facts this page itself goes on to show.
//
// It used to read "<name> เป็นไอเทมหมวด <category> ขายร้าน NPC ได้ <n> Zeny"
// on every one of 2,088 pages -- the same template with three words swapped,
// which is what a low-value page looks like (AdSense turned the site down for
// it; owner, 16 Oct 2026). Each part here is written only when this item has
// that fact, so two items read alike only when they really are alike.

import { KIND_TITLES, recipesMaking, recipesUsing } from '@/lib/crafting';
import { shopsFor } from '@/lib/npc-shops';

export interface SummaryDrop {
  name: string;
  level: number | null;
  rate: number | null;
}

export function itemSummary(opts: {
  id: number;
  sellPrice: number | null;
  drops: SummaryDrop[];
  questCount: number;
}): string[] {
  const parts: string[] = [];

  if (opts.drops.length > 0) {
    const lowest = opts.drops.reduce((a, b) => ((b.level ?? 999) < (a.level ?? 999) ? b : a));
    const detail = [lowest.level != null ? `Lv.${lowest.level}` : '', lowest.rate != null ? `อัตรา ${lowest.rate}%` : ''].filter(Boolean);
    parts.push(`ดรอปจากมอน ${opts.drops.length} ชนิด ตัวเลเวลต่ำสุดคือ ${lowest.name}${detail.length ? ` (${detail.join(' ')})` : ''}`);
  }

  const shops = shopsFor(opts.id);
  if (shops.length > 0) parts.push(`มีร้าน NPC ขาย ${shops.length} ร้าน`);

  const making = recipesMaking(opts.id);
  if (making.length > 0) parts.push(`ทำเองได้ (${[...new Set(making.map((r) => KIND_TITLES[r.kind]))].join(', ')})`);

  // A cookbook or a creation guide is held, not used up (amount 0).
  const using = recipesUsing(opts.id);
  const kindsOf = (list: typeof using) => [...new Set(list.map((r) => KIND_TITLES[r.kind]))].join(', ');
  const held = using.filter((r) => r.materials.some((m) => m.id === opts.id && !m.amount));
  const spent = using.filter((r) => !held.includes(r));
  if (spent.length > 0) parts.push(`ใช้เป็นวัตถุดิบ ${spent.length} สูตร (${kindsOf(spent)})`);
  if (held.length > 0) parts.push(`ต้องมีติดตัวตอนทำ ${held.length} สูตร (${kindsOf(held)}) ไม่ถูกใช้หมด`);

  if (opts.questCount > 0) parts.push(`เควส ${opts.questCount} เควสต้องใช้`);

  if (opts.sellPrice) parts.push(`ขายร้าน NPC ได้ ${opts.sellPrice.toLocaleString('en-US')} Zeny`);

  return parts;
}

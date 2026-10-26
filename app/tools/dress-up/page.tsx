// app/tools/dress-up/page.tsx
//
// The dress-up room. The character is drawn in the browser from sprite parts
// exported out of the client (scripts/build-dress-up.py) and served from the
// dress-up bucket at NEXT_PUBLIC_DRESSUP_BASE. Public since 26 Oct 2026
// (owner): in the tools menu, so in the sitemap too.
import type { Metadata } from 'next';
import DressRoom from '@/components/dressup/DressRoom';
import { INDEX } from '@/lib/dress-up/look';
import { gameItem } from '@/lib/game-items';
import { classStats } from '@/lib/class-stats';
import './page.css';

export const metadata: Metadata = {
  title: 'ห้องแต่งตัว Ragnarok Zero — ลองใส่คอสตูม หมวก ชุดไฮคลาส สัตว์ขี่',
  description:
    'ลองแต่งตัวละคร Ragnarok Zero Global ก่อนซื้อจริง จิ้มเลือกหมวก คอสตูม ผ้าคลุม ทรงผม สีผม สีชุด ทุกอาชีพ ใส่ชุดไฮคลาส ขี่สัตว์ เข็นรถเข็น เปลี่ยนท่า หมุนตัว ซูมดูใกล้ๆ ภาพทุกชิ้นวาดจากไฟล์เกมจริง',
};

export default function DressUpPage() {
  // Only the names the picker can offer: the items the index draws.
  const names: Record<string, string> = {};
  const costume: number[] = [];
  for (const id of Object.keys(INDEX.items)) {
    const g = gameItem(Number(id));
    names[id] = g?.name ?? `#${id}`;
    if (g?.costume) costume.push(Number(id));
  }
  const classNames: Record<string, string> = {};
  // High class outfits have no class page: their slug is the game's name (lord-knight: Lord Knight).
  const title = (slug: string) => slug.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  for (const c of INDEX.classes) classNames[c.slug] = classStats(c.slug)?.name ?? (c.of ? title(c.slug) : c.slug);

  return (
    <main className="shell" style={{ paddingBlock: 24 }}>
      <header className="bhero">
        <div className="bhero__text">
          <p className="bhero__kicker mono">▶ DRESS ROOM</p>
          <h1 className="bhero__title">ห้องแต่งตัว</h1>
          <p className="bhero__lead">ลองใส่ก่อนซื้อ จิ้มเลือกหมวก คอสตูม ทรงผม อาชีพ ชุดไฮคลาส สัตว์ขี่ แล้วดูตัวละครขยับแบบในเกม ภาพทุกชิ้นวาดจากไฟล์เกมจริง</p>
        </div>
      </header>
      <DressRoom names={names} costume={costume} classNames={classNames} />
    </main>
  );
}

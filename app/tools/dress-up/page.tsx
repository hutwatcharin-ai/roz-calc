// app/tools/dress-up/page.tsx
//
// The dress-up room, bare test page (dress-up plan 1, Task 6). The character
// is drawn in the browser from sprite parts exported out of the client
// (scripts/build-dress-up.py) and served from the dress-up bucket at
// NEXT_PUBLIC_DRESSUP_BASE. Not indexed, not in the nav or the sitemap until
// plans 2 and 3 (scenes, studio) land.
import DressRoom from '@/components/dressup/DressRoom';
import { INDEX } from '@/lib/dress-up/look';
import { gameItem } from '@/lib/game-items';
import { classStats } from '@/lib/class-stats';
import './page.css';

export const metadata = {
  title: 'ห้องแต่งตัว (ทดสอบ)',
  robots: { index: false, follow: false },
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
          <p className="bhero__kicker mono">▶ DRESS ROOM · TEST</p>
          <h1 className="bhero__title">ห้องแต่งตัว <span>(ทดสอบ)</span></h1>
          <p className="bhero__lead">จิ้มเลือกหมวก คอสตูม ทรงผม อาชีพ ท่า แล้วดูตัวละครขยับแบบในเกม</p>
        </div>
      </header>
      <DressRoom names={names} costume={costume} classNames={classNames} />
    </main>
  );
}

// app/tools/build/page.tsx
//
// The build simulator (owner, 6 Oct 2026). It replaced /tools/hit-flee, which
// asked for HIT/FLEE off the status window and listed monsters: a player who
// wants to hit one monster opens that monster's page, so the list was little
// used. What the site lacked was a place to put a whole character together --
// stats, gear, cards, food -- and see the status window before spending
// points or zeny. The old path redirects here (next.config.mjs), and monster
// pages read the HIT/FLEE this page saves.
//
// The site's flagship tool (owner, same day): its own arcade marquee instead
// of the plain page header, and the source as one short line at the foot
// rather than a paragraph above the tool.
import BuildSimulator from '@/components/BuildSimulator';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'จำลองบิลด์ Ragnarok Zero — อัปสเตตัส ใส่ของ ดู HIT/FLEE/ASPD',
  description:
    'จำลองบิลด์ Ragnarok Zero: เลือกอาชีพ อัปสเตตัสตามแต้มจริง ใส่อุปกรณ์ ตีบวก การ์ด อาหาร แล้วดูหน้าต่างสเตตัส HIT FLEE CRI ATK MATK ASPD HP SP และตีมอนที่เลือกโดนกี่ %',
  alternates: { canonical: '/tools/build' },
};

// A parade of classes across the marquee: decoration, one of each line.
const PARADE = ['knight', 'wizard', 'hunter', 'priest', 'assassin', 'blacksmith'];

export default function BuildPage() {
  return (
    <main className="shell" style={{ paddingBlock: 24 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'จำลองบิลด์', path: '/tools/build' },
      ])} />
      <header className="bhero">
        <div className="bhero__text">
          <p className="bhero__kicker mono">▶ BUILD SIMULATOR</p>
          <h1 className="bhero__title">จำลองบิลด์</h1>
          <p className="bhero__lead">อัปสเตตัส ใส่ของ ตีบวก การ์ด อาหาร แล้วดูค่าจริงก่อนลงแต้ม</p>
        </div>
        <div className="bhero__parade" aria-hidden="true">
          {PARADE.map((c) => <img key={c} src={`/images/jobs/${c}.png`} alt="" width={72} height={72} />)}
        </div>
      </header>
      <BuildSimulator />
      <p className="bhero__credit">
        สูตรและข้อมูลไอเทม: <a href="https://roz.prontera.info/builds/new" rel="noopener" target="_blank">roz.prontera.info</a> · HIT/FLEE มอน: midgardhub
      </p>
    </main>
  );
}

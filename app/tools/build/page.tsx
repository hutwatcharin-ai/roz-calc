// app/tools/build/page.tsx
//
// The build simulator (owner, 6 Oct 2026). It replaced /tools/hit-flee, which
// asked for HIT/FLEE off the status window and listed monsters: a player who
// wants to hit one monster opens that monster's page, so the list was little
// used. What the site lacked was a place to put a whole character together --
// stats, gear, cards, food -- and see the status window before spending
// points or zeny. The old path redirects here (next.config.mjs), and monster
// pages read the HIT/FLEE this page saves.
import BuildSimulator from '@/components/BuildSimulator';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'จำลองบิลด์ Ragnarok Zero — อัปสเตตัส ใส่ของ ดู HIT/FLEE/ASPD',
  description:
    'จำลองบิลด์ Ragnarok Zero: เลือกอาชีพ อัปสเตตัสตามแต้มจริง ใส่อุปกรณ์ ตีบวก การ์ด อาหาร แล้วดูหน้าต่างสเตตัส HIT FLEE CRI ATK MATK ASPD HP SP และตีมอนที่เลือกโดนกี่ %',
  alternates: { canonical: '/tools/build' },
};

export default function BuildPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'จำลองบิลด์', path: '/tools/build' },
      ])} />
      <PageHeader
        title="จำลองบิลด์ — อัปสเตตัส ใส่ของ ดูค่าจริงก่อนลงแต้ม"
        lead="เลือกอาชีพ อัปสเตตัส ใส่อุปกรณ์ ตีบวก การ์ด และอาหาร แล้วดูหน้าต่างสเตตัสทั้งหมด พร้อมเช็กกับมอนที่จะตีว่าโดนกี่ % ต้องอัป DEX/AGI อีกเท่าไหร่"
        source={
          <>
            <strong>ที่มา:</strong> สูตร ค่าอาชีพ ผลของไอเทม การ์ด เซ็ต และอาหาร จาก{' '}
            <a href="https://roz.prontera.info/builds/new" rel="noopener" target="_blank">roz.prontera.info</a> · ค่าตีบวกจากตารางทางการ ·
            ฝั่งมอนใช้ HIT/FLEE เป้าจาก midgardhub
          </>
        }
      />
      <BuildSimulator />
    </main>
  );
}

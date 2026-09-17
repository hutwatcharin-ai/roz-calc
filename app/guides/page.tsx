// app/guides/page.tsx
//
// The landing page of the section the reference tables and the written guide
// moved into on 3 Sep 2026. It exists because the nav's primary tab needs
// somewhere to point, and because "which table do I want" is a question worth
// answering in a sentence each rather than by chip label alone.
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';

export const metadata = {
  title: 'ไกด์และตารางอ้างอิง',
  description:
    'ตารางธาตุ ตารางขนาด ตาราง EXP ต่อเลเวล และจุดฟาร์มแนะนำของ Ragnarok Zero Global รวมไว้ที่เดียว เปิดดูได้เลยไม่ต้องกรอกอะไร',
};

// Ordered by how often a player opens them, not alphabetically.
const GUIDES = [
  {
    href: '/guides/farm-guide',
    title: 'จุดฟาร์มแนะนำ',
    blurb: 'ช่วงเลเวลไหนควรไปตีอะไร ไล่ตั้งแต่ออกจากเมืองใหม่ ๆ จนถึงเลเวลสูงสุด พร้อมเหตุผลว่าทำไมจุดนั้น',
  },
  {
    href: '/guides/potion-crafting',
    title: 'วิธีทำยา Alchemist และขวดพิษ Assassin',
    blurb: 'เตรียมสกิล ตำรา Mortar Bowl และวัตถุดิบให้ครบ พร้อมตารางสูตรยาและไอเทมเคมีที่ใช้บ่อย · สูตร Poison Bottle ของ Assassin',
  },
  {
    href: '/guides/forging',
    title: 'ตีอาวุธเอง และทำอาวุธธาตุ',
    blurb: 'อาวุธที่ Blacksmith ตีเองได้ทุกแบบพร้อมวัตถุดิบ · ใส่หินธาตุตอนตีให้ได้อาวุธธาตุ หินทำจากอะไร และอะไรทำให้ตีติดบ่อยขึ้น',
  },
  {
    href: '/guides/arrow-crafting',
    title: 'ทำลูกศร — ของอะไรทำเป็นลูกศรอะไร',
    blurb: 'ของทิ้งๆ ในกระเป๋าแปลงเป็นลูกศรได้ทีละหลายร้อยดอก ดูว่าชิ้นไหนให้อะไรบ้าง',
  },
  {
    href: '/guides/cooking',
    title: 'ทำอาหารเพิ่มสเตตัส',
    blurb: 'อาหารแต่ละอย่างทำจากอะไร ต้องมีตำราเล่มไหนติดตัว',
  },
  {
    href: '/guides/ore-refining',
    title: 'หลอมแร่และหินธาตุ',
    blurb: 'Iron Ore เป็น Iron, Iron เป็น Steel และหินธาตุทั้งสี่ทำจากของดรอปอะไร',
  },
  {
    href: '/guides/memorial-gear',
    title: 'ชุดดันเจี้ยนความทรงจำ 4 แรงค์',
    blurb: 'Subjugation → Expedition → Contingent → Conqueror ครบทุกชิ้น — ชิ้นไหนอัปเป็นชิ้นไหน ใช้อะไรอัป และตอนนี้ใส่ได้แค่แรงค์ไหน',
  },
  {
    href: '/guides/job-change',
    title: 'เปลี่ยนอาชีพ 2 — NPC อยู่ตรงไหน',
    blurb: 'NPC ทั้ง 13 อาชีพอยู่แมพไหน พิกัดเท่าไร ก๊อป /navi ไปวางในแชตแล้วเดินตามเส้นนำทาง',
  },
  {
    href: '/guides/costume-craft',
    title: 'คราฟต์หมวกแฟชั่น',
    blurb: 'หมวกที่ไม่มีมอนดรอป ต้องเก็บของไปให้ NPC ทำ — เอาอะไรไปกี่ชิ้น และ NPC ยืนอยู่ตรงไหน',
  },
  {
    href: '/guides/memorial-dungeons',
    title: 'ดันเจี้ยนความทรงจำ 6 แห่ง',
    blurb: 'เข้าได้ตอนเลเวลไหน ต้องไปกี่คน รีเซ็ตเมื่อไร และในนั้นเจอมอนอะไรบ้าง เลือดเท่าไร',
  },
  {
    href: '/guides/star-gear',
    title: 'อาวุธและชุดติดดาว ★',
    blurb: 'ของธรรมดาที่ปลุกแล้วแรงขึ้น และได้โบนัสอีกทอดตอน +3 +7 +9 — มีชิ้นไหนบ้าง ปลุกยังไง และเสียตีบวกกี่ขั้น',
  },
  {
    href: '/guides/codes',
    title: 'โค้ดรับของ',
    blurb: 'โค้ดคูปอง 22 โค้ด แยกว่าอันไหนยังใช้ได้ อันไหนปิดไปแล้ว กรอกที่บัญชี GNJOY ของเข้าเมลในเกม',
  },
  {
    href: '/guides/elements',
    title: 'ตารางธาตุ',
    blurb: 'ธาตุอาวุธไหนตีธาตุมอนแล้วเข้ากี่ % ครบทั้ง 4 ระดับธาตุ — ตารางเดียวกับที่เกมใช้คำนวณ',
  },
  {
    href: '/guides/sizes',
    title: 'ตารางขนาด',
    blurb: 'ชนิดอาวุธกับขนาดมอน: มีดตีมอนใหญ่ได้กี่ % หอกตีมอนเล็กเหลือเท่าไร',
  },
  {
    href: '/guides/exp',
    title: 'EXP ต่อเลเวล',
    blurb: 'ต้องใช้ EXP เท่าไรถึงจะขึ้นเลเวลถัดไป ทั้ง Base และ Job ดูรวดเดียวทั้งช่วง พร้อม EXP ตอนเข้าปาร์ตี้',
  },
  {
    href: '/guides/social',
    title: 'รีเซ็ตสเตตัส แคลน แต่งงาน',
    blurb: 'รีเซ็ตสเตตัสฟรีถึงเลเวลไหน เกินแล้วเสียเท่าไร · แคลนทั้ง 4 ให้สเตตัสอะไร · ระบบแต่งงานที่ยังไม่เปิด',
  },
] as const;

export default function GuidesPage() {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'หน้าแรก', path: '/' },
          { name: 'ไกด์', path: '/guides' },
        ])}
      />
      <PageHeader title="ไกด์และตารางอ้างอิง" />
      <p className="muted" style={{ marginTop: -6, marginBottom: 16, maxWidth: '70ch' }}>
        หน้าพวกนี้เปิดอ่านได้เลย ไม่ต้องกรอกอะไร — ส่วนที่ต้องใส่ตัวเลขของตัวเองแล้วให้เว็บคำนวณ อยู่ใน{' '}
        <Link href="/tools/leveling-spots">เครื่องมือ</Link>
      </p>

      <div className="itemgrid">
        {GUIDES.map((guide) => (
          <Link key={guide.href} href={guide.href} className="guidecard">
            <span className="guidecard__title">{guide.title}</span>
            <span className="guidecard__blurb">{guide.blurb}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}

// app/tools/leveling-spots/page.tsx
//
// ฟาร์มที่ไหนดี. Since the farm tool integration (11 Sep 2026) the server sends
// only the frame and a description of the four modes; every ranking is
// computed in the browser from one payload (farm-data/route.ts) so the modes
// can never disagree. Search Console showed 0 impressions for this URL over
// 90 days, so moving the ranked rows out of the HTML costs no search traffic.
import PageHeader from '@/components/PageHeader';
import FarmTool, { type FarmMode } from '@/components/farm/FarmTool';

export const metadata = {
  title: 'ฟาร์มที่ไหนดี — แมพเก็บเลเวล หาเงิน จุด AFK และแผนของคุณ',
  description:
    'ใส่เลเวลแล้วดูได้เลยว่าควรไปแมพไหนใน Ragnarok Zero Global · สลับเป็นโหมดหาเงิน (แมพที่ปล่อยบอทเก็บของไปขายแล้วได้เงินมากสุด) หาจุดทิ้งบอท AFK หรือเทียบมอนที่เลือกไว้ · ใส่ดาเมจกับ ASPD เพิ่มเพื่อคิดเป็น EXP หรือ zeny ต่อชั่วโมงจริงของคุณ',
};

function readMode(raw: string | string[] | undefined): FarmMode {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'afk' || value === 'plan' || value === 'zeny' ? value : 'level';
}

/** The level a link asked for, or null when it asked for none. */
function readLevel(raw: string | string[] | undefined): number | null {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (raw === undefined || !Number.isFinite(value)) return null;
  return Math.min(200, Math.max(1, Math.round(value)));
}

export default function LevelingSpotsPage({
  searchParams,
}: {
  searchParams: { level?: string | string[]; mode?: string | string[] };
}) {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <PageHeader title="ฟาร์มที่ไหนดี" lead="ไม่กรอกอะไรก็ได้คำตอบ — กรอกตัวเลขตัวละครครั้งเดียว ใช้ได้ทั้ง 4 โหมด" />

      <FarmTool initialMode={readMode(searchParams.mode)} initialLevel={readLevel(searchParams.level)} />

      <section className="farm-section" aria-labelledby="farm-modes">
        <h2 id="farm-modes" className="section-title">
          4 โหมดนี้ต่างกันยังไง
        </h2>
        <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7, maxWidth: '75ch' }}>
          <li>
            <strong>เก็บเลเวล</strong> — เล่นเองตอนนี้ แมพที่มีมอนช่วงเลเวลคุณ เรียงตาม EXP หรือ EXP ต่อชั่วโมงของคุณ
          </li>
          <li>
            <strong>ทิ้งบอท AFK</strong> — แมพที่บอทหลบมอนได้ครบทุกตัว เก็บ EXP ข้ามคืนได้โดยไม่ตาย
          </li>
          <li>
            <strong>หาเงิน</strong> — แมพที่ปล่อยบอทเก็บของดรอปไปขายร้าน NPC แล้วได้เงินมากสุด หักดรอปตามช่วงเลเวลให้ด้วย
          </li>
          <li>
            <strong>รายการของฉัน</strong> — เทียบมอนที่กดเพิ่มเข้าแผนไว้ทีละตัว ทั้ง EXP และเงินต่อชั่วโมง
          </li>
        </ul>
      </section>
    </main>
  );
}

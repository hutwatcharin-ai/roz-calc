// app/tools/leveling-spots/page.tsx
//
// ฟาร์มที่ไหนดี. Since the farm tool integration (11 Sep 2026) the server sends
// only the frame and a description of the four modes; every ranking is
// computed in the browser from one payload (farm-data/route.ts) so the modes
// can never disagree. Search Console showed 0 impressions for this URL over
// 90 days, so moving the ranked rows out of the HTML costs no search traffic.
import PageHeader from '@/components/PageHeader';
import AdSlot from '@/components/AdSlot';
import FarmTool, { type FarmMode } from '@/components/farm/FarmTool';
import { FARM_DATA_URL } from '@/lib/farm-data-url';
import JsonLd from '@/components/JsonLd';
import { breadcrumbJsonLd } from '@/lib/jsonld';
import Link from 'next/link';

// Spots players actually use, from clips (27 Sep 2026). The ranked tool above
// cannot know that a map is empty of players or that a quest chain pays extra,
// so these sit below it with the source named on each row.
const PLAYER_SPOTS = [
  {
    map: 'pay_fild09', name: 'Payon Forest (Horn + Elder Willow)', level: '~40',
    why: 'EXP ใกล้ Coco แต่คนน้อยกว่ามาก บอท Lv 40 ข้ามคืนขึ้นราว 2 เลเวล · ดรอป Guisarme (มีรุ่นติดดาว คนเก็บไว้ปลุก) กับ Partizan การ์ด Horn / Elder Willow และ Resin',
    src: { label: 'Ryan Geldun: Chill Zeny and Exp farming spot you FORGOT about', url: 'https://www.youtube.com/watch?v=oEPSeeOEGVk' },
  },
  {
    map: 'gef_fild11', name: 'หมู่บ้าน Goblin (ใต้หมู่บ้าน Orc 1 แมพ)', level: '40–50',
    why: 'Goblin ให้ 3,000–5,000 EXP ต่อตัว โจมตีก่อนและมาเป็นกลุ่ม สายสกิลวงกว้างอย่าง Magnum Break ได้ราว 15% ใน 30 นาที · FLEE พอก็หลบได้ · มีเควสรายวันฆ่า Goblin ที่ให้ EXP เยอะมาก เปิดจากผู้หญิงหน้ากิลด์อัศวิน Prontera',
    src: { label: 'Ryan Geldun: AOE Leveling to lvl50 on goblins', url: 'https://www.youtube.com/watch?v=Q1KTRtd7wPA' },
  },
  {
    map: 'prt_sewb2', name: 'Prontera Sewer ชั้น 2', level: '20–30',
    why: 'จุดหาเงินช่วงต้นเกม ทดลองเปิดบอท 24 ชั่วโมง ขายของดรอปให้ NPC ได้ 134,455 zeny ไม่รวมชุดที่เก็บไว้ลุ้นออป',
    src: { label: 'Nokk_tt Ch.: ทดลองฟาร์ม 24 ชั่วโมง', url: 'https://www.youtube.com/watch?v=fnyrScpLEkc' },
  },
];

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

// The rankings cannot be drawn before their payload arrives, and the browser
// only learned about it after hydration -- HTML, then JS, then fetch. Asking
// for it with the HTML removes a whole step from that queue (23 Sep 2026).
export default function LevelingSpotsPage({
  searchParams,
}: {
  searchParams: { level?: string | string[]; mode?: string | string[] };
}) {
  return (
    <main className="shell" style={{ paddingBlock: 32 }}>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'หน้าแรก', path: '/' },
        { name: 'ฟาร์มที่ไหนดี', path: '/tools/leveling-spots' },
      ])} />
      {/* Starts the payload while the HTML is still being read, instead of
          after hydration: HTML, then JS, then fetch was a queue three steps
          long before anything could be ranked. The hook picks this promise up
          (lib/use-farm-data). react-dom's preload refuses as:"fetch" without
          CORS, which would have meant downloading it twice. */}
      <script
        dangerouslySetInnerHTML={{
          __html: `window.__farmData=fetch(${JSON.stringify(FARM_DATA_URL)}).then(function(r){return r.ok?r.json():Promise.reject(new Error('HTTP '+r.status))});`,
        }}
      />
      <PageHeader title="ฟาร์มที่ไหนดี" lead="ไม่กรอกอะไรก็ได้คำตอบ — กรอกตัวเลขตัวละครครั้งเดียว ใช้ได้ทั้ง 4 โหมด" />

      <FarmTool initialMode={readMode(searchParams.mode)} initialLevel={readLevel(searchParams.level)} />

      {/* Below the tool's own answer, above the explanation. */}
      <AdSlot slot="inline" />

      <section className="farm-section" aria-labelledby="farm-players">
        <h2 id="farm-players" className="section-title">
          จุดที่ผู้เล่นใช้จริง
        </h2>
        <p className="muted" style={{ margin: '0 0 10px', maxWidth: '75ch' }}>
          ตารางข้างบนเรียงจากตัวเลขมอน ไม่รู้ว่าแมพไหนคนแน่นหรือมีเควสให้ EXP เพิ่ม สามแมพนี้คือที่ผู้เล่นลองแล้วเล่าไว้
        </p>
        <ul style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7, maxWidth: '75ch', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PLAYER_SPOTS.map((spot) => (
            <li key={spot.map}>
              <strong><Link href={`/database/maps/${spot.map}`}>{spot.name}</Link></strong> <span className="muted">Lv {spot.level}</span>
              <br />
              {spot.why}
              <br />
              <span className="muted" style={{ fontSize: 13 }}>
                ที่มา:{' '}
                <a href={spot.src.url} target="_blank" rel="noopener noreferrer">{spot.src.label}</a>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="farm-section" aria-labelledby="farm-modes">
        <h2 id="farm-modes" className="section-title">
          4 โหมดนี้ต่างกันยังไง
        </h2>
        <ul className="muted" style={{ margin: 0, paddingInlineStart: 18, lineHeight: 1.7, maxWidth: '75ch' }}>
          <li>
            <strong>เก็บเลเวล</strong> เล่นเองตอนนี้ แมพที่มีมอนช่วงเลเวลคุณ เรียงตาม EXP หรือ EXP ต่อชั่วโมงของคุณ
          </li>
          <li>
            <strong>ทิ้งบอท AFK</strong> แมพที่บอทหลบมอนได้ครบทุกตัว เก็บ EXP ข้ามคืนได้โดยไม่ตาย
          </li>
          <li>
            <strong>หาเงิน</strong> แมพที่ปล่อยบอทเก็บของดรอปไปขายร้าน NPC แล้วได้เงินมากสุด หักดรอปตามช่วงเลเวลให้ด้วย
          </li>
          <li>
            <strong>รายการของฉัน</strong> เทียบมอนที่กดเพิ่มเข้าแผนไว้ทีละตัว ทั้ง EXP และเงินต่อชั่วโมง
          </li>
        </ul>
      </section>
    </main>
  );
}

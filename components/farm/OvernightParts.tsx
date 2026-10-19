// What the two overnight modes (ทิ้งบอท AFK, หาเงิน) share around the map
// list: the filter row, the one-line summary and the "how is this worked
// out" box. Both modes judge maps the same way (lib/farm-engine/survival, or
// the dodge gate when Max HP is blank), so they say it the same way.

import { DODGE_CAP_RELAXED, DODGE_CAP_STRICT } from '@/lib/afk-safety';
import { canGate } from '@/lib/farm-engine/basics';
import { LOW_MAP_GAP } from '@/lib/farm-engine/rank';
import { CASTER_RANGE, canSurvive } from '@/lib/farm-engine/survival';
import { NIGHT_HOURS, type FarmData, type PlayerInput } from '@/lib/farm-engine/types';

export interface OvernightFilters {
  cleanOnly: boolean;
  noRiskOnly: boolean;
  hideLow: boolean;
}

export function MapFilters({
  filters,
  onChange,
  canHideLow,
}: {
  filters: OvernightFilters;
  onChange: (next: OvernightFilters) => void;
  /** The player's level is known. */
  canHideLow: boolean;
}) {
  return (
    <div className="filterbar farm-filters">
      {canHideLow && (
        <label className="cvtoggle">
          <input type="checkbox" checked={filters.hideLow} onChange={(e) => onChange({ ...filters, hideLow: e.target.checked })} />
          ซ่อนแมพที่มอนต่ำกว่าเรา {LOW_MAP_GAP}+ เลเวล
        </label>
      )}
      <label className="cvtoggle">
        <input type="checkbox" checked={filters.cleanOnly} onChange={(e) => onChange({ ...filters, cleanOnly: e.target.checked })} />
        เฉพาะแมพที่ไม่มีมอนโจมตีก่อน
      </label>
      <label className="cvtoggle">
        <input type="checkbox" checked={filters.noRiskOnly} onChange={(e) => onChange({ ...filters, noRiskOnly: e.target.checked })} />
        เฉพาะแมพที่ไม่มีสกิลเสี่ยง
      </label>
    </div>
  );
}

export function OvernightSummary({
  player,
  ranked,
  blocked,
  hiddenLow,
  data,
  unrated,
}: {
  player: PlayerInput;
  ranked: number;
  blocked: number;
  hiddenLow: number;
  data: FarmData;
  /** What the list is sorted by when there is no kill speed. */
  unrated: string;
}) {
  const survive = canSurvive(player);
  const gate = canGate(player);
  return (
    <p className="farm-summary">
      {survive ? (
        <>
          ปล่อยบอทได้ <strong>{ranked}</strong> แมพ · เรียงตามที่ได้ทั้งคืน {NIGHT_HOURS} ชม. (หรือจนบอทกลับเมือง) โดยเลือกมอนที่ควรติ๊กให้แต่ละแมพ · ตัดออก{' '}
          <strong>{blocked}</strong> แมพที่ติ๊กชุดไหนบอทก็อยู่ไม่ถึงชั่วโมงหรือตาย
        </>
      ) : gate ? (
        <>
          ปล่อยบอทได้ทั้งคืน <strong>{ranked}</strong> แมพ · ตัดออก <strong>{blocked}</strong> แมพ เพราะมีมอนที่คุณหลบไม่พ้น ·{' '}
          <strong>กรอก Max HP</strong> แล้วจะคิดจากดาเมจที่โดนตีจริง ไม่ต้องหลบได้ทุกตัว
        </>
      ) : (
        <>
          {unrated} · <strong>กรอก Max HP กับ FLEE</strong> แล้วจะตัดแมพที่บอทอยู่ไม่รอด
        </>
      )}
      {hiddenLow > 0 && <> · ซ่อน {hiddenLow} แมพที่มอนต่ำกว่าเลเวลคุณ {LOW_MAP_GAP}+</>}
      <span className="farm-summary__rule">
        {' '}
        · ไม่รวม {data.excluded.closedMaps} แมพที่ยังไม่เปิดในเซิร์ฟ · ไม่นับ MVP {data.excluded.mvp} ตัว และมอนที่เกิดทีละตัว {data.excluded.solo} ตัว (ติดป้ายบอสไว้แทน)
      </span>
    </p>
  );
}

/** The survival paragraphs of the caveat box; the mode adds its own about EXP or zeny. */
export function SurvivalCaveat({ player }: { player: PlayerInput }) {
  if (!canSurvive(player)) {
    return (
      <p>
        ยังไม่ได้กรอก Max HP เลยตัดแมพด้วยการหลบอย่างเดียว: มอนที่บอทตี (ไม่นับ MVP กับบอส) ตีคุณโดนเกิน {DODGE_CAP_RELAXED}% (แมพมีมอนโจมตีก่อนหรือสายเวท: เกิน{' '}
        {DODGE_CAP_STRICT}%) หรือไม่มีค่า FLEE ของมอน
      </p>
    );
  }
  return (
    <>
      <p>
        <strong>คิดตามบอทในเกมจริง</strong> (หน้าตั้งค่าบอทที่เจ้าของเว็บส่งมา): บอทล่าเฉพาะมอนที่ติ๊ก มอนโจมตีก่อนที่ไม่ได้ติ๊กจะเดินตามตีจนกว่าบอทจะวาร์ป
        เพราะบอทไม่สู้กลับ · วาร์ปเมื่อไม่ได้สู้ตามเวลาที่ตั้ง เมื่อโดนตีแรงเกินค่าที่ตั้ง หรือโดนรุมตามจำนวนที่ตั้ง · Creamy ใช้ SP ครั้งละ 10 (ค่า rAthena) Fly Wing
        ใช้ชิ้นละ 1 · บอทกลับเมืองแล้วยืนอยู่ในเมือง เมื่อยาหมด หรือน้ำหนักถึงค่าที่ตั้ง (ถ้าไม่ติ๊กล่าต่อ) · เงินนับเฉพาะช่วงที่ยังเก็บของ · ระยะเดินหามอนคิดจากความหนาแน่นของมอนที่ติ๊ก
        บนพื้นที่เดินได้ของแมพ · โหลดแมพหลังวาร์ปคิด 1 วินาที (ประมาณ)
      </p>
      <p>
        <strong>ดาเมจที่โดน:</strong> มอนแต่ละตัวตีโดน 5 + FLEE ที่ต้องใช้หลบ − FLEE คุณ (%) · ตีทีละ ATK มอน × (4000 + DEF ชุด) ÷ (4000 + 10 × DEF ชุด) − DEF จาก VIT
        (สูตร Renewal) · โดนรุมหลายตัว FLEE ลด 10% ต่อตัวที่เกิน 2 · ถ้าไม่ได้ตั้งวาร์ปเมื่อโดนตีแรง และไฟต์เดียวเลือดหายเกินหลอด หรือมอนตีทีเดียวเกินเลือดเต็มหลอด
        แมพนั้นจะถูกตัด
      </p>
      <p>
        ยาฟื้นตามข้อความในเกม × (100 + VIT × 2)% · เลือดฟื้นเอง Max HP ÷ 200 ทุก 6 วินาทีตอนยืนตี ไม่ฟื้นตอนเดิน · สายเวทร่ายฟรีช่วงที่มอนเดินเข้ามา (ระยะ {CASTER_RANGE} ช่อง)
        หลังจากนั้นโดนตีทีร่ายหลุดต้องร่ายใหม่ · เดินหามอนไม่รวมกำแพงกับคนแย่งมอน จึงเป็นค่าต่ำสุด
      </p>
      <p>
        <strong>ยังไม่มีใครวัดใน Zero:</strong> ความเร็วตี ระยะมองเห็น และความเร็วเดินของมอน ใช้ค่าจาก rAthena (RO คลาสสิก) มอนที่ไม่มีค่าใช้ค่ากลาง · ไม่คิดสกิลของมอน
        (ดูป้ายสกิลเสี่ยง) และไม่คิดบอสที่เดินผ่าน · ช่องถือยาว่าง คิดว่าใส่ยาเต็มถึง 70% ของน้ำหนักสูงสุด (หักน้ำหนักตอนนี้) เพราะเกิน 70% เลือดไม่ฟื้นเอง · ไม่คิดไอเทมบัฟหมด (บอทกลับเมืองเหมือนกัน)
      </p>
    </>
  );
}

/** Not KILL_RATE_DISCLAIMER: these modes do count the walk between kills. */
export function RateCaveat() {
  return <p>ต่อชั่วโมงเป็นเพดานบน นับเวลาตีกับเวลาเดินหามอนแล้ว แต่ไม่นับรอมอนเกิดใหม่และคนแย่งมอน ของจริงจะน้อยกว่านี้</p>;
}

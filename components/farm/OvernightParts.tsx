// What the two overnight modes (ทิ้งบอท AFK, หาเงิน) share around the map
// list: the filter row, the one-line summary and the "how is this worked
// out" box. Both modes judge maps the same way (lib/farm-engine/survival, or
// the dodge gate when Max HP is blank), so they say it the same way.

import { DODGE_CAP_RELAXED, DODGE_CAP_STRICT } from '@/lib/afk-safety';
import { canGate } from '@/lib/farm-engine/basics';
import { LOW_MAP_GAP } from '@/lib/farm-engine/rank';
import { BURST_SHARE, CASTER_RANGE, canSurvive } from '@/lib/farm-engine/survival';
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
          บอทรอดทั้งคืน <strong>{ranked}</strong> แมพ · ตัดออก <strong>{blocked}</strong> แมพ เพราะสู้ไฟต์เดียวเลือดหายเกินครึ่ง หรือเลือดกับยาไม่พอ {NIGHT_HOURS}{' '}
          ชม.
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
        <strong>รอดไหม คิดยังไง:</strong> มอนแต่ละตัวตีโดน 5 + FLEE ที่ต้องใช้หลบ − FLEE คุณ (%) · ตีทีละ ATK มอน × (4000 + DEF ชุด) ÷ (4000 + 10 × DEF ชุด) − DEF จาก VIT
        (สูตร Renewal) · มอนโจมตีก่อนที่อยู่ในระยะมองเห็นของไฟต์จะเข้ามารุมด้วย คิดจากจำนวนมอนต่อพื้นที่เดินได้ของแมพ และ FLEE ลด 10% ต่อตัวที่เกิน 2 ·
        แมพถูกตัดเมื่อสู้ไฟต์เดียวเลือดหายเกิน {Math.round(BURST_SHARE * 100)}% หรือเลือดเต็มหลอดกับยาที่ถือไปหมดก่อน {NIGHT_HOURS} ชม.
      </p>
      <p>
        ยาฟื้นตามข้อความในเกม × (100 + VIT × 2)% · เลือดฟื้นเอง Max HP ÷ 200 ทุก 6 วินาทีตอนยืนตี ไม่ฟื้นตอนเดิน · สายเวทร่ายฟรีช่วงที่มอนเดินเข้ามา (ระยะ {CASTER_RANGE} ช่อง)
        หลังจากนั้นโดนตีทีร่ายหลุดต้องร่ายใหม่ · เดินหามอน = ระยะเฉลี่ยถึงมอนตัวที่ใกล้สุด จากพื้นที่เดินได้ของแมพในไฟล์เกม ที่ความเร็วเดินปกติ ไม่รวมกำแพงกับคนแย่งมอน
        จึงเป็นค่าต่ำสุด ตั้งเองได้ในช่อง &ldquo;เดินหามอน&rdquo;
      </p>
      <p>
        <strong>ยังไม่มีใครวัดใน Zero:</strong> ความเร็วตี ระยะมองเห็น และความเร็วเดินของมอน ใช้ค่าจาก rAthena (RO คลาสสิก) มอนที่ไม่มีค่าใช้ค่ากลาง · ไม่คิดสกิลของมอน
        (ดูป้ายสกิลเสี่ยง) และไม่คิดบอสที่เดินผ่าน · ช่องถือยาว่าง คิดว่าถือยาเต็มครึ่งหนึ่งของน้ำหนักสูงสุด เพราะเกินครึ่งเลือดไม่ฟื้นเอง ไม่ได้หักน้ำหนักของอื่นและของที่เก็บได้
      </p>
    </>
  );
}

/** Not KILL_RATE_DISCLAIMER: these modes do count the walk between kills. */
export function RateCaveat() {
  return <p>ต่อชั่วโมงเป็นเพดานบน นับเวลาตีกับเวลาเดินหามอนแล้ว แต่ไม่นับรอมอนเกิดใหม่และคนแย่งมอน ของจริงจะน้อยกว่านี้</p>;
}

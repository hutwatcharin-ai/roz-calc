'use client';

// ทิ้งบอท AFK: where a bot collects EXP overnight and survives. Per map, since
// a bot fights whatever it meets on the map, not one chosen monster. The gate
// is the same one the zeny mode uses (lib/farm-engine/safety).

import { useMemo, useState } from 'react';
import Caveat from '@/components/Caveat';
import RankedMaps from './RankedMaps';
import BlockedMaps from './BlockedMaps';
import { commonestBlocker, mapCardTags, mobsFigure, whole } from './card-helpers';
import type { ViewProps } from './LevelView';
import { rankMaps, type RankedMap } from '@/lib/farm-engine/rank';
import { canGate, canRate } from '@/lib/farm-engine/basics';
import { NIGHT_HOURS } from '@/lib/farm-engine/types';
import { DODGE_CAP_RELAXED, DODGE_CAP_STRICT } from '@/lib/afk-safety';
import { KILL_RATE_DISCLAIMER } from '@/lib/kills-per-hour';

export function MapFilters({
  cleanOnly,
  noRiskOnly,
  onClean,
  onNoRisk,
}: {
  cleanOnly: boolean;
  noRiskOnly: boolean;
  onClean: (on: boolean) => void;
  onNoRisk: (on: boolean) => void;
}) {
  return (
    <div className="filterbar farm-filters">
      <label className="cvtoggle">
        <input type="checkbox" checked={cleanOnly} onChange={(e) => onClean(e.target.checked)} />
        เฉพาะแมพที่ไม่มีมอนโจมตีก่อน
      </label>
      <label className="cvtoggle">
        <input type="checkbox" checked={noRiskOnly} onChange={(e) => onNoRisk(e.target.checked)} />
        เฉพาะแมพที่ไม่มีสกิลเสี่ยง
      </label>
    </div>
  );
}

export default function AfkView({ data, player, level }: ViewProps) {
  const [cleanOnly, setCleanOnly] = useState(false);
  const [noRiskOnly, setNoRiskOnly] = useState(false);
  const { ranked, blocked } = useMemo(
    () => rankMaps(data, player, 'afk', { level, cleanOnly, noRiskOnly }),
    [data, player, level, cleanOnly, noRiskOnly],
  );
  const rate = canRate(player);
  const gate = canGate(player);

  const toCard = (map: RankedMap) => ({
    code: map.code,
    name: map.name,
    image: map.image,
    channels: map.channels,
    headline:
      rate && map.perHour !== null
        ? { label: 'ได้ราว', value: whole(map.perHour), unit: ' EXP/ชม.' }
        : { label: 'เฉลี่ยตัวละ', value: whole(map.avgPerKill), unit: ' EXP' },
    stats:
      rate && map.perHour !== null
        ? [{ label: `ทั้งคืน ${NIGHT_HOURS} ชม. ราว`, value: whole(map.perHour * NIGHT_HOURS), unit: ' EXP' }, mobsFigure(map)]
        : [mobsFigure(map)],
    monsters: map.top.map((t) => {
      const m = data.monsters[t.id];
      return { id: t.id, name: m.name, sprite: m.sprite, note: `Lv${m.level ?? '?'} · ${whole(t.value)} EXP ×${t.amount}` };
    }),
    tags: mapCardTags(map),
  });

  const blocker = commonestBlocker(blocked);

  return (
    <>
      <p className="farm-summary">
        {gate ? (
          <>
            ปล่อยบอทได้ทั้งคืน <strong>{ranked.length}</strong> แมพ · ตัดออก <strong>{blocked.length}</strong> แมพ เพราะมีมอนที่คุณหลบไม่พ้น
          </>
        ) : (
          <>
            ยังไม่ได้ตัดแมพอันตราย · <strong>กรอก FLEE</strong> แล้วจะเหลือเฉพาะแมพที่หลบได้ครบทุกตัว
          </>
        )}
        <span className="farm-summary__rule"> · ไม่นับ MVP {data.excluded.mvp} ตัว และมอนที่เกิดทีละตัว {data.excluded.solo} ตัว</span>
      </p>

      <MapFilters cleanOnly={cleanOnly} noRiskOnly={noRiskOnly} onClean={setCleanOnly} onNoRisk={setNoRiskOnly} />

      {ranked.length === 0 ? (
        <div className="card farm-state">
          <p>
            {gate && blocker
              ? `ไม่มีแมพไหนที่หลบได้ครบทุกตัวด้วย FLEE ${player.flee} — ติดบ่อยสุดที่ ${blocker} ลองเช็คค่า FLEE หรือเปิดดูแมพที่ถูกตัด`
              : 'ไม่มีแมพที่ผ่านตัวกรองที่ติ๊กไว้ ลองเอาติ๊กออก'}
          </p>
        </div>
      ) : (
        <RankedMaps maps={ranked} toCard={toCard} idPrefix="farm-afk" podiumTitle="3 แมพทิ้งบอทเก็บ EXP ที่ดีสุด" />
      )}
      {/* After the answer, not before it: the maps you cannot use are the
          explanation, not the result. */}
      {gate && <BlockedMaps blocked={blocked} />}

      <Caveat>
        แมพถูกตัดเมื่อมีมอนชนิดไหนก็ได้ในแมพ (รวม MVP) ตีคุณโดนเกิน {DODGE_CAP_RELAXED}% หรือเกิน {DODGE_CAP_STRICT}% ถ้าแมพมีมอนโจมตีก่อนหรือเป็นสายเวท
        หรือมอนตัวนั้นไม่มีค่า FLEE ในข้อมูล · ไม่รับรองว่ารอดทั้งคืน เพราะไม่มีข้อมูลความเร็วโจมตีของมอน ·
        สกิลเสี่ยงตัดสินจากชื่อสกิลในไฟล์เกม ไม่ใช่การทดสอบจริง · EXP/ชม. เป็น{KILL_RATE_DISCLAIMER}
      </Caveat>
    </>
  );
}

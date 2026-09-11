'use client';

// เก็บเลเวล: where to level by hand now. Maps with monsters near the player's
// level, by density without numbers or by EXP/hour with them. No safety gate:
// a player at the keyboard can walk away from what they cannot dodge.

import { useMemo } from 'react';
import Caveat from '@/components/Caveat';
import RankedMaps from './RankedMaps';
import { mapCardTags, mobsFigure, whole } from './card-helpers';
import { rankMaps, type RankedMap } from '@/lib/farm-engine/rank';
import { canRate } from '@/lib/farm-engine/basics';
import { KILL_RATE_DISCLAIMER } from '@/lib/kills-per-hour';
import type { FarmData, PlayerInput } from '@/lib/farm-engine/types';

export interface ViewProps {
  data: FarmData;
  player: PlayerInput;
  level: number;
  levelGuessed: boolean;
}

export default function LevelView({ data, player, level, levelGuessed }: ViewProps) {
  const { ranked } = useMemo(() => rankMaps(data, player, 'level', { level }), [data, player, level]);
  const rate = canRate(player);

  const toCard = (map: RankedMap) => ({
    code: map.code,
    name: map.name,
    image: map.image,
    channels: map.channels,
    headline:
      rate && map.perHour !== null
        ? { label: 'ได้ราว', value: whole(map.perHour), unit: ' EXP/ชม.' }
        : { label: 'เฉลี่ยตัวละ', value: whole(map.avgPerKill), unit: ' EXP' },
    stats: [mobsFigure(map)],
    monsters: map.top.map((t) => {
      const m = data.monsters[t.id];
      return { id: t.id, name: m.name, sprite: m.sprite, note: `Lv${m.level ?? '?'} · ${whole(t.value)} EXP ×${t.amount}` };
    }),
    tags: mapCardTags(map),
  });

  return (
    <>
      <p className="farm-summary">
        {levelGuessed ? (
          <>
            ยังไม่ได้กรอกเลเวล ใช้ <strong>Lv {level}</strong> ไปก่อน ·{' '}
          </>
        ) : (
          <>
            แมพสำหรับ <strong>Lv {level}</strong> ·{' '}
          </>
        )}
        {rate ? 'เรียงตาม EXP/ชม. ของคุณ' : 'เรียงตาม EXP ของมอนช่วงเลเวลคุณในแมพ · กรอกดาเมจกับ ASPD แล้วจะได้ EXP/ชม.'}
        <span className="farm-summary__rule"> · ไม่รวม {data.excluded.closedMaps} แมพที่ยังไม่เปิดในเซิร์ฟ</span>
      </p>

      {ranked.length === 0 ? (
        <div className="card farm-state">
          <p>ไม่มีแมพที่มีมอนช่วงเลเวลนี้ในข้อมูล ลองเปลี่ยนเลเวลในแถบด้านบน</p>
        </div>
      ) : (
        <RankedMaps maps={ranked} toCard={toCard} idPrefix="farm-level" podiumTitle="3 แมพเก็บเลเวลที่ดีสุด" />
      )}

      <Caveat>
        แมพที่ขึ้นต้องมีมอนห่างจากเลเวลคุณไม่เกิน 15 เลเวล · ไม่นับ MVP และมอนที่เกิดทีละตัว ·
        &ldquo;EXP/ชม.&rdquo; คิดว่าคุณตีมอนที่เดินชนตามสัดส่วนจำนวนตัวในแมพ ไม่ใช่ไล่ล่าตัวที่คุ้มสุดตัวเดียว และเป็น{KILL_RATE_DISCLAIMER} ·
        โอกาสตีโดนมาจากค่า hit_100 เทียบกับ HIT ที่กรอก (ไม่กรอก HIT = คิดว่าตีโดนทุกที) · ดาเมจใช้ตามที่กรอก ไม่ได้คูณธาตุ
      </Caveat>
    </>
  );
}

'use client';

// เก็บเลเวล: where to level by hand now. Maps with monsters the player can
// kill (near their level without numbers; within 15 hits with them), by
// density without numbers or by EXP/hour with them. No safety gate:
// a player at the keyboard can walk away from what they cannot dodge.

import { useMemo } from 'react';
import Caveat from '@/components/Caveat';
import RankedMaps from './RankedMaps';
import { levelWarningText, mapCardTags, mobsFigure, survivalFigures, whole } from './card-helpers';
import { rankMaps, type RankedMap } from '@/lib/farm-engine/rank';
import { canRate } from '@/lib/farm-engine/basics';
import type { BotSettings } from '@/lib/farm-engine/bot-session';
import type { FarmData, PlayerInput } from '@/lib/farm-engine/types';

export interface ViewProps {
  data: FarmData;
  player: PlayerInput;
  level: number;
  levelGuessed: boolean;
  /** The built-in bot's settings (overnight modes). */
  bot: BotSettings;
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
    stats: [mobsFigure(map), ...survivalFigures(map, { calm: true })],
    monsters: map.top.map((t) => {
      const m = data.monsters[t.id];
      return { id: t.id, name: m.name, sprite: m.sprite, note: `Lv${m.level ?? '?'} · ${whole(t.value)} EXP ×${t.amount}` };
    }),
    // Warnings, not removals: someone at the keyboard drinks and retreats.
    tags: [
      ...[...new Set(map.warnings.map((b) => `ระวัง: ${levelWarningText(b)}`))].slice(0, 2).map((text) => ({ tone: 'warn' as const, text })),
      ...mapCardTags(map),
    ],
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
        {rate ? 'เรียงตาม EXP/ชม. ของมอนที่คุณตีไหว' : 'เรียงตาม EXP ของมอนช่วงเลเวลคุณในแมพ · กรอกดาเมจกับ ASPD แล้วจะคิดจากมอนที่ตีไหวจริงเป็น EXP/ชม.'}
        <span className="farm-summary__rule"> · ไม่รวม {data.excluded.closedMaps} แมพที่ยังไม่เปิดในเซิร์ฟ</span>
      </p>

      {ranked.length === 0 ? (
        <div className="card farm-state">
          <p>{rate ? 'ไม่มีแมพที่มีมอนตีไหวในข้อมูล ลองเช็กดาเมจกับ HIT ในแถบด้านบน' : 'ไม่มีแมพที่มีมอนช่วงเลเวลนี้ในข้อมูล ลองเปลี่ยนเลเวลในแถบด้านบน'}</p>
        </div>
      ) : (
        <RankedMaps maps={ranked} toCard={toCard} idPrefix="farm-level" podiumTitle="3 แมพเก็บเลเวลที่ดีสุด" />
      )}

      <Caveat>
        เกมนี้ไม่หัก EXP ตามเลเวลที่ห่างกัน ตีมอนเลเวลสูงกว่าได้ EXP เต็ม · กรอกดาเมจแล้ว นับเฉพาะมอนที่ตีตายภายใน 15 ครั้งและตีโดนอย่างน้อย 70% เลเวลเท่าไรก็ได้ ·
        ไม่กรอกดาเมจ นับมอนตั้งแต่ต่ำกว่าคุณ 10 เลเวลถึงสูงกว่า 30 เลเวล (สูงเกิน 15 นับน้อยลง) · ไม่นับ MVP มินิบอส และมอนที่เกิดทีละตัว ·
        &ldquo;EXP/ชม.&rdquo; คิดว่าคุณตีมอนที่ตีไหวตามสัดส่วนจำนวนตัวในแมพ รวมเวลาหาตัวถัดไปแบบวาร์ปแล้วเดินหาบนจอ (วาร์ปทุก 5 วิถ้าไม่เจอ) ไม่รวมรอมอนเกิดใหม่และคนแย่งมอน
        ของจริงจึงน้อยกว่านี้ · กรอก FLEE กับ Max HP แล้วการ์ดจะบอกว่าต้องกดยาเท่าไร และเตือนแมพที่ตีเจ็บเกิน (ไม่ตัดออก เพราะเล่นเองกดยาและถอยได้) ·
        โอกาสตีโดนมาจากค่า hit_100 เทียบกับ HIT ที่กรอก (ไม่กรอก HIT = คิดว่าตีโดนทุกที) · ดาเมจใช้ตามที่กรอก ไม่ได้คูณธาตุ
      </Caveat>
    </>
  );
}

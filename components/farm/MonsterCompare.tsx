'use client';

// /database/monsters/compare: the monsters picked with the "+ เปรียบเทียบ"
// button, side by side (19 Oct 2026; was the farm tool's "รายการของฉัน" tab).
// The same character bar as the farm tool, so its numbers carry over.

import FarmNumbersBar from './FarmNumbersBar';
import PlanView from './PlanView';
import { useRememberedNumbers } from '@/components/ToolNumbers';
import { useFarmData } from '@/lib/use-farm-data';
import { useBotStyle } from '@/lib/use-bot-style';
import { useBotSettings } from '@/lib/use-bot-settings';
import { playerFromNumbers } from '@/lib/farm-engine/basics';
import { DEFAULT_LEVEL } from '@/lib/farm-engine/types';
import { useMemo } from 'react';

export default function MonsterCompare() {
  const farm = useFarmData();
  const [numbers, setNumbers] = useRememberedNumbers();
  const [style, setStyle] = useBotStyle();
  const [bot, setBot] = useBotSettings();
  const player = useMemo(() => playerFromNumbers(numbers, style), [numbers, style]);
  return (
    <>
      <FarmNumbersBar
        style={style}
        onStyle={setStyle}
        numbers={numbers}
        onNumbers={setNumbers}
        hints={[]}
        potions={farm.data?.potions ?? []}
        overnight={false}
        bot={bot}
        onBot={setBot}
      />
      {farm.failed && (
        <div className="card farm-state">
          <p>ดึงข้อมูลมอนไม่สำเร็จ</p>
          <button type="button" className="btn" onClick={farm.retry}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
      {!farm.data && !farm.failed && <p className="muted farm-state">กำลังโหลดข้อมูลมอน…</p>}
      {farm.data && (
        <PlanView data={farm.data} player={player} level={numbers.level ?? DEFAULT_LEVEL} levelGuessed={numbers.level === undefined} bot={bot} />
      )}
    </>
  );
}

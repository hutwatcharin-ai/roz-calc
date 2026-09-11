'use client';

// ฟาร์มที่ไหนดี: four modes, one bar, one payload, one rule library
// (docs/superpowers/specs/2026-09-11-farm-tool-integration-design.md).
//
//   เก็บเลเวล      where do I level by hand now
//   ทิ้งบอท AFK    where does a bot collect EXP overnight and survive
//   หาเงิน         where does a bot collect zeny overnight and survive
//   รายการของฉัน   compare the monsters I picked, EXP and zeny side by side

import { useEffect, useMemo, useState } from 'react';
import FarmNumbersBar from './FarmNumbersBar';
import LevelView from './LevelView';
import AfkView from './AfkView';
import ZenyView from './ZenyView';
import PlanView from './PlanView';
import { useRememberedNumbers } from '@/components/ToolNumbers';
import { useToolUse } from '@/lib/use-tool-use';
import { useFarmData } from '@/lib/use-farm-data';
import { useBotStyle } from '@/lib/use-bot-style';
import { canGate, canRate, playerFromNumbers } from '@/lib/farm-engine/basics';
import { DEFAULT_LEVEL, type PlayerInput } from '@/lib/farm-engine/types';

export type FarmMode = 'level' | 'afk' | 'zeny' | 'plan';

const MODES: { key: FarmMode; icon: string; label: string; blurb: string }[] = [
  { key: 'level', icon: '/images/items/607.gif', label: 'เก็บเลเวล', blurb: 'เล่นเองตอนนี้ ไปแมพไหน EXP ดี' },
  { key: 'afk', icon: '/images/items/610.gif', label: 'ทิ้งบอท AFK', blurb: 'ทิ้งบอทเก็บ EXP ข้ามคืน แมพไหนรอด' },
  { key: 'zeny', icon: '/images/items/909.gif', label: 'หาเงิน', blurb: 'ทิ้งบอทเก็บของไปขายร้าน NPC ข้ามคืน แมพไหนได้เงินมากสุด' },
  { key: 'plan', icon: '/images/items/512.gif', label: 'รายการของฉัน', blurb: 'เทียบมอนที่กด “เพิ่มเข้าแผน” ไว้ ทั้ง EXP และเงิน' },
];

/** What each mode would add if the player filled in more of the bar. */
function missingHints(mode: FarmMode, player: PlayerInput): string[] {
  const speed = player.style === 'magic' ? 'วินาทีต่อร่าย' : 'ASPD';
  const hints: string[] = [];
  if (!canRate(player)) {
    const unlock = mode === 'zeny' ? 'z/ชม.' : mode === 'plan' ? 'EXP/ชม. และ z/ชม.' : 'EXP/ชม.';
    hints.push(`ดาเมจ + ${speed} → ${unlock}`);
  }
  if ((mode === 'afk' || mode === 'zeny') && !canGate(player)) hints.push('FLEE → ตัดแมพที่หลบไม่พ้น');
  if (player.level === null) hints.push(mode === 'level' ? 'เลเวล → แมพช่วงของคุณ' : 'เลเวล → หักดรอปตามช่วงเลเวล');
  return hints;
}

export default function FarmTool({ initialMode, initialLevel }: { initialMode: FarmMode; initialLevel: number | null }) {
  const [mode, setMode] = useState<FarmMode>(initialMode);
  const [numbers, setNumbers, ready] = useRememberedNumbers();
  const [style, setStyle] = useBotStyle();
  const farm = useFarmData();

  const player = useMemo(() => playerFromNumbers(numbers, style), [numbers, style]);
  const level = numbers.level ?? initialLevel ?? DEFAULT_LEVEL;
  const levelGuessed = numbers.level === undefined && initialLevel === null;

  useToolUse(
    'leveling_spots',
    { mode, style, level: numbers.level, damage: numbers.damagePerHit, aspd: numbers.aspd, hit: numbers.hit, flee: numbers.flee },
    ready,
  );

  // Mode and level live in the URL so a link can point at them, without a
  // navigation that would reload the payload.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (mode === 'level') url.searchParams.delete('mode');
    else url.searchParams.set('mode', mode);
    if (numbers.level !== undefined) url.searchParams.set('level', String(numbers.level));
    window.history.replaceState(null, '', url.toString());
  }, [mode, numbers.level]);

  const hints = missingHints(mode, player);
  const viewProps = farm.data ? { data: farm.data, player, level, levelGuessed } : null;

  return (
    <>
      <FarmNumbersBar style={style} onStyle={setStyle} numbers={numbers} onNumbers={setNumbers} hints={hints} />

      <div className="modebar" role="tablist" aria-label="โหมดการค้นหา">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={mode === m.key}
            className={`modebar__tab${mode === m.key ? ' modebar__tab--on' : ''}`}
            onClick={() => setMode(m.key)}
          >
            <img src={m.icon} alt="" width={18} height={18} className="modebar__icon" />
            <span className="modebar__label">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="modebar__blurb">{MODES.find((m) => m.key === mode)?.blurb}</p>

      {farm.failed && (
        <div className="card farm-state">
          <p>ดึงข้อมูลแมพกับมอนไม่สำเร็จ ตัวเลขที่กรอกไว้ยังอยู่ครบ</p>
          <button type="button" className="btn" onClick={farm.retry}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
      {!farm.failed && !viewProps && <p className="muted farm-state">กำลังโหลดแมพกับมอน…</p>}

      {viewProps && mode === 'level' && <LevelView {...viewProps} />}
      {viewProps && mode === 'afk' && <AfkView {...viewProps} />}
      {viewProps && mode === 'zeny' && <ZenyView {...viewProps} />}
      {viewProps && mode === 'plan' && <PlanView {...viewProps} />}
    </>
  );
}

'use client';

// The one input bar for all four modes of the farm tool (decision 2 of the
// integration spec). Every field is optional. Once anything is filled it folds
// to a one-line summary, because four boxes sitting above the answer is what
// got the old character bar removed from the site on 4 Sep 2026.

import { useState } from 'react';
import ToolNumbers from '@/components/ToolNumbers';
import type { PlayerField, PlayerNumbers } from '@/lib/player-numbers';
import type { BotStyle } from '@/lib/farm-engine/types';

export const BAR_FIELDS: Record<BotStyle, PlayerField[]> = {
  melee: ['level', 'damagePerHit', 'aspd', 'hit', 'flee'],
  magic: ['level', 'damagePerHit', 'castSeconds', 'flee'],
};

function summary(style: BotStyle, numbers: PlayerNumbers): string[] {
  const parts = [style === 'magic' ? 'สายเวท' : 'สายตี'];
  if (numbers.level !== undefined) parts.push(`Lv ${numbers.level}`);
  if (numbers.damagePerHit !== undefined) parts.push(`ดาเมจ ${numbers.damagePerHit}`);
  if (style === 'melee' && numbers.aspd !== undefined) parts.push(`ASPD ${numbers.aspd}`);
  if (style === 'magic' && numbers.castSeconds !== undefined) parts.push(`${numbers.castSeconds} วิ/ร่าย`);
  if (style === 'melee' && numbers.hit !== undefined) parts.push(`HIT ${numbers.hit}`);
  if (numbers.flee !== undefined) parts.push(`FLEE ${numbers.flee}`);
  return parts;
}

export default function FarmNumbersBar({
  style,
  onStyle,
  numbers,
  onNumbers,
}: {
  style: BotStyle;
  onStyle: (style: BotStyle) => void;
  numbers: PlayerNumbers;
  onNumbers: (next: PlayerNumbers) => void;
}) {
  // Folded by default, filled or not. Opened, the five boxes took the whole
  // first screen of a 390px phone and pushed the mode tabs below it (dev
  // check, 11 Sep 2026) -- a visitor with no numbers saw a form, not an answer.
  const [expanded, setExpanded] = useState(false);
  const filled = BAR_FIELDS[style].some((field) => numbers[field] !== undefined);

  if (!expanded) {
    return (
      <div className="farmbar">
        <div className="farmbar__summary">
          {filled ? (
            <>
              <span>ตัวละคร</span>
              {summary(style, numbers).map((part) => (
                <strong key={part}>{part}</strong>
              ))}
            </>
          ) : (
            <span>ยังไม่ได้กรอกตัวเลขตัวละคร · ไม่กรอกก็ดูได้</span>
          )}
          <button type="button" className="btn farmbar__edit" onClick={() => setExpanded(true)}>
            {filled ? 'แก้ตัวเลข' : 'กรอกตัวเลข'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="farmbar">
      <div className="filterbar farmbar__style" role="radiogroup" aria-label="สายตี หรือ สายเวท">
        <label className="cvtoggle">
          <input type="radio" name="farm-style" checked={style === 'melee'} onChange={() => onStyle('melee')} />
          สายตี (ตีธรรมดา)
        </label>
        <label className="cvtoggle">
          <input type="radio" name="farm-style" checked={style === 'magic'} onChange={() => onStyle('magic')} />
          สายเวท (ร่ายสกิล)
        </label>
      </div>
      <ToolNumbers
        fields={BAR_FIELDS[style]}
        numbers={numbers}
        onChange={onNumbers}
        labels={{
          level: { unlocks: 'ช่วงเลเวล · หักดรอป' },
          damagePerHit: style === 'magic' ? { label: 'ดาเมจต่อร่าย', hint: 'เช่น 900', unlocks: 'ต่อชั่วโมง' } : { label: 'ดาเมจต่อที', hint: 'เช่น 400', unlocks: 'ต่อชั่วโมง' },
          aspd: { unlocks: 'ต่อชั่วโมง' },
          castSeconds: { unlocks: 'ต่อชั่วโมง' },
          flee: { unlocks: 'ตัดแมพที่หลบไม่พ้น' },
        }}
        note="ทุกช่องไม่บังคับ ใช้ร่วมกันทั้ง 4 โหมด"
      />
      <button type="button" className="btn" style={{ marginTop: 8 }} onClick={() => setExpanded(false)}>
        เสร็จ
      </button>
    </div>
  );
}

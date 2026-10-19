'use client';

// ฟาร์มที่ไหนดี: four modes, one bar, one payload, one rule library
// (docs/superpowers/specs/2026-09-11-farm-tool-integration-design.md).
//
//   เก็บเลเวล      where do I level by hand now
//   ทิ้งบอท AFK    where does a bot collect EXP overnight and survive
//   หาเงิน         where does a bot collect zeny overnight and survive
//
// The fourth mode, รายการของฉัน, became /database/monsters/compare on
// 19 Oct 2026.

import { useEffect, useMemo, useState } from 'react';
import FarmNumbersBar from './FarmNumbersBar';
import LevelView from './LevelView';
import AfkView from './AfkView';
import ZenyView from './ZenyView';
import { useRememberedNumbers } from '@/components/ToolNumbers';
import { useToolUse } from '@/lib/use-tool-use';
import { useFarmData } from '@/lib/use-farm-data';
import { useBotStyle } from '@/lib/use-bot-style';
import { useBotSettings } from '@/lib/use-bot-settings';
import { canRate, playerFromNumbers } from '@/lib/farm-engine/basics';
import { canSurvive } from '@/lib/farm-engine/survival';
import { DEFAULT_LEVEL, type PlayerInput } from '@/lib/farm-engine/types';

export type FarmMode = 'level' | 'afk' | 'zeny';

const MODES: { key: FarmMode; icon: string; label: string; blurb: string }[] = [
  { key: 'level', icon: '/images/items/607.gif', label: 'เก็บเลเวล', blurb: 'เล่นเองตอนนี้ ไปแมพไหน EXP ดี' },
  { key: 'afk', icon: '/images/items/610.gif', label: 'ทิ้งบอท AFK', blurb: 'ทิ้งบอทเก็บ EXP ข้ามคืน แมพไหนรอด' },
  { key: 'zeny', icon: '/images/items/909.gif', label: 'หาเงิน', blurb: 'ทิ้งบอทเก็บของไปขายร้าน NPC ข้ามคืน แมพไหนได้เงินมากสุด' },
];

/** What each mode would add if the player filled in more of the bar. */
function missingHints(mode: FarmMode, player: PlayerInput): string[] {
  const speed = player.style === 'magic' ? 'วินาทีต่อร่าย' : 'ASPD';
  const hints: string[] = [];
  if (!canRate(player)) {
    const unlock = mode === 'zeny' ? 'z/ชม.' : 'EXP/ชม.';
    hints.push(`ดาเมจ + ${speed} → ${unlock}`);
  }
  if ((mode === 'afk' || mode === 'zeny') && !canSurvive(player)) hints.push('Max HP + FLEE → บอทรอดทั้งคืนไหม ใช้ยากี่ขวด');
  if (player.level === null) hints.push(mode === 'level' ? 'เลเวล → แมพช่วงของคุณ' : 'เลเวล → หักดรอปตามช่วงเลเวล');
  return hints;
}

export default function FarmTool({ initialMode, initialLevel }: { initialMode: FarmMode; initialLevel: number | null }) {
  // The tab answers the tap at once; the results follow once it has been
  // painted. Ranking every map for the overnight modes takes seconds on a
  // phone, and a tab that did not light up until then read as a dead button
  // (owner, 19 Oct 2026). Not a React transition: a long ranking restarted
  // by any update that arrives meanwhile never finished on a slow phone.
  const [mode, setMode] = useState<FarmMode>(initialMode);
  const [tab, setTab] = useState<FarmMode>(initialMode);
  const switching = tab !== mode;
  useEffect(() => {
    if (tab === mode) return;
    let timer = 0;
    const frame = requestAnimationFrame(() => {
      timer = window.setTimeout(() => setMode(tab), 0);
    });
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [tab, mode]);
  const [numbers, setNumbers, ready] = useRememberedNumbers();
  const [style, setStyle] = useBotStyle();
  const [bot, setBot] = useBotSettings();
  const farm = useFarmData();

  const player = useMemo(() => playerFromNumbers(numbers, style), [numbers, style]);
  const level = numbers.level ?? initialLevel ?? DEFAULT_LEVEL;
  const levelGuessed = numbers.level === undefined && initialLevel === null;

  useToolUse(
    'leveling_spots',
    { mode, style, level: numbers.level, damage: numbers.damagePerHit, aspd: numbers.aspd, hit: numbers.hit, flee: numbers.flee, hp: numbers.maxHp, potion: numbers.potionId },
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
  const viewProps = farm.data ? { data: farm.data, player, level, levelGuessed, bot } : null;

  return (
    <>
      <FarmNumbersBar
        style={style}
        onStyle={setStyle}
        numbers={numbers}
        onNumbers={setNumbers}
        hints={hints}
        potions={farm.data?.potions ?? []}
        overnight={mode === 'afk' || mode === 'zeny'}
        bot={bot}
        onBot={setBot}
      />

      <div className="modebar" role="tablist" aria-label="โหมดการค้นหา">
        {MODES.map((m) => (
          <button
            key={m.key}
            type="button"
            role="tab"
            aria-selected={tab === m.key}
            className={`modebar__tab${tab === m.key ? ' modebar__tab--on' : ''}`}
            onClick={() => setTab(m.key)}
          >
            <img src={m.icon} alt="" width={18} height={18} className="modebar__icon" />
            <span className="modebar__label">{m.label}</span>
          </button>
        ))}
      </div>
      <p className="modebar__blurb" aria-live="polite">
        {MODES.find((m) => m.key === tab)?.blurb}
        {switching && <span className="muted"> · กำลังคำนวณ…</span>}
      </p>

      {farm.failed && (
        <div className="card farm-state">
          <p>ดึงข้อมูลแมพกับมอนไม่สำเร็จ ตัวเลขที่กรอกไว้ยังอยู่ครบ</p>
          <button type="button" className="btn" onClick={farm.retry}>
            ลองโหลดอีกครั้ง
          </button>
        </div>
      )}
      {/* A skeleton the size of a screenful of results, not a line of text:
          the answers arrive after the data does, and a one-line placeholder
          let them shove the explanation below down the page (CLS 0.24 on this
          page, 23 Sep 2026). The reserve cannot match every mode exactly, but
          it takes most of the movement out. */}
      {!farm.failed && !viewProps && (
        <div className="farm-skeleton" aria-hidden="true">
          <p className="muted farm-state">กำลังโหลดแมพกับมอน…</p>
          <span className="farm-skeleton__row farm-skeleton__row--tall" />
          <span className="farm-skeleton__row" />
          <span className="farm-skeleton__row" />
        </div>
      )}

      {viewProps && mode === 'level' && <LevelView {...viewProps} />}
      {viewProps && mode === 'afk' && <AfkView {...viewProps} />}
      {viewProps && mode === 'zeny' && <ZenyView {...viewProps} />}
    </>
  );
}

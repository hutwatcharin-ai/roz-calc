'use client';

// One tool, three questions -- "where do I level", "where can I leave the bot",
// "which of the monsters I picked pays best". They were three pages until
// 4 Sep 2026, running the same arithmetic (damage -> time per kill -> EXP per
// hour) behind three identical-looking forms; the only real differences are
// which monsters are in scope and how the result is grouped.
//
// The default mode asks for nothing but a level, so a player who just wants a
// suggestion gets one. Numbers turn the ranking from "how much EXP is on this
// map" into "how much of it you can actually collect per hour".

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LevelingSpots from '@/components/LevelingSpots';
import AfkFinderResults, { type AfkCandidate } from '@/components/AfkFinderResults';
import FarmPlannerBoard from '@/components/FarmPlannerBoard';
import CVariantToggle from '@/components/CVariantToggle';
import { loadAfkCandidates } from '@/lib/afk-candidates';
import type { Spot } from '@/lib/leveling-spots';

export type FarmMode = 'level' | 'afk' | 'plan';

// Icon + two or three words on the tab, and the sentence only under the tab
// you are on: three explanations stacked made the row taller than the first
// result it was meant to introduce.
const MODES: { key: FarmMode; icon: string; label: string; blurb: string }[] = [
  { key: 'level', icon: '/images/items/607.gif', label: 'เก็บเลเวล', blurb: 'แมพที่มีมอนช่วงเลเวลคุณ เรียงตาม EXP ที่เก็บได้' },
  { key: 'afk', icon: '/images/items/610.gif', label: 'ทิ้งบอท AFK', blurb: 'มอนที่ไม่โจมตีก่อนและคุณฆ่าได้ในหมัดเดียว' },
  { key: 'plan', icon: '/images/items/512.gif', label: 'รายการของฉัน', blurb: 'เฉพาะมอนที่กดปุ่ม “เพิ่มเข้าแผน” ไว้' },
];

export default function FarmSpots({
  spots,
  level,
  initialMode,
}: {
  spots: Spot[];
  level: number;
  initialMode: FarmMode;
}) {
  const [mode, setMode] = useState<FarmMode>(initialMode);
  const [afk, setAfk] = useState<{ rows: AfkCandidate[]; failed: boolean } | null>(null);
  const [afkLoading, setAfkLoading] = useState(false);

  // The AFK data is every monster's skills and every map's aggro census --
  // far more than the level window this page opens on. It loads when someone
  // asks for that mode, not before.
  useEffect(() => {
    if (mode !== 'afk' || afk !== null || afkLoading) return;
    setAfkLoading(true);
    loadAfkCandidates()
      .then(setAfk)
      .catch((err) => {
        console.error('afk candidates load failed', err);
        setAfk({ rows: [], failed: true });
      })
      .finally(() => setAfkLoading(false));
  }, [mode, afk, afkLoading]);

  // The mode lives in the URL so a link can point at one, without a navigation
  // that would throw away the numbers the form is holding.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (mode === 'level') url.searchParams.delete('mode');
    else url.searchParams.set('mode', mode);
    window.history.replaceState(null, '', url.toString());
  }, [mode]);

  return (
    <>
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

      {mode === 'level' && <LevelingSpots spots={spots} level={level} />}

      {mode === 'afk' && (
        <>
          <div style={{ marginBottom: 12 }}>
            <CVariantToggle mode="local" />
          </div>
          {afkLoading && <p className="muted">กำลังโหลดข้อมูลมอนกับสกิล…</p>}
          {afk?.failed && <p className="muted">ดึงข้อมูลไม่สำเร็จ ลองใหม่อีกครั้ง</p>}
          {afk && !afk.failed && <AfkFinderResults rows={afk.rows} />}
        </>
      )}

      {mode === 'plan' && (
        <>
          <p className="muted" style={{ marginBottom: 12 }}>
            กดปุ่ม &ldquo;เพิ่มเข้าแผน&rdquo; ที่หน้ามอนหรือหน้าแรกเพื่อใส่ชื่อเข้ามาที่นี่ ·{' '}
            <Link href="/database/monsters">เปิดฐานข้อมูลมอนสเตอร์</Link>
          </p>
          <FarmPlannerBoard />
        </>
      )}
    </>
  );
}

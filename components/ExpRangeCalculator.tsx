'use client';

// "From here to there, how much EXP is that?" The guide prints one bar per
// level and never a total, so anyone planning a climb has been adding fifty
// numbers by hand.
//
// Redesigned 15 Oct 2026 (owner: "make the EXP page easier to read"): it is
// the first thing on the page now, as one arcade panel. Quick buttons for the
// usual targets, and an optional EXP-per-hour box that turns the total into
// hours. Up to the level cap: past 50 the rows are roztoday's unconfirmed
// figures, and the result says so.

import { useMemo, useState } from 'react';
import { MAX_ANY_SOURCE_LEVEL, MAX_PUBLISHED_BASE_LEVEL, totalExpBetweenAnySource } from '@/lib/exp-table';

const LEVELS = Array.from({ length: MAX_ANY_SOURCE_LEVEL }, (_, i) => i + 1);
const num = (n: number) => Math.round(n).toLocaleString('en-US');

function hoursText(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))} นาที`;
  if (h < 48) return `${h < 10 ? h.toFixed(1) : Math.round(h)} ชม.`;
  return `${Math.round(h / 24)} วัน (${num(h)} ชม.)`;
}

export default function ExpRangeCalculator() {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(30);
  const [rate, setRate] = useState('');

  const result = useMemo(() => totalExpBetweenAnySource(from, to), [from, to]);
  const total = result?.total ?? null;
  const levels = to - from;
  const perHour = Number(rate.replace(/[,\s]/g, ''));
  const hours = total !== null && perHour > 0 ? total / perHour : null;
  const lastBar = totalExpBetweenAnySource(to - 1, to)?.total ?? null;

  const pickFrom = (n: number) => {
    setFrom(n);
    if (to <= n) setTo(Math.min(MAX_ANY_SOURCE_LEVEL, n + 1));
  };
  const chips: [string, number][] = [
    ['+1 เลเวล', Math.min(MAX_ANY_SOURCE_LEVEL, from + 1)],
    ['+5 เลเวล', Math.min(MAX_ANY_SOURCE_LEVEL, from + 5)],
    ['ถึง 50', 50],
    ['ถึง 60', 60],
    ['ถึง 70', 70],
  ];

  return (
    <section className="expcalc" aria-labelledby="expcalc-h">
      <p className="expcalc__kicker" aria-hidden="true">▶ EXP CALCULATOR</p>
      <h2 id="expcalc-h" className="expcalc__title">จากเลเวลนี้ ไปเลเวลนั้น ใช้ EXP เท่าไร</h2>

      <div className="expcalc__pick">
        <label>
          <span>ตอนนี้เลเวล</span>
          <select value={from} onChange={(e) => pickFrom(Number(e.target.value))}>
            {LEVELS.slice(0, -1).map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <span className="expcalc__arrow" aria-hidden="true">→</span>
        <label>
          <span>อยากได้เลเวล</span>
          <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {LEVELS.map((n) => <option key={n} value={n} disabled={n <= from}>{n}</option>)}
          </select>
        </label>
      </div>
      <div className="expcalc__chips" role="group" aria-label="เลือกเป้าหมายเร็ว">
        {chips.map(([label, n]) => (
          <button key={label} type="button" disabled={n <= from} aria-pressed={to === n} onClick={() => setTo(n)}>
            {label}
          </button>
        ))}
      </div>

      <div className="expcalc__result" aria-live="polite">
        <span className="expcalc__k">EXP ที่ต้องเก็บ (เลเวล {from} → {to})</span>
        <strong className="expcalc__big">{total === null ? '—' : num(total)}</strong>
        {result?.secondSource && (
          <span className="expcalc__warn">
            เลเวลเกิน {MAX_PUBLISHED_BASE_LEVEL} ใช้ตัวเลขแหล่งรอง ยังไม่ยืนยันในเกม · <a href="#exp-table">ดูตาราง</a>
          </span>
        )}
      </div>

      <dl className="expcalc__facts">
        <div><dt>ขึ้นทั้งหมด</dt><dd>{levels > 0 ? `${levels} เลเวล` : '—'}</dd></div>
        <div><dt>เฉลี่ยต่อเลเวล</dt><dd>{total !== null && levels > 0 ? num(total / levels) : '—'}</dd></div>
        <div><dt>ใบสุดท้าย ({to - 1} → {to})</dt><dd>{lastBar === null ? '—' : num(lastBar)}</dd></div>
      </dl>

      <label className="expcalc__rate">
        <span>ได้ EXP ชั่วโมงละเท่าไร <i>(ไม่ใส่ก็ได้)</i></span>
        <input inputMode="numeric" placeholder="เช่น 2,000,000" value={rate} onChange={(e) => setRate(e.target.value)} />
      </label>
      {hours !== null && (
        <p className="expcalc__time">
          ใช้เวลาประมาณ <strong>{hoursText(hours)}</strong> ถ้าได้ EXP เท่านี้ทุกชั่วโมง
        </p>
      )}
      <p className="expcalc__note">แถบ EXP รีเซ็ตเป็น 0 ทุกครั้งที่ขึ้นเลเวล ตัวเลขนี้คือผลรวมของทุกแถบระหว่างทาง นับจากแถบว่างที่เลเวล {from}</p>
    </section>
  );
}

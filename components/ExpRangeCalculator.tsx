'use client';

// "From here to there, how much EXP is that?" The guide prints one bar per
// level and never a total, so anyone planning a climb has been adding fifty
// numbers by hand.

import { useMemo, useState } from 'react';
import { MAX_ANY_SOURCE_LEVEL, MAX_PUBLISHED_BASE_LEVEL, totalExpBetweenAnySource } from '@/lib/exp-table';

// Up to the level cap (owner, 15 Oct 2026): past 50 the rows are roztoday's
// unconfirmed figures, and the result says so.
const LEVELS = Array.from({ length: MAX_ANY_SOURCE_LEVEL }, (_, i) => i + 1);

export default function ExpRangeCalculator() {
  const [from, setFrom] = useState(1);
  const [to, setTo] = useState(30);

  // A "to" below "from" is a state the selects allow, so it is handled rather
  // than prevented -- the answer is simply that there is nothing to climb.
  const result = useMemo(() => totalExpBetweenAnySource(from, to), [from, to]);
  const total = result?.total ?? null;
  const perLevel = to > from ? (total ?? 0) / (to - from) : null;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 className="section-title">จากเลเวลนี้ไปเลเวลนั้น ใช้ EXP เท่าไร</h2>

      <form className="controlrow" onSubmit={(e) => e.preventDefault()}>
        <label>
          ตอนนี้เลเวล
          <select value={from} onChange={(e) => setFrom(Number(e.target.value))}>
            {LEVELS.map((n) => (
              <option key={n} value={n} disabled={n >= to}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          อยากได้เลเวล
          <select value={to} onChange={(e) => setTo(Number(e.target.value))}>
            {LEVELS.map((n) => (
              <option key={n} value={n} disabled={n <= from}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </form>

      <table className="stat-table" style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <td>
              <strong>
                EXP รวมจาก {from} ถึง {to}
              </strong>
            </td>
            <td className="num">
              {total === null ? (
                <span className="muted">เลือกเลเวลปลายทางให้สูงกว่าเลเวลตอนนี้</span>
              ) : (
                <strong>{total.toLocaleString('en-US')}</strong>
              )}
            </td>
          </tr>
          <tr>
            <td>เฉลี่ยต่อเลเวล</td>
            <td className="num">
              {perLevel === null ? '—' : Math.round(perLevel).toLocaleString('en-US')}
            </td>
          </tr>
          <tr>
            <td>บาร์เลเวลสุดท้ายก่อนถึง {to}</td>
            <td className="num">
              {totalExpBetweenAnySource(to - 1, to)?.total.toLocaleString('en-US') ?? '—'}
            </td>
          </tr>
        </tbody>
      </table>

      {result?.secondSource && (
        <p className="filterstate" style={{ marginTop: 10 }}>
          เลเวลเกิน {MAX_PUBLISHED_BASE_LEVEL} ใช้ตัวเลขจากแหล่งรอง (roztoday) ยังไม่ยืนยันในเกม · <a href="#exp-60-70">ดูตาราง</a>
        </p>
      )}
      <p className="muted" style={{ marginTop: 10 }}>
        นับจากแถบ EXP ว่างที่เลเวล {from} · แถบรีเซ็ตเป็น 0 ทุกครั้งที่ขึ้นเลเวล
        ตัวเลขนี้จึงเป็นผลรวมของแถบทุกใบระหว่างทาง
      </p>
    </div>
  );
}

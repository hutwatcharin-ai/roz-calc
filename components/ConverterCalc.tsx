'use client';

// How much to farm for N converters of each element (/guides/elemental-converter).
// One converter = 1 Empty Scroll + 3 of the element's material, so the sums
// are exact; the kill count is an average from the best dropper's rate.

import { useState } from 'react';

export interface ConverterCalcRow {
  key: string;
  th: string;
  color: string;
  productId: number;
  matId: number;
  matName: string;
  /** Best open-map dropper's rate in %, null when unknown. */
  rate: number | null;
  monster: string | null;
}

const PRESETS = [0, 5, 10, 30, 50];

export default function ConverterCalc({ rows }: { rows: ConverterCalcRow[] }) {
  const [count, setCount] = useState<Record<string, number>>(() => Object.fromEntries(rows.map((r) => [r.key, 0])));
  const set = (key: string, n: number) => setCount((c) => ({ ...c, [key]: Math.max(0, Math.min(999, Math.round(n) || 0)) }));
  const scrolls = rows.reduce((s, r) => s + count[r.key], 0);

  return (
    <div className="ccalc">
      <div className="ccalc__rows">
        {rows.map((r) => {
          const n = count[r.key];
          const mats = n * 3;
          const kills = r.rate ? Math.ceil((mats * 100) / r.rate) : null;
          return (
            <div key={r.key} className={`ccalc__row${n ? ' is-on' : ''}`} style={{ '--el': r.color } as React.CSSProperties}>
              <span className="ccalc__el">
                <img src={`/images/items/${r.productId}.gif`} alt="" width={24} height={24} />
                ใบ{r.th}
              </span>
              <span className="ccalc__step">
                <button type="button" onClick={() => set(r.key, n - 1)} aria-label={`ลดใบ${r.th}`}>−</button>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={999}
                  value={n}
                  onChange={(e) => set(r.key, Number(e.target.value))}
                  aria-label={`จำนวนใบ${r.th}`}
                />
                <button type="button" onClick={() => set(r.key, n + 1)} aria-label={`เพิ่มใบ${r.th}`}>+</button>
              </span>
              <span className="ccalc__presets">
                {PRESETS.map((p) => (
                  <button key={p} type="button" className={n === p ? 'is-on' : ''} onClick={() => set(r.key, p)}>
                    {p}
                  </button>
                ))}
              </span>
              <span className="ccalc__need">
                {n ? (
                  <>
                    <img src={`/images/items/${r.matId}.gif`} alt="" width={20} height={20} />
                    {r.matName} <b>×{mats}</b>
                    {kills !== null && r.monster && (
                      <small>
                        ตี {r.monster} ราว {kills.toLocaleString('en-US')} ตัว
                      </small>
                    )}
                  </>
                ) : (
                  <span className="muted">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
      <p className="ccalc__total">
        <img src="/images/items/7433.gif" alt="" width={20} height={20} />
        Empty Scroll รวม <b>×{scrolls}</b>
        {scrolls > 0 && <span className="muted"> · ใช้ได้รวม {scrolls * 20} นาที ({(scrolls / 3).toFixed(1)} ชม.)</span>}
      </p>
    </div>
  );
}

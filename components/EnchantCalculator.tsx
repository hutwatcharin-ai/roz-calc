'use client';

// "กี่ครั้งถึงจะได้" for memorial-gear enchanting.
//
// The rate table was already on /guides/memorial-gear, and a rate on its own
// does not answer the question players ask before walking to the NPC. This
// turns one row of that table into tries and Zeny.
//
// It refuses to answer for a roll the slot cannot produce: the table writes
// those as "—", never 0%, and a calculator that returned "infinite tries"
// would be pretending the roll exists.
//
// Pictures (owner, 8 Oct 2026, "easy to read"): the piece as icons, every
// roll as a bar you can pick, a hundred-try grid, the chance-by-tries curve,
// and a "try it" button that rolls the real table.

import { useMemo, useState } from 'react';
import Caveat from '@/components/Caveat';
import { useToolUse } from '@/lib/use-tool-use';
import { chanceWithin, planFor } from '@/lib/enchant-odds';
import type { EnchantOutcome } from '@/lib/memorial-gear';

type Slot = 'armor' | 'garment' | 'shoes';

const SLOT_LABELS: Record<Slot, string> = { armor: 'เกราะ', garment: 'ผ้าคลุม', shoes: 'รองเท้า' };
// The Subjugation set's pieces stand for the slot.
const SLOT_ICON: Record<Slot, string> = { armor: '/images/items/15220.gif', garment: '/images/items/20867.gif', shoes: '/images/items/22150.gif' };

function zeny(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('en-US')} Zeny`;
}

function tries(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('en-US')} ครั้ง`;
}

export default function EnchantCalculator({
  outcomes,
  zenyPerTry,
}: {
  outcomes: EnchantOutcome[];
  zenyPerTry: number;
}) {
  const [slot, setSlot] = useState<Slot>('armor');
  const [pick, setPick] = useState(0);
  const [count, setCount] = useState(20);

  const available = useMemo(
    () => outcomes.map((o, i) => ({ ...o, index: i })).filter((o) => o[slot] != null),
    [outcomes, slot],
  );
  // Changing the piece can drop the chosen roll off the list, so the choice
  // falls back to the first one the new piece can actually give.
  const chosen = available.find((o) => o.index === pick) ?? available[0];
  const rate = chosen ? chosen[slot] : null;
  const plan = useMemo(() => planFor(rate ?? 0, count, zenyPerTry), [rate, count, zenyPerTry]);
  const top = Math.max(...available.map((o) => o[slot] ?? 0));

  useToolUse('enchant', { slot, stat: chosen ? `${chosen.stat} ${chosen.value}` : '', count });

  return (
    <div className="card enchcalc">
      {/* 1. The piece, as pictures. */}
      <div className="enchpieces" role="radiogroup" aria-label="ใส่ที่">
        {(Object.keys(SLOT_LABELS) as Slot[]).map((s) => (
          <button key={s} type="button" role="radio" aria-checked={slot === s} className={`enchpiece${slot === s ? ' is-on' : ''}`} onClick={() => setSlot(s)}>
            <img src={SLOT_ICON[s]} alt="" width={36} height={36} />
            <span>{SLOT_LABELS[s]}</span>
          </button>
        ))}
      </div>

      {/* 2. Every roll this piece can give, as a bar; pick the one you want. */}
      <p className="enchsub">ได้อะไรบ้าง และโอกาสเท่าไร · กดเลือกตัวที่อยากได้</p>
      <ul className="enchbars" role="radiogroup" aria-label="อยากได้">
        {available.map((o) => {
          const r = o[slot] ?? 0;
          const on = o.index === chosen?.index;
          return (
            <li key={o.index}>
              <button type="button" role="radio" aria-checked={on} className={`enchbar${on ? ' is-on' : ''}`} onClick={() => setPick(o.index)}>
                <span className="enchbar__name">{o.stat} <b>{o.value}</b></span>
                <span className="enchbar__track"><i style={{ width: `${(r / top) * 100}%` }} /></span>
                <span className="enchbar__pct mono">{r.toFixed(2)}%</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="enchcalc__out">
        {/* 3. One in how many: a hundred tries, the hits lit. */}
        <div className="enchgrid-wrap">
          <div className="enchgrid" aria-hidden="true">
            {Array.from({ length: 100 }, (_, i) => (
              <i key={i} className={i < Math.round(rate ?? 0) ? 'is-hit' : undefined} />
            ))}
          </div>
          <p className="enchgrid__cap">
            ลอง 100 ครั้ง ได้ <b>{chosen?.stat} {chosen?.value}</b> ราว <b className="mono">{(rate ?? 0).toFixed(1)}</b> ครั้ง
            <span>เฉลี่ยลอง {tries(plan.expectedTries)} ถึงจะติด 1 ครั้ง · {zeny(plan.expectedZeny)}</span>
          </p>
        </div>

        <div className="enchcalc__big">
          <label className="enchcount">
            ถ้าลอง
            <input type="number" min={1} max={999} value={count} onChange={(e) => setCount(Math.max(1, Math.min(999, Number(e.target.value) || 1)))} />
            ครั้ง ({zeny(count * zenyPerTry)})
          </label>
          <span className="enchcalc__label">โอกาสได้อย่างน้อยหนึ่งครั้ง</span>
          <strong>{plan.withinPct.toFixed(1)}%</strong>
        </div>
      </div>

      {/* 4. The chance as you keep trying, with the half and nine-in-ten marks. */}
      {Number.isFinite(plan.triesFor90) && <TriesCurve rate={rate ?? 0} count={count} t50={plan.triesFor50} t90={plan.triesFor90} />}

      {/* 5. Try it on the real table. */}
      <TryEnchant key={`${slot}|${chosen?.index}`} slot={slot} outcomes={available} wanted={chosen?.index ?? -1} zenyPerTry={zenyPerTry} />

      <Caveat>
        นับเฉพาะ<strong>ค่าใส่เอนแชนต์</strong>ครั้งละ {zenyPerTry.toLocaleString('en-US')} Zeny ·
        ถ้าของมีเอนแชนต์อยู่แล้วต้องถอดก่อน ซึ่งเป็นค่าใช้จ่ายคนละก้อนและ<strong>ถอดด้วยเงินมีโอกาสของหาย 30%</strong> ·
        &quot;เฉลี่ย&quot; คือค่าเฉลี่ยระยะยาว ไม่ใช่จำนวนครั้งที่การันตี
      </Caveat>
    </div>
  );
}

function TriesCurve({ rate, count, t50, t90 }: { rate: number; count: number; t50: number; t90: number }) {
  const max = Math.min(300, Math.max(10, Math.ceil(Math.max(t90, count) * 1.2)));
  const W = 600;
  const H = 150;
  const pad = 30;
  const x = (n: number) => pad + ((W - pad - 10) * (n - 1)) / Math.max(1, max - 1);
  const y = (p: number) => H - 20 - ((H - 35) * p) / 100;
  const step = Math.max(1, Math.floor(max / 120));
  const pts: string[] = [];
  for (let n = 1; n <= max; n += step) pts.push(`${x(n)},${y(chanceWithin(rate, n))}`);
  const marks: [number, string][] = [[t50, '50%'], [t90, '90%'], [count, 'ที่คุณตั้ง']];
  return (
    <figure className="enchcurve">
      <figcaption>ยิ่งลองหลายครั้ง โอกาสได้ยิ่งสูง</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`ลอง ${t50} ครั้งมีโอกาส 50% ลอง ${t90} ครั้งมีโอกาส 90%`}>
        {[50, 90].map((p) => <line key={p} x1={pad} x2={W - 10} y1={y(p)} y2={y(p)} className="enchcurve__guide" />)}
        <polyline points={pts.join(' ')} className="enchcurve__line" />
        {marks.map(([n, label], i) => n <= max && (
          <g key={label}>
            <circle cx={x(n)} cy={y(chanceWithin(rate, n))} r={5} className={i === 2 ? 'enchcurve__you' : 'enchcurve__dot'} />
            <text x={x(n)} y={y(chanceWithin(rate, n)) + (i === 2 ? 18 : -9)} className={i === 2 ? 'enchcurve__youlabel' : 'enchcurve__label'}>
              {n} ครั้ง → {i === 2 ? `${chanceWithin(rate, n).toFixed(0)}%` : label}
            </text>
          </g>
        ))}
        <text x={pad} y={H - 4} className="enchcurve__axis">1 ครั้ง</text>
        <text x={W - 10} y={H - 4} className="enchcurve__axis" textAnchor="end">{max} ครั้ง</text>
      </svg>
    </figure>
  );
}

type Rolled = { index: number; stat: string; value: string };

function TryEnchant({ slot, outcomes, wanted, zenyPerTry }: { slot: Slot; outcomes: (EnchantOutcome & { index: number })[]; wanted: number; zenyPerTry: number }) {
  const [tries, setTries] = useState(0);
  const [last, setLast] = useState<Rolled | null>(null);
  const [got, setGot] = useState(false);
  const [flash, setFlash] = useState(0);

  function rollOnce(): Rolled {
    // The table's rates for this piece add up to 100%.
    let r = Math.random() * 100;
    for (const o of outcomes) {
      r -= o[slot] ?? 0;
      if (r < 0) return { index: o.index, stat: o.stat, value: o.value };
    }
    const o = outcomes[outcomes.length - 1];
    return { index: o.index, stat: o.stat, value: o.value };
  }
  function once() {
    const r = rollOnce();
    setTries((t) => t + 1);
    setLast(r);
    if (r.index === wanted) setGot(true);
    setFlash((f) => f + 1);
  }
  function untilGot() {
    let n = 0;
    let r = rollOnce();
    n += 1;
    while (r.index !== wanted && n < 10000) {
      r = rollOnce();
      n += 1;
    }
    setTries((t) => t + n);
    setLast(r);
    setGot(r.index === wanted);
    setFlash((f) => f + 1);
  }
  function reset() {
    setTries(0);
    setLast(null);
    setGot(false);
  }
  const hit = last && last.index === wanted;
  return (
    <section className="enchtry" aria-labelledby="enchtry-h">
      <h3 id="enchtry-h" className="enchtry__h">ลองเอนแชนต์ดู · สุ่มตามตารางจริง</h3>
      <div className="enchtry__stage">
        <div key={flash} className={`enchtry__piece${last ? (hit ? ' is-hit' : ' is-miss') : ''}`}>
          <img src={SLOT_ICON[slot]} alt="" width={48} height={48} />
        </div>
        <p className={`enchtry__msg${hit ? ' is-hit' : ''}`} aria-live="polite">
          {last ? (hit ? `ได้แล้ว! ${last.stat} ${last.value}` : `ได้ ${last.stat} ${last.value}`) : 'กดลองได้เลย'}
        </p>
      </div>
      <p className="enchtry__score mono">ลองไป {tries.toLocaleString('en-US')} ครั้ง · เสีย {zeny(tries * zenyPerTry)}{got ? ' · ได้ตัวที่อยากได้แล้ว' : ''}</p>
      <div className="enchtry__btns">
        <button type="button" className="btn" onClick={once}>ลอง 1 ครั้ง</button>
        <button type="button" className="btn" onClick={untilGot}>ลองจนได้</button>
        <button type="button" className="enchtry__reset" onClick={reset}>เริ่มใหม่</button>
      </div>
    </section>
  );
}

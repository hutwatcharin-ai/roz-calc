'use client';

// The refine cost calculator.
//
// The guide gives one number per step and stops. This turns that into the
// number a player actually needs before walking to the NPC: how many spare
// pieces of equipment to bring, and how much Zeny the failures will eat.
//
// The owner's pass of 8 Oct 2026 added: HD ore (falls one level instead of
// breaking, +7 to +9 only), the player's own prices (item, cards, ore per
// attempt), the three ores side by side, and pictures -- the refine ladder,
// the pile of broken items, the chance by number of items, and a "try it"
// anvil that rolls the real chances.

import Caveat from '@/components/Caveat';
import { useMemo, useState } from 'react';
import { useToolUse } from '@/lib/use-tool-use';
import { HD_FEE_ZENY, HD_FROM, HD_TO, chanceWithItems, oreAt, refineCost, refinePlan, type OreMode } from '@/lib/refine-cost';
import { GEAR_LABELS, GEAR_TYPES, MAX_REFINE, ORE, chanceAt, type GearType } from '@/lib/refine-table';

const LEVELS = Array.from({ length: MAX_REFINE }, (_, i) => i + 1);
const ICON: Record<GearType, string> = {
  weapon1: '/images/items/1201.gif',
  weapon2: '/images/items/1101.gif',
  weapon3: '/images/items/1101.gif',
  weapon4: '/images/items/1101.gif',
  armour: '/images/items/2302.gif',
};
const ORE_ICON: Record<GearType, string> = {
  weapon1: '/images/items/1010.gif',
  weapon2: '/images/items/1011.gif',
  weapon3: '/images/items/984.gif',
  weapon4: '/images/items/984.gif',
  armour: '/images/items/985.gif',
};

function zeny(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} Zeny`;
}

/** One decimal below ten, none above: "1.8 ชิ้น" is useful, "1,284.3 ชิ้น" is noise. */
function count(value: number): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 100) return Math.round(value).toLocaleString('en-US');
  if (value >= 10) return value.toFixed(1);
  return value.toFixed(2);
}

function band(chance: number): string {
  if (chance >= 90) return 'is-safe';
  if (chance >= 50) return 'is-ok';
  if (chance >= 20) return 'is-risky';
  return 'is-cliff';
}

function modeLabel(gear: GearType, mode: OreMode): string {
  if (mode === 'hd') return `HD ช่วง +${HD_FROM}→+${HD_TO + 1}`;
  return mode === 'special' ? ORE[gear].special?.ore ?? '' : ORE[gear].normal.ore;
}

/** A number input for Zeny that keeps 0 for an empty box. */
function ZenyInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label>
      {label}
      <input
        className="mono"
        type="number"
        inputMode="numeric"
        min={0}
        step={1000}
        value={value || ''}
        placeholder="0"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}

export default function RefineCalculator() {
  const [gear, setGear] = useState<GearType>('weapon3');
  const [target, setTarget] = useState(7);
  const [from, setFrom] = useState(0);
  const [mode, setMode] = useState<OreMode>('normal');
  const [itemPrice, setItemPrice] = useState(0);
  const [cardPrice, setCardPrice] = useState(0);
  const [orePrice, setOrePrice] = useState(0);
  useToolUse('refine', { gear, target, from, mode });

  const hasSpecial = ORE[gear].special !== null;
  // Changing the equipment type can leave the start above the target, so the
  // start is clamped here rather than letting the maths throw at the user.
  const start = Math.min(from, target - 1);
  const hdUseful = target > HD_FROM && start <= HD_TO;
  const modes: OreMode[] = ['normal', ...(hasSpecial ? (['special'] as const) : []), ...(hdUseful ? (['hd'] as const) : [])];
  const useMode: OreMode = modes.includes(mode) ? mode : 'normal';

  const plans = useMemo(
    () => Object.fromEntries(modes.map((m) => [m, refinePlan(gear, target, m, start)])) as Record<OreMode, ReturnType<typeof refinePlan>>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gear, target, start, modes.join()],
  );
  const plan = plans[useMode];
  // The break-only modes have the closed form, with medians and the curve.
  const closed = useMemo(() => (useMode === 'hd' ? null : refineCost(gear, target, useMode === 'special', start)), [gear, target, start, useMode]);
  const best = modes.reduce((a, b) => (plans[b].expectedItems < plans[a].expectedItems ? b : a), modes[0]);
  const broken = Math.max(0, plan.expectedItems - 1);
  const total = plan.expectedFeeZeny + plan.expectedAttempts * orePrice + broken * (itemPrice + cardPrice);

  // The ladder: each step's chance, and how far one item tends to get.
  const steps = Array.from({ length: target - start }, (_, i) => {
    const level = start + i + 1;
    const ore = oreAt(useMode, level - 1);
    return { level, chance: chanceAt(gear, level, ore === 'special' && hasSpecial), hd: ore === 'hd' };
  });

  return (
    <div className="card refcalc" style={{ marginTop: 16 }}>
      <h2 className="section-title">ตีถึง +{target} ต้องเตรียมเท่าไร</h2>

      {/* The number first, the controls that produced it second. */}
      <div className="answer">
        <span className="answer__value">{count(plan.expectedItems)}</span>
        <span className="answer__unit">ชิ้น โดยเฉลี่ย</span>
      </div>
      <p className="answer__caption">
        {closed ? (
          <>
            เตรียม {closed.itemsFor50} ชิ้นสำเร็จ 50%
            {Number.isFinite(closed.itemsFor90) && ` · ${closed.itemsFor90} ชิ้นสำเร็จ 90%`} ·
            ของ 1 ชิ้นรอดถึง +{target} {closed.runChance.toFixed(closed.runChance < 1 ? 3 : 1)}%
          </>
        ) : (
          <>ใช้แร่ HD ช่วง +{HD_FROM} ถึง +{HD_TO}: พลาดแล้วลด 1 ขั้น ไม่พัง · ตีด้วย HD เฉลี่ย {count(plan.expectedHdAttempts)} ครั้ง</>
        )}
      </p>

      <form className="controlrow" onSubmit={(e) => e.preventDefault()}>
        <label>
          อุปกรณ์
          <select value={gear} onChange={(e) => setGear(e.target.value as GearType)}>
            {GEAR_TYPES.map((key) => (
              <option key={key} value={key}>
                {GEAR_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
        <label>
          ตอนนี้ +
          <select value={start} onChange={(e) => setFrom(Number(e.target.value))}>
            {[0, ...LEVELS.slice(0, MAX_REFINE - 1)].map((n) => (
              <option key={n} value={n} disabled={n >= target}>
                +{n}
              </option>
            ))}
          </select>
        </label>
        <label>
          อยากได้ +
          <select value={target} onChange={(e) => setTarget(Number(e.target.value))}>
            {LEVELS.map((n) => (
              <option key={n} value={n} disabled={n <= start}>
                +{n}
              </option>
            ))}
          </select>
        </label>
        <label>
          แร่
          <select value={useMode} onChange={(e) => setMode(e.target.value as OreMode)}>
            {modes.map((m) => (
              <option key={m} value={m}>
                {modeLabel(gear, m)}
              </option>
            ))}
          </select>
        </label>
      </form>

      {/* The pile of items this costs: the one you keep, lit; the rest cracked. */}
      <BurnPile gear={gear} items={plan.expectedItems} />

      <Ladder steps={steps} start={start} />

      {/* The ores side by side, best first marked. */}
      {modes.length > 1 && (
        <table className="stat-table refcalc__compare">
          <thead>
            <tr>
              <th scope="col">แร่</th>
              <th scope="col">ของที่ใช้</th>
              <th scope="col">ตีกี่ครั้ง</th>
              <th scope="col">ค่าตี</th>
            </tr>
          </thead>
          <tbody>
            {modes.map((m) => (
              <tr key={m} className={m === useMode ? 'is-on' : undefined}>
                <th scope="row">
                  {modeLabel(gear, m)}
                  {m === best && <span className="refcalc__best">ใช้ของน้อยสุด</span>}
                </th>
                <td className="num">{count(plans[m].expectedItems)} ชิ้น</td>
                <td className="num">{count(plans[m].expectedAttempts)}</td>
                <td className="num">{zeny(plans[m].expectedFeeZeny)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* The player's own prices: the guide prices nothing but the fee. */}
      <h3 className="refcalc__h">ใส่ราคาของคุณ ดูเงินที่น่าจะหมด</h3>
      <form className="controlrow" onSubmit={(e) => e.preventDefault()}>
        <ZenyInput label="ราคาของ 1 ชิ้น" value={itemPrice} onChange={setItemPrice} />
        <ZenyInput label="การ์ดที่ใส่ไว้ (รวม)" value={cardPrice} onChange={setCardPrice} />
        <ZenyInput label="ค่าแร่ต่อการตี 1 ครั้ง" value={orePrice} onChange={setOrePrice} />
      </form>
      <table className="stat-table" style={{ marginTop: 8 }}>
        <tbody>
          <tr>
            <td>ค่าตีบวก<span className="muted refcalc__sub">ต่อครั้ง {zeny(useMode === 'hd' ? ORE[gear].normal.feeZeny : (useMode === 'special' ? ORE[gear].special! : ORE[gear].normal).feeZeny)}{useMode === 'hd' ? ` · ครั้งที่ใช้ HD ${zeny(HD_FEE_ZENY)}` : ''} เสียทั้งตอนสำเร็จและตอนพัง</span></td>
            <td className="num">{zeny(plan.expectedFeeZeny)}</td>
          </tr>
          <tr>
            <td>ค่าแร่<span className="muted refcalc__sub">{count(plan.expectedAttempts)} ครั้ง × ค่าแร่ต่อครั้งที่กรอก (คู่มือไม่บอกว่าครั้งหนึ่งกินแร่กี่ก้อน)</span></td>
            <td className="num">{orePrice ? zeny(plan.expectedAttempts * orePrice) : '—'}</td>
          </tr>
          <tr>
            <td>ของกับการ์ดที่พังไป<span className="muted refcalc__sub">พังเฉลี่ย {count(broken)} ชิ้น · การ์ดหายไปพร้อมของ</span></td>
            <td className="num">{itemPrice || cardPrice ? zeny(broken * (itemPrice + cardPrice)) : '—'}</td>
          </tr>
          <tr className="refcalc__total">
            <td>รวมโดยเฉลี่ย</td>
            <td className="num">{zeny(total)}</td>
          </tr>
        </tbody>
      </table>

      {closed && <Curve runChance={closed.runChance} itemsFor50={closed.itemsFor50} itemsFor90={closed.itemsFor90} />}

      {/* A different setup starts a fresh run: the key remounts it. */}
      <Anvil key={`${gear}|${start}|${target}|${useMode}`} gear={gear} start={start} target={target} mode={useMode} hasSpecial={hasSpecial} />

      <details className="disclose">
        <summary>
          ทีละขั้น
          <span className="disclose__count">{steps.length} ขั้น</span>
        </summary>
        <div className="disclose__body">
          <table className="stat-table">
            <thead>
              <tr>
                <th scope="col">ขั้น</th>
                <th scope="col">แร่</th>
                <th scope="col">โอกาสสำเร็จ</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((s) => (
                <tr key={s.level}>
                  <th scope="row">+{s.level - 1} → +{s.level}</th>
                  <td>{s.hd ? 'HD (พลาดลด 1 ขั้น)' : 'พลาดของพัง'}</td>
                  <td className="num">{s.chance}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <Caveat label="ข้อจำกัดของตัวเลขนี้">
        แร่ธรรมดากับแร่เข้มข้น ตีพังแล้ว<strong>ของหายพร้อมการ์ด</strong> เริ่มใหม่ที่ +0 ด้วยของชิ้นใหม่ ·
        แร่ HD ใช้ได้เฉพาะของที่อยู่ +{HD_FROM} ถึง +{HD_TO} พลาดแล้วลด 1 ขั้น คู่มือไม่ได้แยกโอกาสของ HD
        เว็บนี้ใช้โอกาสเท่าแร่ธรรมดาแบบเวอร์ชันอื่น · ค่าตี HD {zeny(HD_FEE_ZENY)} ต่อครั้งตามคู่มือ
      </Caveat>
    </div>
  );
}

/** The expected items as a row of icons: the last one survives, the rest broke. */
function BurnPile({ gear, items }: { gear: GearType; items: number }) {
  const n = Math.max(1, Math.ceil(items));
  const shown = Math.min(n, 40);
  return (
    <div className="refpile" aria-label={`ใช้ของประมาณ ${n} ชิ้น พัง ${n - 1} ชิ้น`}>
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className={i === shown - 1 ? 'refpile__item is-kept' : 'refpile__item'}>
          <img src={ICON[gear]} alt="" width={24} height={24} />
        </span>
      ))}
      {n > shown && <span className="refpile__more mono">+{(n - shown).toLocaleString('en-US')}</span>}
      <span className="refpile__legend">ไอคอนละ 1 ชิ้น · ชิ้นสุดท้ายคือตัวที่ได้ ที่เหลือพัง</span>
    </div>
  );
}

/** Bars: each step's chance. The line: how many items in 100 are still alive after it. */
function Ladder({ steps, start }: { steps: { level: number; chance: number; hd: boolean }[]; start: number }) {
  const W = 600;
  const H = 180;
  const pad = 24;
  const bw = (W - pad) / steps.length;
  let alive = 100;
  const line = steps.map((s, i) => {
    alive = s.hd ? alive : (alive * s.chance) / 100;
    return `${pad + bw * i + bw / 2},${H - 20 - ((H - 40) * alive) / 100}`;
  });
  return (
    <figure className="refladder">
      <figcaption>บันไดตีบวก · แท่ง = โอกาสแต่ละขั้น · เส้น = % ของที่ยังไม่พังเมื่อผ่านขั้นนั้น{start > 0 ? ` (เริ่มที่ +${start})` : ''}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="โอกาสตีบวกแต่ละขั้น">
        <line x1={pad} y1={H - 20} x2={W} y2={H - 20} className="refladder__axis" />
        {steps.map((s, i) => {
          const h = ((H - 40) * s.chance) / 100;
          return (
            <g key={s.level}>
              <rect x={pad + bw * i + 2} y={H - 20 - h} width={Math.max(2, bw - 4)} height={h} className={`refladder__bar ${band(s.chance)}${s.hd ? ' is-hd' : ''}`} rx={2} />
              {bw > 22 && <text x={pad + bw * i + bw / 2} y={H - 24 - h} className="refladder__pct">{s.chance}</text>}
              <text x={pad + bw * i + bw / 2} y={H - 5} className="refladder__lv">+{s.level}</text>
            </g>
          );
        })}
        <polyline points={line.join(' ')} className="refladder__line" />
      </svg>
    </figure>
  );
}

/** Chance of being done within N items: a rising curve with the 50% and 90% marks. */
function Curve({ runChance, itemsFor50, itemsFor90 }: { runChance: number; itemsFor50: number; itemsFor90: number }) {
  if (!Number.isFinite(itemsFor90) || runChance >= 100) return null;
  const max = Math.min(80, Math.max(4, Math.ceil(itemsFor90 * 1.4)));
  const W = 600;
  const H = 150;
  const pad = 30;
  const x = (n: number) => pad + ((W - pad - 10) * (n - 1)) / Math.max(1, max - 1);
  const y = (p: number) => H - 20 - ((H - 35) * p) / 100;
  const pts = Array.from({ length: max }, (_, i) => `${x(i + 1)},${y(chanceWithItems(runChance, i + 1))}`);
  return (
    <figure className="refcurve">
      <figcaption>เตรียมของกี่ชิ้น ถึงจะมีโอกาสได้ตามเป้ากี่ %</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`ต้องเตรียม ${itemsFor50} ชิ้นถึงมีโอกาส 50% และ ${itemsFor90} ชิ้นถึง 90%`}>
        {[50, 90].map((p) => <line key={p} x1={pad} x2={W - 10} y1={y(p)} y2={y(p)} className="refcurve__guide" />)}
        <polyline points={pts.join(' ')} className="refcurve__line" />
        {[[itemsFor50, 50], [itemsFor90, 90]].map(([n, p]) => (
          n <= max ? (
            <g key={p}>
              <circle cx={x(n)} cy={y(chanceWithItems(runChance, n))} r={5} className="refcurve__dot" />
              <text x={x(n)} y={y(chanceWithItems(runChance, n)) - 9} className="refcurve__label">{n} ชิ้น → {p}%</text>
            </g>
          ) : null
        ))}
        <text x={pad} y={H - 4} className="refcurve__axis">1 ชิ้น</text>
        <text x={W - 10} y={H - 4} className="refcurve__axis" textAnchor="end">{max} ชิ้น</text>
      </svg>
    </figure>
  );
}

/** "Try it": rolls the real chances, one attempt or straight to the target. */
function Anvil({ gear, start, target, mode, hasSpecial }: { gear: GearType; start: number; target: number; mode: OreMode; hasSpecial: boolean }) {
  const [level, setLevel] = useState(start);
  const [items, setItems] = useState(1);
  const [tries, setTries] = useState(0);
  const [last, setLast] = useState<'ok' | 'broke' | 'down' | null>(null);
  const [hit, setHit] = useState(0);
  const done = level >= target;

  function roll(lv: number): { next: number; out: 'ok' | 'broke' | 'down' } {
    const ore = oreAt(mode, lv);
    const chance = chanceAt(gear, lv + 1, ore === 'special' && hasSpecial);
    if (Math.random() * 100 < chance) return { next: lv + 1, out: 'ok' };
    return ore === 'hd' ? { next: lv - 1, out: 'down' } : { next: 0, out: 'broke' };
  }
  function once() {
    if (done) return;
    const r = roll(level);
    setLevel(r.next);
    setTries((t) => t + 1);
    if (r.out === 'broke') setItems((n) => n + 1);
    setLast(r.out);
    setHit((h) => h + 1);
  }
  function toTarget() {
    let lv = level;
    let n = 0;
    let broke = 0;
    let out: 'ok' | 'broke' | 'down' = 'ok';
    while (lv < target && n < 100000) {
      const r = roll(lv);
      lv = r.next;
      n += 1;
      out = r.out;
      if (r.out === 'broke') broke += 1;
    }
    setLevel(lv);
    setTries((t) => t + n);
    setItems((i) => i + broke);
    setLast(out);
    setHit((h) => h + 1);
  }
  function reset() {
    setLevel(start);
    setItems(1);
    setTries(0);
    setLast(null);
  }

  return (
    <section className="refanvil" aria-labelledby="refanvil-h">
      <h3 id="refanvil-h" className="refcalc__h">ลองตีดู · สุ่มตามโอกาสจริง</h3>
      <div className="refanvil__stage">
        <div key={hit} className={`refanvil__item${last ? ` is-${last}` : ''}`}>
          <img src={ICON[gear]} alt="" width={48} height={48} />
          <b className="mono">+{level}</b>
        </div>
        <img key={`h${hit}`} className="refanvil__hammer" src={ORE_ICON[gear]} alt="" width={28} height={28} aria-hidden="true" />
        <p className={`refanvil__msg mono${last ? ` is-${last}` : ''}`} aria-live="polite">
          {done ? `สำเร็จ! ได้ +${target}` : last === 'ok' ? 'SUCCESS!' : last === 'broke' ? 'พัง! ของชิ้นใหม่ เริ่ม +0' : last === 'down' ? 'พลาด ลด 1 ขั้น' : 'กดตีได้เลย'}
        </p>
      </div>
      <p className="refanvil__score mono">ตีไป {tries.toLocaleString('en-US')} ครั้ง · ใช้ของ {items.toLocaleString('en-US')} ชิ้น · พัง {(items - 1).toLocaleString('en-US')} ชิ้น</p>
      <div className="refanvil__btns">
        <button type="button" className="btn" onClick={once} disabled={done}>ตี 1 ครั้ง</button>
        <button type="button" className="btn" onClick={toTarget} disabled={done}>ตีรวดจนได้ +{target}</button>
        <button type="button" className="refanvil__reset" onClick={reset}>เริ่มใหม่</button>
      </div>
    </section>
  );
}

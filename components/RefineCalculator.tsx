'use client';

// The refine cost calculator.
//
// The guide gives one number per step and stops. This turns that into the
// number a player actually needs before walking to the NPC: how many spare
// pieces of equipment to bring, and how much Zeny the failures will eat.

import { useMemo, useState } from 'react';
import { refineCost, oreFor } from '@/lib/refine-cost';
import {
  GEAR_LABELS,
  GEAR_TYPES,
  MAX_REFINE,
  ORE,
  type GearType,
} from '@/lib/refine-table';

const LEVELS = Array.from({ length: MAX_REFINE }, (_, i) => i + 1);

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

export default function RefineCalculator() {
  const [gear, setGear] = useState<GearType>('weapon3');
  const [target, setTarget] = useState(7);
  const [from, setFrom] = useState(0);
  const [special, setSpecial] = useState(false);

  const hasSpecial = ORE[gear].special !== null;
  const useSpecial = special && hasSpecial;

  // Changing the equipment type can leave the start above the target, so the
  // start is clamped here rather than letting refineCost throw at the user.
  const start = Math.min(from, target - 1);
  const cost = useMemo(
    () => refineCost(gear, target, useSpecial, start),
    [gear, target, useSpecial, start],
  );
  const spec = oreFor(gear, useSpecial);

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <h2 className="section-title">ตีถึง +{target} ต้องเตรียมเท่าไร</h2>

      <form className="charbar__form" onSubmit={(e) => e.preventDefault()}>
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
          <select
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
          >
            {LEVELS.map((n) => (
              <option key={n} value={n} disabled={n <= start}>
                +{n}
              </option>
            ))}
          </select>
        </label>

        <label>
          แร่
          <select
            value={useSpecial ? 'special' : 'normal'}
            onChange={(e) => setSpecial(e.target.value === 'special')}
            disabled={!hasSpecial}
          >
            <option value="normal">{ORE[gear].normal.ore}</option>
            {hasSpecial && <option value="special">{ORE[gear].special?.ore}</option>}
          </select>
        </label>
      </form>

      <table className="stat-table" style={{ marginTop: 12 }}>
        <tbody>
          <tr>
            <td>ของ 1 ชิ้นรอดถึง +{target}</td>
            <td className="num">{cost.runChance.toFixed(cost.runChance < 1 ? 3 : 1)}%</td>
          </tr>
          <tr>
            <td>
              <strong>ต้องเตรียมของกี่ชิ้น</strong>
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                โดยเฉลี่ย นับชิ้นที่สำเร็จด้วย
              </span>
            </td>
            <td className="num">
              <strong>{count(cost.expectedItems)} ชิ้น</strong>
            </td>
          </tr>
          <tr>
            <td>
              เตรียม {cost.itemsFor50} ชิ้น สำเร็จ 50%
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                คนครึ่งหนึ่งใช้ไม่เกินจำนวนนี้ — ค่าเฉลี่ยข้างบนถูกดึงสูงด้วยคนดวงซวย
              </span>
            </td>
            <td className="num">
              {Number.isFinite(cost.itemsFor90) ? `${cost.itemsFor90} ชิ้น สำเร็จ 90%` : '—'}
            </td>
          </tr>
          <tr>
            <td>{spec.ore} ที่ใช้</td>
            <td className="num">{count(cost.expectedOre)} ก้อน</td>
          </tr>
          <tr>
            <td>
              ค่าตีบวก
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {zeny(spec.feeZeny)} ต่อครั้ง เสียทั้งครั้งที่สำเร็จและครั้งที่พัง
              </span>
            </td>
            <td className="num">{zeny(cost.expectedFeeZeny)}</td>
          </tr>
          <tr>
            <td>
              ค่าแร่
              {spec.oreZeny === null && (
                <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                  {spec.ore} ดรอปจากมอนสเตอร์ คู่มือไม่ได้ให้ราคา NPC ไว้
                </span>
              )}
            </td>
            <td className="num">
              {spec.oreZeny === null ? (
                <span className="muted">ราคาตลาด × {count(cost.expectedOre)}</span>
              ) : (
                zeny(cost.expectedOreZeny ?? 0)
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <h3 className="section-title" style={{ marginTop: 18, fontSize: 16 }}>
        ทีละขั้น
      </h3>
      <table className="stat-table">
        <thead>
          <tr>
            <th scope="col">ขั้น</th>
            <th scope="col">โอกาสสำเร็จ</th>
            <th scope="col">ของ 1 ชิ้นมาถึงขั้นนี้</th>
          </tr>
        </thead>
        <tbody>
          {cost.steps.map((step) => (
            <tr key={step.level}>
              <th scope="row">
                +{step.level - 1} → +{step.level}
              </th>
              <td className="num">{step.chance}%</td>
              <td className="num">{step.reach.toFixed(step.reach < 1 ? 2 : 1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="ceiling-note" style={{ marginTop: 14 }}>
        คิดแบบตีพัง <strong>ของหาย</strong> ซึ่งเป็นสิ่งที่แร่ธรรมดากับแร่เข้มข้นทำ — พังแล้วเริ่มใหม่ที่ +0
        ด้วยของชิ้นใหม่ · แร่ HD ไม่ทำแบบนั้น (ลดขั้นตีบวกลง 1 แทนที่จะทำของหาย)
        คนละเกมกันคนละวิธีคิด เว็บนี้ยังไม่คิดให้
      </p>
    </div>
  );
}

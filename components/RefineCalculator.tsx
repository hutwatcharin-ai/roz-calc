'use client';

// The refine cost calculator.
//
// The guide gives one number per step and stops. This turns that into the
// number a player actually needs before walking to the NPC: how many spare
// pieces of equipment to bring, and how much Zeny the failures will eat.

import Caveat from '@/components/Caveat';
import { useMemo, useState } from 'react';
import { useToolUse } from '@/lib/use-tool-use';
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
  useToolUse('refine', { gear, target, from, special });

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

      {/* The number first, the controls that produced it second. A reader who
          arrived asking "what does +7 cost" should not have to operate four
          selects before seeing an answer -- the defaults already answer it. */}
      <div className="answer">
        <span className="answer__value">{count(cost.expectedItems)}</span>
        <span className="answer__unit">ชิ้น โดยเฉลี่ย</span>
      </div>
      <p className="answer__caption">
        เตรียม {cost.itemsFor50} ชิ้นสำเร็จ 50%
        {Number.isFinite(cost.itemsFor90) && ` · ${cost.itemsFor90} ชิ้นสำเร็จ 90%`} ·
        ของ 1 ชิ้นรอดถึง +{target} {cost.runChance.toFixed(cost.runChance < 1 ? 3 : 1)}%
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
            <td>
              ตีทั้งหมดกี่ครั้ง
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                นับครั้งที่พังด้วย
              </span>
            </td>
            <td className="num">{count(cost.expectedAttempts)} ครั้ง</td>
          </tr>
          <tr>
            <td>
              {spec.ore} ที่ใช้
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                คู่มือไม่ได้บอกว่าตีหนึ่งครั้งกินแร่กี่ก้อน — เว็บนี้จึงไม่สรุปให้
              </span>
            </td>
            <td className="num">
              <span className="muted">{count(cost.expectedAttempts)} × จำนวนก้อนต่อครั้ง</span>
            </td>
          </tr>
          <tr>
            <td>
              ค่าตีบวก
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {zeny(spec.feeZeny)} ต่อครั้ง เสียทั้งครั้งที่สำเร็จและครั้งที่พัง ·
                ตัวเลขนี้แน่นอน ไม่ขึ้นกับจำนวนแร่
              </span>
            </td>
            <td className="num">{zeny(cost.expectedFeeZeny)}</td>
          </tr>
          <tr>
            <td>
              ค่าแร่
              <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                {spec.oreZeny === null
                  ? `${spec.ore} ดรอปจากมอนสเตอร์ คู่มือไม่ได้ให้ราคา NPC ไว้`
                  : 'ต่อหนึ่งก้อนต่อหนึ่งครั้ง คูณจำนวนก้อนต่อครั้งเอง'}
              </span>
            </td>
            <td className="num">
              {spec.oreZeny === null ? (
                <span className="muted">ราคาตลาด × {count(cost.expectedAttempts)} × ก้อนต่อครั้ง</span>
              ) : (
                <span className="muted">{zeny(cost.expectedOreZenyPerPiece ?? 0)} × ก้อนต่อครั้ง</span>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <details className="disclose">
        <summary>
          ทีละขั้น
          <span className="disclose__count">{cost.steps.length} ขั้น</span>
        </summary>
        <div className="disclose__body">
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
        </div>
      </details>

      <p className="source-note">
        <strong>ตีหนึ่งครั้งกินแร่กี่ก้อน ยังไม่มีใครตีพิมพ์</strong> — ตารางวัตถุดิบของคู่มือไม่มีคอลัมน์จำนวน
        และเว็บอื่นที่ถอดหน้าเดียวกันก็ไม่มี เว็บนี้จึงบอกเป็น &ldquo;จำนวนครั้ง&rdquo; แล้วปล่อยให้คูณเอง
        · ค่าธรรมเนียมไม่กระทบ เพราะคิดต่อครั้ง
      </p>

      <Caveat label="ข้อจำกัดของตัวเลขนี้">
        คิดแบบตีพัง <strong>ของหาย</strong> ซึ่งเป็นสิ่งที่แร่ธรรมดากับแร่เข้มข้นทำ — พังแล้วเริ่มใหม่ที่ +0
        ด้วยของชิ้นใหม่ และ<strong>การ์ดที่ใส่ไว้หายไปด้วย</strong> ซึ่งตัวเลข Zeny ข้างบนไม่ได้ตีราคาให้
        · แร่ HD ไม่ทำแบบนั้น (ลดขั้นลง 1 แทน) แต่ใช้ได้เฉพาะของที่อยู่ที่ +7 ถึง +9 คนละวิธีคิด เว็บนี้ยังไม่คิดให้
      </Caveat>
    </div>
  );
}

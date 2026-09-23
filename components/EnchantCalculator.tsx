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

import { useMemo, useState } from 'react';
import Caveat from '@/components/Caveat';
import { useToolUse } from '@/lib/use-tool-use';
import { planFor } from '@/lib/enchant-odds';
import type { EnchantOutcome } from '@/lib/memorial-gear';

type Slot = 'armor' | 'garment' | 'shoes';

const SLOT_LABELS: Record<Slot, string> = { armor: 'เกราะ', garment: 'ผ้าคลุม', shoes: 'รองเท้า' };

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

  useToolUse('enchant', { slot, stat: chosen ? `${chosen.stat} ${chosen.value}` : '', count });

  return (
    <div className="card enchcalc">
      <div className="enchcalc__controls">
        <label>
          <span>ใส่ที่</span>
          <select value={slot} onChange={(e) => setSlot(e.target.value as Slot)}>
            {(Object.keys(SLOT_LABELS) as Slot[]).map((s) => (
              <option key={s} value={s}>{SLOT_LABELS[s]}</option>
            ))}
          </select>
        </label>
        <label>
          <span>อยากได้</span>
          <select value={chosen?.index ?? 0} onChange={(e) => setPick(Number(e.target.value))}>
            {available.map((o) => (
              <option key={o.index} value={o.index}>
                {o.stat} {o.value} ({o[slot]}%)
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>ลองกี่ครั้ง</span>
          <input
            type="number"
            min={1}
            max={999}
            value={count}
            onChange={(e) => setCount(Math.max(1, Math.min(999, Number(e.target.value) || 1)))}
          />
        </label>
      </div>

      <div className="enchcalc__out">
        <div className="enchcalc__big">
          <span className="enchcalc__label">ลอง {count} ครั้ง ได้อย่างน้อยหนึ่งครั้ง</span>
          <strong>{plan.withinPct.toFixed(1)}%</strong>
        </div>
        <dl className="enchcalc__grid">
          <div>
            <dt>โอกาสต่อครั้ง</dt>
            <dd>{rate?.toFixed(2)}%</dd>
          </div>
          <div>
            <dt>เฉลี่ยกี่ครั้งถึงติด</dt>
            <dd>{tries(plan.expectedTries)}</dd>
          </div>
          <div>
            <dt>ค่าเอนแชนต์เฉลี่ย</dt>
            <dd>{zeny(plan.expectedZeny)}</dd>
          </div>
          <div>
            <dt>ครึ่งต่อครึ่งที่ครั้งที่</dt>
            <dd>{tries(plan.triesFor50)}</dd>
          </div>
          <div>
            <dt>9 ใน 10 ที่ครั้งที่</dt>
            <dd>{tries(plan.triesFor90)}</dd>
          </div>
          <div>
            <dt>เงินสำหรับ {count} ครั้ง</dt>
            <dd>{zeny(count * zenyPerTry)}</dd>
          </div>
        </dl>
      </div>

      <Caveat>
        นับเฉพาะ<strong>ค่าใส่เอนแชนต์</strong>ครั้งละ {zenyPerTry.toLocaleString('en-US')} Zeny ·
        ถ้าของมีเอนแชนต์อยู่แล้วต้องถอดก่อน ซึ่งเป็นค่าใช้จ่ายคนละก้อนและ<strong>ถอดด้วยเงินมีโอกาสของหาย 30%</strong> ·
        &quot;เฉลี่ย&quot; คือค่าเฉลี่ยระยะยาว ไม่ใช่จำนวนครั้งที่การันตี
      </Caveat>
    </div>
  );
}

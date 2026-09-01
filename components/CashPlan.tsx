'use client';

// Cash-shop top-up basket (feature pass, 2 Sep): pick items, see the KP
// total, and get told exactly which gnjoy packs to buy and what it costs in
// baht. State lives in this provider + localStorage so the basket survives a
// reload; it is per-browser, same as the farm plan.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { THB_PER_KP, topUpPlan } from '@/lib/cash-shop-analysis';

interface Entry {
  id: number;
  name: string;
  kp: number;
  qty: number;
}

interface CashPlanValue {
  entries: Entry[];
  add: (id: number, name: string, kp: number) => void;
  remove: (id: number) => void;
  qtyOf: (id: number) => number;
  clear: () => void;
  ready: boolean;
}

const Ctx = createContext<CashPlanValue>({
  entries: [],
  add: () => {},
  remove: () => {},
  qtyOf: () => 0,
  clear: () => {},
  ready: false,
});

const KEY = 'roz-calc:cash-plan';

function read(): Entry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((e) => e && typeof e.id === 'number' && typeof e.kp === 'number') : [];
  } catch {
    return [];
  }
}

function write(entries: Entry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    /* private mode: basket just won't survive a reload */
  }
}

export function CashPlanProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(read());
    setReady(true);
  }, []);

  function commit(next: Entry[]) {
    setEntries(next);
    write(next);
  }

  const value: CashPlanValue = {
    entries,
    ready,
    add: (id, name, kp) => {
      const found = entries.find((e) => e.id === id);
      commit(found
        ? entries.map((e) => (e.id === id ? { ...e, qty: e.qty + 1 } : e))
        : [...entries, { id, name, kp, qty: 1 }]);
    },
    remove: (id) => {
      const found = entries.find((e) => e.id === id);
      if (!found) return;
      commit(found.qty > 1
        ? entries.map((e) => (e.id === id ? { ...e, qty: e.qty - 1 } : e))
        : entries.filter((e) => e.id !== id));
    },
    qtyOf: (id) => entries.find((e) => e.id === id)?.qty ?? 0,
    clear: () => commit([]),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function CashPlanButton({ id, name, kp }: { id: number; name: string; kp: number }) {
  const { add, remove, qtyOf, ready } = useContext(Ctx);
  if (!ready) return null;
  const qty = qtyOf(id);
  return (
    <span className="cashplan__btns">
      {qty > 0 && (
        <>
          <button type="button" className="cashplan__step" aria-label={`เอา ${name} ออก 1 ชิ้น`} onClick={() => remove(id)}>−</button>
          <span className="mono cashplan__qty">{qty}</span>
        </>
      )}
      <button type="button" className="cashplan__step" aria-label={`เพิ่ม ${name} เข้าแผนเติมเงิน`} onClick={() => add(id, name, kp)}>+</button>
    </span>
  );
}

export function CashPlanBar() {
  const { entries, clear, ready } = useContext(Ctx);
  if (!ready || entries.length === 0) return null;
  const totalKp = entries.reduce((sum, e) => sum + e.kp * e.qty, 0);
  const totalItems = entries.reduce((sum, e) => sum + e.qty, 0);
  const plan = topUpPlan(totalKp);
  return (
    <div className="cashplan__bar" role="status">
      <div className="shell cashplan__bar-in">
        <span>
          <b>{totalItems}</b> ชิ้น · <b className="mono">{totalKp.toLocaleString('en-US')}</b> KP
          <span className="mono"> ≈ ฿{(totalKp * THB_PER_KP).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
        </span>
        <span className="cashplan__plan">
          เติม {plan.packs.map((p) => `${p.size.toLocaleString('en-US')}${p.count > 1 ? `×${p.count}` : ''}`).join(' + ')} ={' '}
          <b className="mono">฿{plan.thb.toLocaleString('en-US')}</b>
          {plan.leftoverKp > 0 && <span className="muted"> (เหลือ {plan.leftoverKp.toLocaleString('en-US')} KP)</span>}
        </span>
        <button type="button" className="cashplan__clear" onClick={clear}>ล้าง</button>
      </div>
    </div>
  );
}

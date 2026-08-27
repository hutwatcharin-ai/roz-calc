'use client';

// Holds the farm plan for the whole app so the "add to plan" button on a
// monster page and the planner page itself agree without a page reload.
// Mirrors CharacterContextProvider rather than inventing a second pattern.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  MAX_PLAN_SIZE,
  addToPlan,
  readFarmPlan,
  removeFromPlan,
  writeFarmPlan,
} from '@/lib/farm-plan';

interface FarmPlanValue {
  plan: number[];
  add: (monsterId: number) => void;
  remove: (monsterId: number) => void;
  has: (monsterId: number) => boolean;
  full: boolean;
  /** False once storage has refused a write, so the UI can say so. */
  persisted: boolean;
  /** False until storage has been read, so nothing claims an empty plan early. */
  ready: boolean;
}

const Ctx = createContext<FarmPlanValue>({
  plan: [],
  add: () => {},
  remove: () => {},
  has: () => false,
  full: false,
  persisted: true,
  ready: false,
});

// Touching window.localStorage can itself throw, so this is guarded too.
function browserStorage() {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function FarmPlanProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<number[]>([]);
  const [ready, setReady] = useState(false);
  const [persisted, setPersisted] = useState(true);

  useEffect(() => {
    setPlan(readFarmPlan(browserStorage()));
    setReady(true);
  }, []);

  function commit(next: number[]) {
    setPlan(next);
    setPersisted(writeFarmPlan(browserStorage(), next));
  }

  const value: FarmPlanValue = {
    plan,
    add: (monsterId) => commit(addToPlan(plan, monsterId)),
    remove: (monsterId) => commit(removeFromPlan(plan, monsterId)),
    has: (monsterId) => plan.includes(monsterId),
    full: plan.length >= MAX_PLAN_SIZE,
    persisted,
    ready,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useFarmPlan(): FarmPlanValue {
  return useContext(Ctx);
}

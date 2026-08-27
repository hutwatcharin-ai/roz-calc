import { describe, it, expect } from 'vitest';
import {
  FARM_PLAN_STORAGE_KEY,
  MAX_PLAN_SIZE,
  addToPlan,
  parseFarmPlan,
  readFarmPlan,
  removeFromPlan,
  writeFarmPlan,
  type StorageLike,
} from './farm-plan';

function memoryStorage(initial: Record<string, string> = {}): StorageLike {
  const store = { ...initial };
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
  };
}

describe('parseFarmPlan', () => {
  it('reads a plain list of ids', () => {
    expect(parseFarmPlan('[1002, 1004]')).toEqual([1002, 1004]);
  });

  it('returns an empty plan rather than throwing on rubbish', () => {
    expect(parseFarmPlan(null)).toEqual([]);
    expect(parseFarmPlan('not json')).toEqual([]);
    expect(parseFarmPlan('{"monsters":[1]}')).toEqual([]);
  });

  it('drops entries that are not monster ids', () => {
    // A stored payload can be stale, hand-edited, or written by another app on
    // the same origin. Anything that is not a positive integer would become a
    // query parameter on the planner page.
    expect(parseFarmPlan('[1002, "1004", null, -5, 0, 3.5, 1006]')).toEqual([1002, 1006]);
  });

  it('drops duplicates so the planner never counts a monster twice', () => {
    expect(parseFarmPlan('[1002, 1002, 1004]')).toEqual([1002, 1004]);
  });

  it('caps the list so a corrupted value cannot fetch thousands of rows', () => {
    const huge = JSON.stringify(Array.from({ length: 500 }, (_, i) => i + 1));
    expect(parseFarmPlan(huge)).toHaveLength(MAX_PLAN_SIZE);
  });
});

describe('readFarmPlan', () => {
  it('returns an empty plan when storage is unusable', () => {
    expect(readFarmPlan(null)).toEqual([]);
  });

  it('survives storage that throws', () => {
    // Safari private mode and blocked site data throw on access rather than
    // returning null. The planner page must still render.
    const hostile: StorageLike = {
      getItem() {
        throw new Error('SecurityError');
      },
      setItem() {},
    };
    expect(readFarmPlan(hostile)).toEqual([]);
  });

  it('reads what was written', () => {
    const storage = memoryStorage();
    writeFarmPlan(storage, [1002, 1004]);
    expect(storage.getItem(FARM_PLAN_STORAGE_KEY)).toBe('[1002,1004]');
    expect(readFarmPlan(storage)).toEqual([1002, 1004]);
  });
});

describe('writeFarmPlan', () => {
  it('reports failure instead of pretending the plan was saved', () => {
    const hostile: StorageLike = {
      getItem: () => null,
      setItem() {
        throw new Error('QuotaExceededError');
      },
    };
    expect(writeFarmPlan(hostile, [1002])).toBe(false);
    expect(writeFarmPlan(memoryStorage(), [1002])).toBe(true);
  });
});

describe('addToPlan / removeFromPlan', () => {
  it('adds once and keeps the order the player added things in', () => {
    expect(addToPlan([1002], 1004)).toEqual([1002, 1004]);
    expect(addToPlan([1002, 1004], 1002)).toEqual([1002, 1004]);
  });

  it('refuses to grow past the cap instead of dropping the oldest entry', () => {
    // Silently evicting a monster the player added is worse than saying the
    // plan is full: the player would not know the list changed.
    const full = Array.from({ length: MAX_PLAN_SIZE }, (_, i) => i + 1);
    expect(addToPlan(full, 9999)).toEqual(full);
  });

  it('ignores a value that is not a monster id', () => {
    expect(addToPlan([1002], 0)).toEqual([1002]);
    expect(addToPlan([1002], -1)).toEqual([1002]);
    expect(addToPlan([1002], 1.5)).toEqual([1002]);
  });

  it('removes only the id asked for', () => {
    expect(removeFromPlan([1002, 1004], 1002)).toEqual([1004]);
    expect(removeFromPlan([1002, 1004], 9999)).toEqual([1002, 1004]);
  });
});

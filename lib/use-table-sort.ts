'use client';

// Click-to-sort for data tables. One hook, three tables (farming, AFK, map):
// click a header to sort by that column, click again to flip direction,
// null/unknown values always sink to the bottom in either direction so a
// missing HP can never "win" a sort.
import { useState } from 'react';

export interface TableSort {
  key: string | null;
  desc: boolean;
}

export function useTableSort(): {
  sort: TableSort;
  toggle: (key: string, defaultDesc?: boolean) => void;
  indicator: (key: string) => string;
} {
  const [sort, setSort] = useState<TableSort>({ key: null, desc: true });

  function toggle(key: string, defaultDesc = true) {
    setSort((prev) => (prev.key === key ? { key, desc: !prev.desc } : { key, desc: defaultDesc }));
  }

  function indicator(key: string): string {
    if (sort.key !== key) return '↕';
    return sort.desc ? '↓' : '↑';
  }

  return { sort, toggle, indicator };
}

// Comparator over a value extractor; nulls sink regardless of direction.
export function bySorted<T>(rows: T[], sort: TableSort, pick: (row: T, key: string) => number | string | null): T[] {
  if (!sort.key) return rows;
  const key = sort.key;
  const dir = sort.desc ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = pick(a, key);
    const vb = pick(b, key);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    if (typeof va === 'string' || typeof vb === 'string') {
      return dir * String(va).localeCompare(String(vb));
    }
    return dir * (va - vb);
  });
}

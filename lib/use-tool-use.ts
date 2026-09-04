'use client';

// Reports tool_use the first time a calculator's inputs change after it is
// ready, and never again on that page.
//
// Watching the inputs rather than wiring every onChange means one line per
// tool. `armed` exists because several tools load remembered numbers from
// localStorage in a mount effect: that first change is the browser's, not the
// player's, so the baseline is taken from the first armed render instead.

import { useEffect, useRef } from 'react';
import { reportToolUse, type EventParams } from '@/lib/analytics';

export function useToolUse(tool: string, params: EventParams, armed: boolean = true): void {
  const key = JSON.stringify(params);
  const baseline = useRef<string | null>(null);

  useEffect(() => {
    if (!armed) return;
    if (baseline.current === null) {
      baseline.current = key;
      return;
    }
    if (key === baseline.current) return;
    reportToolUse(tool, params);
    // params is what key serialises; listing it too would re-run on every
    // render for object identity alone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tool, key, armed]);
}

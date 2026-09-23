'use client';

// Loads the farm tool's one payload once per page view. Every mode reads the
// same copy, so switching tabs never refetches and never disagrees.

import { useCallback, useEffect, useState } from 'react';
import type { FarmData } from './farm-engine/types';
import { FARM_DATA_URL } from './farm-data-url';

export { FARM_DATA_URL } from './farm-data-url';

export function useFarmData(): { data: FarmData | null; failed: boolean; retry: () => void } {
  const [data, setData] = useState<FarmData | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setFailed(false);
    // The page starts this fetch in an inline script before hydration; take
    // that promise when it exists rather than asking for the file twice.
    const started = (window as unknown as { __farmData?: Promise<FarmData> }).__farmData;
    (started ?? fetch(FARM_DATA_URL).then((res) => (res.ok ? res.json() : Promise.reject(new Error(`HTTP ${res.status}`)))))
      .then((json: FarmData) => {
        if (live) setData(json);
      })
      .catch((err) => {
        console.error('farm data load failed', err);
        if (live) setFailed(true);
      });
    return () => {
      live = false;
    };
  }, [attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { data, failed, retry };
}
